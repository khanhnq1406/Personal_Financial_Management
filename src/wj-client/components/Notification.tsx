import { NotificationCode } from "@/app/constants";
import { redirect } from "next/navigation";

interface Notification {
  status: NotificationCode;
  message: string;
  submessage?: string;
  button?: string;
  navigate?: string;
}

interface NotificationProps {
  notification: Notification;
}

export default function Notification(notification: NotificationProps) {
  const _notification = notification.notification;
  return (
    <div className="flex w-full h-full justify-center items-center flex-col">
      {_notification.status === NotificationCode.SUCCESS ? (
        <p className="text-primary-500 text-[30px] font-extrabold">
          {_notification.status}
        </p>
      ) : (
        <p className="text-danger-600 text-[30px] font-extrabold">
          {_notification.status}
        </p>
      )}
      <p className="text-center">{_notification.message}</p>
      <p className="text-center">{_notification.submessage}</p>
      {_notification.button !== undefined && _notification.navigate ? (
        <button
          className="custom-btn"
          onClick={() =>
            redirect(
              _notification.navigate !== undefined ? _notification.navigate : ""
            )
          }
        >
          {_notification.button}
        </button>
      ) : (
        <></>
      )}
    </div>
  );
}
