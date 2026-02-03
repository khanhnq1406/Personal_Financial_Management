"use client";
import Link from "next/link";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

import { LOCAL_STORAGE_TOKEN_NAME, routes } from "@/app/constants";
import { store } from "@/redux/store";
import { setAuth } from "@/redux/actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutationLogin } from "@/utils/generated/hooks";
import { updateAuthTokenCache } from "@/utils/api-client";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState(<></>);
  const login = useMutationLogin({
    onError(error) {
      console.log(error);
      setError(
        <>
          <p>
            {error.message || "Opps, Something went wrong. Please try again."}
          </p>
        </>
      );
    },
    onSuccess(data) {
      if (data.data) {
        const token = data.data.accessToken;
        localStorage.setItem(LOCAL_STORAGE_TOKEN_NAME, token);
        updateAuthTokenCache(token); // Update in-memory cache
        store.dispatch(
          setAuth({
            isAuthenticated: true,
            email: data.data.email,
            fullname: data.data.fullname,
            picture: data.data.picture,
          })
        );
        router.push(routes.home);
      }
    },
  });
  useEffect(() => {
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_NAME);
    if (token) {
      router.push(routes.home);
    }
  }, []);
  const handleGoogleLogin = async (credentialResponse: any) => {
    await login.mutateAsync({
      token: credentialResponse.credential,
    });
  };
  const handleGoogleLoginError = () => {
    setError(
      <>
        <p>Opps, Something went wrong. Please try again.</p>
      </>
    );
  };
  return (
    <div className="flex items-center h-screen">
      <div className="flex justify-center items-center flex-col w-full">
        <div className="w-2/3 max-w-lg">
          <p className="text-[30px] font-extrabold">Login to continue</p>
          <p className="my-3">
            New here?{" "}
            <Link className="underline font-bold" href={routes.register}>
              Sign up now
            </Link>
          </p>
          <div
            className={login.isPending ? "opacity-50 pointer-events-none" : ""}
          >
            <GoogleOAuthProvider
              clientId={
                process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !== undefined
                  ? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
                  : ""
              }
            >
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={handleGoogleLoginError}
              />
            </GoogleOAuthProvider>
          </div>
          {login.isPending && (
            <div className="my-3">
              <LoadingSpinner text="Logging in..." />
            </div>
          )}
          <div className="my-3 text-red-500">{error}</div>
        </div>
      </div>
    </div>
  );
}
