import { t } from "@lingui/macro";
import { useCallback,useRef,useEffect } from "react";
import { HouseSimple, Lock, SidebarSimple,Download} from "@phosphor-icons/react";
import { Button, Tooltip } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { Link } from "react-router-dom";
import { ResumeDto } from "@reactive-resume/dto";
import { useLoaderData } from "react-router-dom";
import { redirect, LoaderFunction } from "react-router-dom";
import { useBuilderStore } from "@/client/stores/builder";
import { queryClient } from "@/client/libs/query-client";
import { useResumeStore } from "@/client/stores/resume";
import { ThemeSwitch } from "@/client/components/theme-switch";
import { CircleNotch, FilePdf } from "@phosphor-icons/react";
import { findResumeByUsernameSlug, usePrintResume } from "@/client/services/resume";

export const BuilderHeader = () => {
  //const title = useResumeStore((state) => state.resume.title);
  const locked = useResumeStore((state) => state.resume.locked);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const { printResume, loading } = usePrintResume();
  const { id,data: resume } = useLoaderData() as ResumeDto;

  const updateResumeInFrame = useCallback(() => {
    if (!frameRef.current || !frameRef.current.contentWindow) return;
    const message = { type: "SET_RESUME", payload: resume };
    (() => frameRef.current.contentWindow.postMessage(message, "*"))();
  }, [frameRef, resume]);

  useEffect(() => {
    if (!frameRef.current) return;
    frameRef.current.addEventListener("load", updateResumeInFrame);
    return () => frameRef.current?.removeEventListener("load", updateResumeInFrame);
  }, [frameRef]);

  useEffect(() => {
    if (!frameRef.current || !frameRef.current.contentWindow) return;

    const handleMessage = (event: MessageEvent) => {
      if (!frameRef.current || !frameRef.current.contentWindow) return;
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "PAGE_LOADED") {
        frameRef.current.width = event.data.payload.width;
        frameRef.current.height = event.data.payload.height;
        frameRef.current.contentWindow.removeEventListener("message", handleMessage);
      }
    };

    frameRef.current.contentWindow.addEventListener("message", handleMessage);

    return () => {
      frameRef.current?.contentWindow?.removeEventListener("message", handleMessage);
    };
  }, [frameRef]);

  const toggle = useBuilderStore((state) => state.toggle);
  const isDragging = useBuilderStore(
    (state) => state.panel.left.handle.isDragging || state.panel.right.handle.isDragging,
  );
  const leftPanelSize = useBuilderStore((state) => state.panel.left.size);
  const rightPanelSize = useBuilderStore((state) => state.panel.right.size);

  const onToggle = (side: "left" | "right") => toggle(side);

  const onDownloadPdf = async () => {
   const { url } = await printResume({ id });

    const openInNewTab = (url: string) => {
      const win = window.open(url, "_blank");
      if (win) win.focus();
    };

   openInNewTab(url);
  };

  return (
    <div
      style={{ left: `${leftPanelSize}%`, right: `${rightPanelSize}%` }}
      className={cn(
        "fixed inset-x-0 top-0 z-[60] h-16 bg-secondary-accent/50 backdrop-blur-lg lg:z-20",
        !isDragging && "transition-[left,right]",
      )}
    >
      <div className="flex h-full items-center justify-between px-4">
        <Button
          size="icon"
          variant="ghost"
          className="flex lg:hidden"
          onClick={() => onToggle("left")}
        >
          {/* <SidebarSimple /> */}
        <svg fill="none" height="20px" viewBox="0 0 142 174" width="20px" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0)"><path d="M141.131 92.1921C141.311 108.696 141.551 125.2 141.638 141.704C141.669 147.538 141.211 153.372 141.178 159.207C141.133 167.576 134.667 172.676 127.049 172.841C111.448 173.179 95.84 173.539 80.2375 173.462C62.1588 173.373 44.0806 172.895 26.0063 172.417C21.6324 172.223 17.2753 171.751 12.9616 171.003C7.99972 170.231 3.12713 164.299 2.86197 158.9C2.59943 153.523 2.38674 148.141 2.31651 142.758C1.99097 117.716 1.69815 92.6739 1.43825 67.6319C1.2781 52.9206 1.21648 38.208 0.990696 23.4975C0.925062 19.3278 0.623779 15.1447 2.31122 11.2296C3.21609 8.94785 4.44412 6.80819 5.95777 4.87582C7.82113 2.65609 10.5706 1.81459 13.5103 1.73386C19.5703 1.56715 25.6408 1.52787 31.6864 1.12816C53.0213 -0.280999 74.3528 0.819983 95.687 0.978816C100.224 1.01229 103.675 2.49382 107.022 5.67509C113.854 12.1676 121.186 18.1309 128.27 24.3602C130.967 26.7316 133.469 29.3277 136.206 31.6459C138.731 33.7862 139.712 36.4788 139.807 39.6489C139.974 45.2599 140.24 50.8726 140.319 56.481C140.485 68.3841 140.558 80.2901 140.67 92.1941L141.131 92.1921ZM93.829 9.36187C91.8455 9.20632 90.1876 8.98756 88.5257 8.95934C74.3817 8.72221 60.2373 8.50693 46.0923 8.31265C39.6983 8.22404 33.3035 8.18473 26.9088 8.14535C23.6593 8.125 20.4031 8.02281 17.1621 8.19215C12.6419 8.42777 11.2453 9.73401 10.4321 14.1755C9.62173 18.3692 9.43027 22.6593 9.86379 26.9087C10.1312 29.3632 10.2658 31.8304 10.2668 34.2995C10.335 73.9295 10.3864 113.559 10.4209 153.189C10.3998 153.975 10.4301 154.761 10.5116 155.542C11.1909 160.65 13.885 164.06 19.6858 164.289C41.3508 165.142 63.0147 165.151 84.6855 164.784C95.5748 164.599 106.465 164.507 117.355 164.383C120.046 164.353 122.743 164.453 125.428 164.325C130.119 164.101 132.47 161.752 132.428 157.164C132.344 148.19 132.131 139.217 131.953 130.245C131.861 125.644 131.765 121.042 131.608 116.442C131.239 105.562 130.653 94.6849 130.493 83.8015C130.31 71.5673 130.497 59.3278 130.511 47.0911C130.511 46.3402 130.416 45.5887 130.363 44.8201C129.982 44.7315 129.594 44.6715 129.204 44.6413C122.357 44.7791 115.512 44.9942 108.665 45.0349C106.534 45.0507 104.41 44.8058 102.338 44.3048C98.1148 43.2638 96.7858 41.6316 96.3394 37.2998C95.9371 33.3946 95.6759 29.4744 95.3254 25.5633C94.8528 20.3225 94.3573 15.0811 93.829 9.36378V9.36187ZM125.226 35.7468L125.381 35.0392L103.144 14.8606L102.633 15.1888C103.724 22.354 104.815 29.5192 105.94 36.9056L125.226 35.7468Z" fill="black"/><path d="M22.3865 38.9465C22.3865 35.6983 22.2994 32.4483 22.4083 29.2034C22.5527 24.9241 23.8036 23.6701 28.1132 23.3919C34.1423 23.0026 40.1774 22.6929 46.2098 22.3516C48.9237 22.1987 50.8953 23.533 51.5037 26.4556C52.0564 29.4243 52.4436 32.4212 52.6635 35.4328C53.036 38.659 53.2331 41.9035 53.2542 45.151C53.1614 47.3675 52.7733 49.5614 52.1003 51.6753C51.4295 53.96 49.5407 55.0688 47.2343 55.139C41.301 55.3208 35.3612 55.5524 29.4298 55.4441C23.8825 55.3424 22.8264 54.1408 22.4319 48.684C22.3105 47.009 22.2219 45.3294 22.176 43.6505C22.1333 42.0838 22.1667 40.5152 22.1667 38.9478L22.3865 38.9465ZM30.0658 47.0566C32.6571 47.9046 39.2231 47.6676 43.3239 46.5925V29.6213C39.7796 28.8337 31.3437 28.8993 28.824 29.7578L30.0658 47.0566Z" fill="black"/><path d="M69.2056 78.6196C82.5469 78.8887 95.8896 79.1329 109.23 79.465C110.679 79.5201 112.106 79.843 113.438 80.4173C114.072 80.6773 114.608 81.1301 114.971 81.7116C115.333 82.2938 115.503 82.9744 115.457 83.6583C115.469 84.3449 115.257 85.0156 114.853 85.5702C114.449 86.1255 113.875 86.5337 113.219 86.7333C111.394 87.2229 109.513 87.4684 107.623 87.4625C97.1957 87.2282 86.7738 86.7582 76.3465 86.583C66.8158 86.4222 57.2799 86.5541 47.7466 86.5173C41.915 86.4944 36.0821 86.4471 30.2532 86.2948C28.6926 86.1806 27.1472 85.9122 25.6398 85.4921C25.0796 85.3845 24.5779 85.076 24.2288 84.6251C23.8797 84.1742 23.7072 83.6111 23.7436 83.042C23.6921 82.4736 23.8464 81.9059 24.1782 81.4412C24.51 80.9772 24.9973 80.6477 25.5517 80.5119C26.6226 80.1988 27.7284 80.0203 28.8434 79.9802C42.2948 79.6179 55.7474 79.2786 69.201 78.9622C69.2023 78.8474 69.2036 78.7338 69.2056 78.6196Z" fill="black"/><path d="M23.3169 99.1059C24.1117 96.6085 26.0218 96.302 27.9606 96.1733C32.1047 95.899 36.252 95.557 40.402 95.496C62.6366 95.1691 84.8723 94.8909 107.109 94.6625C108.676 94.6211 110.242 94.7786 111.769 95.1311C112.582 95.2945 113.315 95.7283 113.851 96.3617C114.386 96.9951 114.692 97.7906 114.717 98.6195C114.744 99.4485 114.488 100.262 113.993 100.927C113.499 101.593 112.794 102.071 111.993 102.285C110.607 102.714 109.171 102.954 107.721 102.997C102.442 103.029 97.1635 102.951 91.8852 102.865C72.4576 102.539 53.03 102.194 33.6024 101.828C31.1412 101.78 28.68 101.456 26.2299 101.162C24.7104 100.974 24.7201 100.89 23.3169 99.1059Z" fill="black"/><path d="M75.4415 72.8886C65.897 72.8886 56.3513 72.7954 46.8088 72.9299C42.4382 72.991 38.0793 73.5252 33.7075 73.795C31.5803 73.9262 29.4413 74.0319 27.3154 73.9919C25.2604 73.9505 24.1085 73.1025 23.9786 71.826C23.8473 70.5021 24.7663 69.4763 26.8495 69.1967C32.5202 68.4366 38.1929 67.5447 43.8945 67.1955C64.0756 65.9596 84.2857 65.6853 104.502 65.8441C106.297 65.8224 108.093 65.9281 109.874 66.1611C111.869 66.4643 112.905 67.6707 112.874 69.2164C112.843 70.762 111.786 71.9126 109.784 72.1469C107.332 72.4396 104.866 72.5965 102.397 72.6175C93.4114 72.6707 84.4261 72.6385 75.4408 72.6385L75.4415 72.8886Z" fill="black"/><path d="M99.8012 136.229C96.7729 136.229 93.7446 136.274 90.7175 136.217C87.9091 136.164 86.5248 135.186 86.5032 133.4C86.4815 131.614 87.8283 130.668 90.6414 130.483C96.236 130.118 101.83 129.727 107.428 129.416C108.879 129.328 110.336 129.394 111.774 129.613C112.456 129.681 113.092 129.989 113.567 130.483C114.043 130.978 114.327 131.625 114.369 132.309C114.537 133.927 113.945 135.296 112.438 135.881C111.082 136.397 109.654 136.694 108.206 136.761C105.41 136.892 102.603 136.8 99.8006 136.8C99.8006 136.611 99.8012 136.42 99.8012 136.229Z" fill="black"/></g><defs><clipPath id="clip0"><rect fill="white" height="173.93" transform="translate(0.587891 0.0107422)" width="141.113"/></clipPath></defs></svg>
        </Button>

        {/* <div className="flex items-center justify-center gap-x-1 lg:mx-auto">
          <Button asChild size="icon" variant="ghost">
            <Link to="/dashboard/resumes">
              <HouseSimple />
            </Link>
          </Button>

          <span className="mr-2 text-xs opacity-40">{"/"}</span>

          <h1 className="font-medium">{title}</h1>

          {locked && (
            <Tooltip content={t`This resume is locked, please unlock to make further changes.`}>
              <Lock size={14} className="ml-2 opacity-75" />
            </Tooltip>
          )}
        </div> */}

        <Button
          size="icon"
          variant="ghost"
          className="flex lg:hidden"
          onClick={() => onToggle("right")}
        >
          {/* <SidebarSimple className="-scale-x-100" /> */}
          <svg enable-background="new 0 0 24 24" height="20px" id="Layer_1" version="1.1" viewBox="0 0 24 24" width="20px"  xmlns="http://www.w3.org/2000/svg"><g><path d="M23,0H1C0.4,0,0,0.4,0,1v17c0,0.6,0.4,1,1,1h8v2H7c-0.6,0-1,0.4-1,1v2h1h10h1v-2c0-0.6-0.4-1-1-1h-2v-2h8c0.6,0,1-0.4,1-1   V1C24,0.4,23.6,0,23,0z M17,22v1H7v-1h2h1h4h1H17z M10,21v-2h4v2H10z M22,17H2V2h20V17z"/><path d="M10,5v9l5-4.5L10,5z M11,7.3l2.5,2.2L11,11.8V7.3z"/></g></svg>
        </Button>
        <Button variant="outline" className="gap-x-2" onClick={onDownloadPdf}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 1.75a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 .75.75V4h1.25a.75.75 0 0 1 .75.75v11.5a.75.75 0 0 1-.75.75h-13a.75.75 0 0 1-.75-.75V4.75A.75.75 0 0 1 3 4h1.25V1.75zm1.5.75v1.5h9V2.5h-9zM14 11a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h1v2h6V11h1z"/>
  </svg>
        </Button>

          <Button variant="outline" className="gap-x-2" onClick={onDownloadPdf}>
            {loading ? <CircleNotch size={16} className="animate-spin" /> : <Download size={16} />}
            {/* eslint-disable-next-line lingui/no-unlocalized-strings */}
            {/* <span>{t`Download PDF`}</span> */}
          </Button>

          </div>
    </div>
  );
};
export const publicLoader: LoaderFunction<ResumeDto> = async ({ params }) => {
  try {
    const username = params.username as string;
    const slug = params.slug as string;

    const resume = await queryClient.fetchQuery({
      queryKey: ["resume", { username, slug }],
      queryFn: () => findResumeByUsernameSlug({ username, slug }),
    });

    return resume;
  } catch (error) {
    return redirect("/");
  }
};