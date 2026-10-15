import type { ReactNode } from "react";

export const FeedbackNotice = ({ children, tone }: { children: ReactNode; tone: "danger" | "success" }) => <div className={`notice ${tone}`} role={tone === "danger" ? "alert" : "status"}>{children}</div>;
