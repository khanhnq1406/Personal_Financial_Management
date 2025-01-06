"use client";
import { store } from "@/redux/store";
import { BACKEND_URL, LOCAL_STORAGE_TOKEN_NAME, routes } from "../../constants";
import { removeAuth } from "@/redux/actions";
import { redirect } from "next/navigation";
import { isClient } from "@/utils/isClient";
import fetcher from "@/utils/fetcher";

export function Logout() {
  if (isClient) {
    fetcher(`${BACKEND_URL}/auth/logout`, {
      method: "POST",
      body: JSON.stringify({
        token: localStorage.getItem(LOCAL_STORAGE_TOKEN_NAME),
      }),
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => {
        console.log(res);
        if (res.ok) {
          localStorage.removeItem(LOCAL_STORAGE_TOKEN_NAME);
          store.dispatch(removeAuth());
        }
      })
      .catch((err) => console.log(err));
    redirect(routes.login);
  }
}
