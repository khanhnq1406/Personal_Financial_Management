import { NotificationCode } from "@/app/constants";
import { redirect } from "next/navigation";

interface Notification {
  status: NotificationCode;
  message: string;
  submessage?: string;
  button?: string;
  navigate?: string;
}

export default function Notification(notification: Notification) {
  const _notification = notification.notification;
  return (
    <div className="flex w-full h-full justify-center items-center flex-col">
      {_notification.status === NotificationCode.SUCCESS ? (
        <p className="text-hgreen text-[30px] font-extrabold">
          {_notification.status}
        </p>
      ) : (
        <p className="text-lred text-[30px] font-extrabold">
          {_notification.status}
        </p>
      )}
      <p className="text-center">{_notification.message}</p>
      <p className="text-center">{_notification.submessage}</p>
      {_notification.button !== undefined ? (
        <button
          className="custom-btn"
          onClick={() => redirect(_notification.navigate)}
        >
          {_notification.button}
        </button>
      ) : (
        <></>
      )}
    </div>
  );
}
