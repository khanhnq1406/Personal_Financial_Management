"use client";
import Link from "next/link";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

import { GoogleClientId } from "@/app/hideConstants";
import { BACKEND_URL } from "@/app/constants";

export default function Register() {
  const handleGoogleLogin = async (credentialResponse: any) => {
    console.log(credentialResponse);
    const res = await fetch(`${BACKEND_URL}/auth/register`, {
      method: "POST",
      body: JSON.stringify({ token: credentialResponse.credential }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    console.log(data);
  };
  const handleGoogleLoginError = (err: any) => {
    console.log("Login Failed");
  };
  return (
    <div className="flex items-center h-screen">
      <div className="flex justify-center items-center flex-col w-full">
        <div className="w-2/3 max-w-lg">
          <p className="text-[30px] font-extrabold my-1">
            Get Started for Free
          </p>
          <GoogleOAuthProvider clientId={GoogleClientId}>
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={handleGoogleLoginError}
              text="signup_with"
            />
          </GoogleOAuthProvider>
          <p className="my-2">
            Already a member?{" "}
            <Link className="underline font-bold" href="/auth/login">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
