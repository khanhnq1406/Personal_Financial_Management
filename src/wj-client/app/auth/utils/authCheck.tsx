"use client";

import { useEffect, useState, useCallback } from "react";
import { BACKEND_URL, LOCAL_STORAGE_TOKEN_NAME, routes } from "@/app/constants";
import { useRouter } from "next/navigation";
import { store } from "@/redux/store";
import { setAuth } from "@/redux/actions";
import { useGet } from "@/hooks";
import type { AuthUser } from "@/types/api";

export const AuthCheck = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [shouldFetch, setShouldFetch] = useState(false);

  const handleError = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_TOKEN_NAME);
    router.push(routes.login);
  }, []);

  const { data: authData, error: authError } = useGet<AuthUser>(
    shouldFetch ? `${BACKEND_URL}/auth` : null,
    {
      onError: handleError,
    }
  );

  useEffect(() => {
    if (authError) {
      handleError();
    }
  }, [authError, handleError]);

  useEffect(() => {
    const storedToken = localStorage.getItem(LOCAL_STORAGE_TOKEN_NAME);

    if (storedToken) {
      setShouldFetch(true);
    } else {
      router.push(routes.login);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem(LOCAL_STORAGE_TOKEN_NAME);

    if (storedToken && authData) {
      setToken(storedToken);
      store.dispatch(
        setAuth({
          isAuthenticated: true,
          email: authData.email,
          fullname: authData.name,
          picture: authData.picture,
        })
      );
    }
  }, [authData]);

  if (token === null) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};
