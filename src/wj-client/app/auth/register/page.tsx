"use client";
import Link from "next/link";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

import { BACKEND_URL, HttpStatus, NotificationCode } from "@/app/constants";
import { useState } from "react";
import Notification from "@/components/notification";

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
        navigate: "/auth/login",
      }}
    />
  );
  const [state, setState] = useState(RegisterState.Start);
  const [notification, setNotification] = useState(notificationSuccess);
  const handleGoogleLogin = async (credentialResponse: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
      const res = await fetch(`${BACKEND_URL}/auth/register`, {
        method: "POST",
        body: JSON.stringify({ token: credentialResponse.credential }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      console.log(data);
      setState(RegisterState.Success);
      console.log("Here: ", data.status);
      if (data.status == HttpStatus.OK) {
        setNotification(
          <Notification
            notification={{
              status: NotificationCode.ERROR,
              message: "Oops, User already exists.",
              submessage: "Please login to access the website.",
              button: "Go to login",
              navigate: "/auth/login",
            }}
          />
        );
      } else if (data.status != HttpStatus.CREATED) {
        setNotification(
          <div className="flex flex-col justify-center">
            <Notification
              notification={{
                status: NotificationCode.ERROR,
                message: `Opps, User Registration failed. ${data.message}`,
                submessage: "Please refresh to try again",
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
          </div>
        );
      }
    } catch (err) {
      console.log(err)
      setNotification(
        <div className="flex flex-col justify-center">
          <Notification
            notification={{
              status: NotificationCode.ERROR,
              message: "Opps, Something went wrong. User Registration failed.",
              submessage: "Please refresh to try again",
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
        </div>
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
            <p className="my-2">
              Already a member?{" "}
              <Link className="underline font-bold" href="/auth/login">
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
