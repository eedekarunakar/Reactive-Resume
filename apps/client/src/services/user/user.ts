import { UserDto } from "@reactive-resume/dto";
import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { useEffect } from "react";

import { axios } from "@/client/libs/axios";
import { useAuthStore } from "@/client/stores/auth";

export const fetchUser = async () => {
  const response = await axios.get<UserDto, AxiosResponse<UserDto>>("/user/me");

  return response.data;
};

export const useUser = () => {
  const setUser = useAuthStore((state) => state.setUser);

  const {
    error,
    isPending: loading,
    data: user,
  } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
  });

  useEffect(() => {
    setUser(user ? user : null);
  }, [user, setUser]);

  return { user: user, loading, error };
};

// export const fetchUser = async (userId?: string) => {
//   // Append userId to the endpoint URL if it's provided
//   const endpoint = userId ? `/user/${userId}` : "/user/me";
  
//   const response = await axios.get<UserDto, AxiosResponse<UserDto>>(endpoint);
//   return response.data;
// };

// export const useUser = (userId: string | null = null) => {
//   const setUser = useAuthStore((state) => state.setUser);

//   const {
//     error,
//     isPending: loading,
//     data: user,
//   } = useQuery({
//     queryKey: ["user"],
//     queryFn: () => fetchUser(userId ? userId : undefined),
//   });

//   useEffect(() => {
//     setUser(user ? user : null);
//   }, [user, setUser]);

//   return { user: user, loading, error };
// };


