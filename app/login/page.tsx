import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";
import "../life/life.css";

export const metadata: Metadata = {
  title: "The Digital Engine",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginForm />;
}
