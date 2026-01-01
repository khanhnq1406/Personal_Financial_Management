"use client";
import Link from "next/link";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

import { LOCAL_STORAGE_TOKEN_NAME, routes } from "@/app/constants";
import { store } from "@/redux/store";
import { setAuth } from "@/redux/actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/utils/generated/api";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState(<></>);
  useEffect(() => {
    const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_NAME);
    if (token) {
      router.push(routes.home);
    }
  }, []);
  const handleGoogleLogin = async (credentialResponse: any) => {
    const result = await api.auth.login({ googleToken: credentialResponse.credential });

    if (result.success && result.data) {
      localStorage.setItem(LOCAL_STORAGE_TOKEN_NAME, result.data.accessToken);
      store.dispatch(
        setAuth({
          isAuthenticated: true,
          email: result.data.email,
          fullname: result.data.fullname,
          picture: result.data.picture,
        })
      );
      router.push(routes.home);
    } else {
      setError(
        <>
          <p>{result.message || "Opps, Something went wrong. Please try again."}</p>
        </>
      );
    }
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
          <div className="my-3 text-red-500">{error}</div>
        </div>
      </div>
    </div>
  );
}
