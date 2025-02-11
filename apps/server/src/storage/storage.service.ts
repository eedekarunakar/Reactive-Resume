import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from "@nestjs/common";
import { RedisService } from "@songkeys/nestjs-redis";
import { Redis } from "ioredis";
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

type ImageUploadType = "pictures" | "previews";
type DocumentUploadType = "resumes";
export type UploadType = ImageUploadType | DocumentUploadType;

const PUBLIC_ACCESS_POLICY = {
  Version: "2012-10-17",
  Statement: [
    {
      Sid: "PublicAccess",
      Effect: "Allow",
      Action: ["s3:GetObject"],
      Principal: { AWS: ["*"] },
      Resource: [
        "arn:aws:s3:::talentstream-resume",
        "arn:aws:s3:::talentstream-resume/*"
      ],
    },
  ],
};

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly redis: Redis;
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getClient();

    const region = "ap-south-1"; // ✅ Directly setting AWS region
    this.bucketName = "talentstream-resume"; // ✅ Directly setting S3 bucket name

    // ✅ AWS SDK will automatically retrieve IAM Role credentials on EC2
    this.s3Client = new S3Client({ region: region });
  }

  async onModuleInit() {
    try {
      await this.bucketExists();
      this.logger.log("Successfully connected to the storage service.");
    } catch (error) {
      this.logger.error("Error checking if the bucket exists", error);
      throw new InternalServerErrorException("There was an error while checking if the storage bucket exists.", error);
    }
  }

  async bucketExists() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
    } catch (error) {
      this.logger.error("Error in bucketExists method", {
        bucketName: this.bucketName,
        errorCode: error.name,
        errorMessage: error.message,
        requestId: error.requestId,
        statusCode: error.$metadata?.httpStatusCode,
      });
      if (error.name === "NotFound") {
        throw new InternalServerErrorException(`Bucket ${this.bucketName} does not exist.`);
      }
      throw error;
    }
  }

  async uploadObject(
    userId: string,
    type: UploadType,
    buffer: Buffer,
    filename: string
  ) {
    const extension = type === "resumes" ? "pdf" : "jpg";
    const filepath = `${userId}/${type}/${filename}.${extension}`;
    const url = `https://${this.bucketName}.s3.ap-south-1.amazonaws.com/${filepath}`;
    const metadata =
      extension === "jpg"
        ? { "Content-Type": "image/jpeg" }
        : {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=${filename}.${extension}`,
          };

    try {
      if (extension === "jpg") {
        buffer = await sharp(buffer)
          .resize({ width: 600, height: 600, fit: sharp.fit.outside })
          .jpeg({ quality: 80 })
          .toBuffer();
      }

      const params = {
        Bucket: this.bucketName,
        Key: filepath,
        Body: buffer,
        ContentType: metadata["Content-Type"],
      };

      await this.s3Client.send(new PutObjectCommand(params));
      await this.redis.set(`user:${userId}:storage:${type}:${filename}`, url);

      return url;
    } catch (error) {
      this.logger.error("Error uploading the file", error);
      throw new InternalServerErrorException("There was an error while uploading the file.", error);
    }
  }

  async deleteObject(userId: string, type: UploadType, filename: string) {
    const extension = type === "resumes" ? "pdf" : "jpg";
    const path = `${userId}/${type}/${filename}.${extension}`;

    try {
      await this.redis.del(`user:${userId}:storage:${type}:${filename}`);
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: path,
        })
      );
    } catch (error) {
      this.logger.error(`Error deleting the document at the specified path: ${path}`, error);
      throw new InternalServerErrorException(
        `There was an error while deleting the document at the specified path: ${path}.`,
        error
      );
    }
  }

  async deleteFolder(prefix: string) {
    try {
      const listObjectsCommand = new ListObjectsV2Command({ Bucket: this.bucketName, Prefix: prefix });
      const objects = await this.s3Client.send(listObjectsCommand);

      if (objects.Contents && objects.Contents.length > 0) {
        const deleteObjectsCommand = new DeleteObjectsCommand({
          Bucket: this.bucketName,
          Delete: { Objects: objects.Contents.map((item) => ({ Key: item.Key })) },
        });
        await this.s3Client.send(deleteObjectsCommand);
      }
    } catch (error) {
      this.logger.error(`Error deleting the folder at the specified path: ${this.bucketName}/${prefix}`, error);
      throw new InternalServerErrorException(
        `There was an error while deleting the folder at the specified path: ${this.bucketName}/${prefix}.`,
        error
      );
    }
  }
}
