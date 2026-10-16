import type { NotificationItem } from "./notifications.types";

const getContactName = (notification: NotificationItem, creatorName: string) => {
  const payloadContactName = notification.payload?.contactName;
  if (typeof payloadContactName === "string") return payloadContactName;

  const legacyMessage = notification.message.match(/cadastrou\s+(.+?)\.?$/i);
  return legacyMessage?.[1] || notification.message.replace(`${creatorName} cadastrou `, "").replace(/\.$/, "");
};

export const NotificationMessage = ({ notification }: { notification: NotificationItem }) => {
  const creatorName = notification.payload?.creatorName;
  if (notification.type === "NEW_CONTACT" && typeof creatorName === "string") {
    return <p>Operador <strong>{creatorName}</strong> cadastrou <strong>{getContactName(notification, creatorName)}</strong>.</p>;
  }
  return <p>{notification.message}</p>;
};
