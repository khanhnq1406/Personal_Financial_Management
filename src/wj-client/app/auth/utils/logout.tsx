import { store } from "@/redux/store";
import { LOCAL_STORAGE_TOKEN_NAME } from "../../constants";
import { removeAuth, setAuth } from "@/redux/actions";
import { redirect } from "next/navigation";

export function Logout() {
  localStorage.removeItem(LOCAL_STORAGE_TOKEN_NAME);
  store.dispatch(removeAuth());
  redirect("/auth/login");
}
