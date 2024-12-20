"use client";

import { AuthCheck } from "@/app/auth/utils/authCheck";
import { Logout } from "../auth/utils/logout";

export default function Dashboard() {
  const logoutHandle = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    event.preventDefault();
    Logout();
  };
  return (
    <AuthCheck>
      <h1>This is Dashboard!!!!!</h1>
      <button onClick={logoutHandle}>Logout</button>
    </AuthCheck>
  );
}
