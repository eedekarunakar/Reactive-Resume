import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useUser } from "@/client/services/user";

export const AuthGuard = () => {
  const location = useLocation();
  const redirectTo = location.pathname + location.search;

  const token = new URLSearchParams(location.search).get("identifier");

  const { user, loading } = useUser();

  if (loading) return null;

  

  if (token){
    localStorage.clear();
}

   if (user) {
    console.log(token);
    console.log("came here");
    return <Outlet />;
  }

  return <Navigate to={`/auth/login?redirect=${redirectTo}`} replace />;
};
