"use client";
import Link from "next/link";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

import { NotificationCode, routes } from "@/app/constants";
import { useState } from "react";
import Notification from "@/components/Notification";
import { api } from "@/utils/generated/api";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";

enum RegisterState {
  Start,
  Success,
}

export default function Register() {
  const notificationSuccess = (
    <Notification
      notification={{
        status: NotificationCode.SUCCESS,
        message: "Congratulations, your account has been successfully created",
        submessage: "Please login to access the website",
        button: "Go to login",
        navigate: routes.login,
      }}
    />
  );
  const [state, setState] = useState(RegisterState.Start);
  const [notification, setNotification] = useState(notificationSuccess);
  const [isLoading, setIsLoading] = useState(false);
  const handleGoogleLogin = async (credentialResponse: any) => {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    setIsLoading(true);
    const result = await api.auth.register({
      token: credentialResponse.credential,
    });
    setIsLoading(false);
    setState(RegisterState.Success);

    if (result.data) {
      // Registration successful
      setNotification(notificationSuccess);
    } else {
      // Registration failed
      setNotification(
        <div className="flex flex-col justify-center">
          <Notification
            notification={{
              status: NotificationCode.ERROR,
              message: "Opps, User Registration failed.",
              submessage: "Please try again",
            }}
          />
          <button
            className="custom-btn"
            onClick={() => {
              setNotification(notificationSuccess);
              setState(RegisterState.Start);
            }}
          >
            Try again
          </button>
        </div>,
      );
    }
  };
  const handleGoogleLoginError = () => {
    console.log("Register Failed");
  };
  return (
    <div className="flex items-center h-screen relative justify-center">
      {state === RegisterState.Start ? (
        <div className="flex justify-center items-center flex-col w-full">
          <div className="w-2/3 max-w-lg">
            <p className="text-[30px] font-extrabold my-1">
              Get Started for Free
            </p>
            <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
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
                  text="signup_with"
                />
              </GoogleOAuthProvider>
            </div>
            {isLoading && (
              <div className="my-3">
                <LoadingSpinner text="Creating account..." />
              </div>
            )}
            <p className="my-2">
              Already a member?{" "}
              <Link className="underline font-bold" href={routes.login}>
                Login
              </Link>
            </p>
          </div>
        </div>
      ) : (
        <>{notification}</>
      )}
    </div>
  );
}
