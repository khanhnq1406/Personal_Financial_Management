"use client";
import Link from "next/link";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

import { BACKEND_URL, LOCAL_STORAGE_TOKEN_NAME, routes } from "@/app/constants";
import { store } from "@/redux/store";
import { setAuth } from "@/redux/actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
    try {
      const res = await fetch(`${BACKEND_URL}${routes.login}`, {
        method: "POST",
        body: JSON.stringify({ token: credentialResponse.credential }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        // Go backend uses accessToken (camelCase)
        const token = data.data.accessToken;
        localStorage.setItem(LOCAL_STORAGE_TOKEN_NAME, token);
        store.dispatch(
          setAuth({
            isAuthenticated: true,
            email: data.data.email,
            fullname: data.data.fullname,
            picture: data.data.picture,
          })
        );
        router.push(routes.home);
      } else {
        setError(
          <>
            <p>Opps, Something went wrong. Please try again.</p>
          </>
        );
        return;
      }
    } catch {
      setError(
        <>
          <p>Opps, Something went wrong. Please try again.</p>
        </>
      );
      return;
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
