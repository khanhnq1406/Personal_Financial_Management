"use client";

import { store } from "@/redux/store";

export function User() {
  const user = store.getState().setAuthReducer;
  return (
    <div>
      <h1> {user.fullname} </h1>
    </div>
  );
}
