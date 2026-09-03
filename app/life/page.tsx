import type { Metadata } from "next";
import LifeApp from "@/components/life/LifeApp";
import { passwordSet } from "@/lib/auth";
import "./life.css";

export const metadata: Metadata = {
  title: "Life OS",
  description: "Dump anything in; it works out what matters next.",
};

// Rendered per request, not prerendered: whether a password is configured has to
// be read at request time, or adding LIFE_PASSWORD later would need a rebuild
// before the app noticed.
export const dynamic = "force-dynamic";

// The page shell is a server component, but everything below it is client-side:
// capture has to be instant, so it writes to localStorage first and reconciles
// with Notion in the background.
export default function LifePage() {
  const name = process.env.NEXT_PUBLIC_FOUNDER_NAME || "Croíadh";
  return <LifeApp name={name} gated={passwordSet()} />;
}
