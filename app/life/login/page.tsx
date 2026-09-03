import type { Metadata } from "next";
import LoginForm from "@/components/life/LoginForm";
import "../life.css";

export const metadata: Metadata = { title: "Life OS", robots: { index: false, follow: false } };

export default function LoginPage() {
  return <LoginForm />;
}
