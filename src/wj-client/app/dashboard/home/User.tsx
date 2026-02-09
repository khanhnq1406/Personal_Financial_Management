"use client";

import { store } from "@/redux/store";
import { ButtonType, resources } from "@/app/constants";
import { Button } from "@/components/Button";
import { memo, useCallback } from "react";
import { logout } from "@/app/auth/utils/logout";

export const User = memo(function User() {
  const user = store.getState().setAuthReducer;
  const handleLogout = useCallback(() => {
    logout();
  }, [user]);
  return (
    <div className="flex flex-wrap justify-center items-center gap-3 my-5">
      <div>
        <img
          src={user.picture !== null ? user.picture : `${resources}/user.svg`}
          alt=""
          className="rounded-full h-12"
        />
      </div>
      <div>
        <p className="text-lg font-bold text-center">{user.fullname}</p>
        <p className="text-sm break-all text-center">{user.email}</p>
      </div>
      <div>
        <Button
          type={ButtonType.IMG}
          src={`${resources}/logout.svg`}
          onClick={handleLogout}
        />
      </div>
    </div>
  );
});
