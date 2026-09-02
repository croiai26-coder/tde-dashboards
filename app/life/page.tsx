import type { Metadata } from "next";
import LifeApp from "@/components/life/LifeApp";
import "./life.css";

export const metadata: Metadata = {
  title: "Life OS",
  description: "Dump anything in; it works out what matters next.",
};

// The page shell is a server component, but everything below it is client-side:
// capture has to be instant, so it writes to localStorage first and reconciles
// with Notion in the background.
export default function LifePage() {
  const name = process.env.NEXT_PUBLIC_FOUNDER_NAME || "Croíadh";
  return <LifeApp name={name} />;
}
