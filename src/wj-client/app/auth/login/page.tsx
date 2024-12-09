"use client";
import Link from "next/link";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

import { FormEvent } from "react";

export default function Login() {
  async function handleUserLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    console.log(formData);
  }
  const handleGoogleLogin = async (credentialResponse: any) => {
    console.log(credentialResponse);
  };
  const handleGoogleLoginError = (err: any) => {
    console.log("Login Failed");
  };
  return (
    <div className="flex items-center h-screen">
      <div className="flex justify-center items-center flex-col w-full">
        <div className="w-2/3 max-w-lg">
          <p className="text-[30px] font-extrabold">Login to continue</p>
          <p className="my-3">
            New here?{" "}
            <Link className="underline font-bold" href="register">
              Sign up now
            </Link>
          </p>
          <form onSubmit={handleUserLogin} className="flex flex-col mb-3">
            <label>Username</label>
            <input
              className="custom-input"
              type="text"
              name="username"
              placeholder="Enter your username"
              required
            />
            <label>Password</label>
            <input
              className="custom-input"
              type="password"
              name="password"
              placeholder="Enter your password"
              required
            />
            <button className="custom-btn" type="submit">
              Login
            </button>
            <GoogleOAuthProvider clientId="<your_client_id>">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={handleGoogleLoginError}
              />
            </GoogleOAuthProvider>
          </form>
          <Link href={"#"}>Forgot Password?</Link>
        </div>
      </div>
    </div>
  );
}
