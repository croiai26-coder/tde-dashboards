// ─────────────────────────────────────────────────────────────
// Gate for the whole site.
//
// The repository and the deployment are public, so anything that reaches out
// to Notion or the calendar has to sit behind a password. The invariant this
// file exists to enforce: real data is only ever served to an authenticated
// request, and that is checked in code rather than left to whoever remembers
// to configure it.
//
// Set SITE_PASSWORD (LIFE_PASSWORD is accepted as an alias) to turn the gate
// on. With it unset both pages still render — /life as a local-only app, / in
// its seed state — but the server fetches nothing real. See `liveDataAllowed`.
//
// Uses Web Crypto so the same code runs in Edge middleware and in Node routes.
// ─────────────────────────────────────────────────────────────

export const COOKIE = "tde_auth";
const TTL_DAYS = 30;

const enc = new TextEncoder();

const b64url = (bytes: ArrayBuffer | Uint8Array): string => {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

async function hmac(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
}

/** Constant-time string compare — a plain === leaks length and prefix by timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** SITE_PASSWORD is the name; LIFE_PASSWORD is kept working as an alias so an
 *  already-configured deployment doesn't silently lose its gate. */
export const sitePassword = (): string | undefined =>
  process.env.SITE_PASSWORD || process.env.LIFE_PASSWORD;

export const passwordSet = (): boolean => !!sitePassword();

/** True when the server may fetch real Notion/calendar data for this request.
 *  Without a password configured the answer is always no, which makes the
 *  dangerous combination — public URL plus real data — unreachable. */
export const liveDataAllowed = (authed: boolean): boolean => passwordSet() && authed;

export async function issueToken(): Promise<string> {
  const secret = sitePassword()!;
  const exp = String(Date.now() + TTL_DAYS * 86_400_000);
  return `${exp}.${await hmac(secret, exp)}`;
}

export async function verifyToken(token: string | undefined): Promise<boolean> {
  const secret = sitePassword();
  if (!secret || !token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return safeEqual(sig, await hmac(secret, exp));
}

export async function checkPassword(candidate: string): Promise<boolean> {
  const secret = sitePassword();
  if (!secret) return false;
  // Compare digests rather than the raw strings: equal length, no early exit.
  const a = await hmac(secret, "pw:" + candidate);
  const b = await hmac(secret, "pw:" + secret);
  return safeEqual(a, b);
}

export const cookieOptions = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: TTL_DAYS * 86_400,
};
