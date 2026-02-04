"use client";
import Link from "next/link";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

import { LOCAL_STORAGE_TOKEN_NAME, routes } from "@/app/constants";
import { store } from "@/redux/store";
import { setAuth } from "@/redux/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutationRegister } from "@/utils/generated/hooks";
import { updateAuthTokenCache } from "@/utils/api-client";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";

export default function Register() {
  const router = useRouter();
  const [error, setError] = useState("");

  const register = useMutationRegister({
    onError(error) {
      setError(error.message || "Registration failed. Please try again.");
    },
    onSuccess(data) {
      if (data.data) {
        // Registration successful - extract login data and auto-login
        const { accessToken, email, fullname, picture } = data.data;

        // Store token
        localStorage.setItem(LOCAL_STORAGE_TOKEN_NAME, accessToken);
        updateAuthTokenCache(accessToken);

        // Update Redux store
        store.dispatch(
          setAuth({
            isAuthenticated: true,
            email: email,
            fullname: fullname,
            picture: picture,
          })
        );

        // Redirect to home
        router.push(routes.home);
      }
    },
  });

  const handleGoogleLogin = async (credentialResponse: any) => {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    setError("");
    await register.mutateAsync({
      token: credentialResponse.credential,
    });
  };

  const handleGoogleLoginError = () => {
    setError("Google login failed. Please try again.");
  };

  return (
    <div className="flex items-center justify-center min-h-screen relative px-4 sm:px-6">
      <div className="flex justify-center items-center flex-col w-full">
        <div className="w-full max-w-md sm:max-w-lg px-4 sm:px-0">
          <p className="text-2xl sm:text-3xl font-extrabold my-1 mb-3">
            Get Started for Free
          </p>
          <div className={register.isPending ? "opacity-50 pointer-events-none" : ""}>
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
          {register.isPending && (
            <div className="my-3">
              <LoadingSpinner text="Creating account..." />
            </div>
          )}
          {error && (
            <div className="my-3 text-red-500">
              <p>{error}</p>
            </div>
          )}
          <p className="my-2 text-sm sm:text-base">
            Already a member?{" "}
            <Link className="underline font-bold" href={routes.login}>
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
