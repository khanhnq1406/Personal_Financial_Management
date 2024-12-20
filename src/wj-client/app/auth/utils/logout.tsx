import { store } from "@/redux/store";
import { LOCAL_STORAGE_TOKEN_NAME } from "../../constants";
import { removeAuth } from "@/redux/actions";
import { redirect } from "next/navigation";
import { isClient } from "@/utils/isClient";

export function Logout() {
  if (isClient)
  {
    localStorage.removeItem(LOCAL_STORAGE_TOKEN_NAME);
  }
  store.dispatch(removeAuth());
  redirect("/auth/login");
}
