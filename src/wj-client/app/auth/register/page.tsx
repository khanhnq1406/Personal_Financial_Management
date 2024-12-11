"use client";
import Link from "next/link";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

import { FormEvent } from "react";

export default function Register() {
  async function handleUserRegister(event: FormEvent<HTMLFormElement>) {
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
          <p className="text-[30px] font-extrabold">Get Started for Free</p>
          <p className="my-3">
            Already a member?{" "}
            <Link className="underline font-bold" href="/auth/login">
              Login
            </Link>
          </p>
          <form onSubmit={handleUserRegister} className="flex flex-col mb-3">
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
            <label>Retype password</label>
            <input
              className="custom-input"
              type="password"
              name="password"
              placeholder="Retype your password"
              required
            />
            <button className="custom-btn" type="submit">
              Get started
            </button>

            <label className="mb-1">Or log in via</label>
            <GoogleOAuthProvider clientId="<your_client_id>">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={handleGoogleLoginError}
                text="signup_with"
              />
            </GoogleOAuthProvider>
          </form>
        </div>
      </div>
    </div>
  );
}
