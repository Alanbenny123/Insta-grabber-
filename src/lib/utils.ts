import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isShortcodePresent(url: string) {
  return getPostShortcode(url) !== null;
}

export function getPostShortcode(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      !["instagram.com", "www.instagram.com", "m.instagram.com"].includes(
        parsed.hostname.toLowerCase()
      ) ||
      parsed.port ||
      parsed.username ||
      parsed.password
    ) {
      return null;
    }

    const match = parsed.pathname.match(
      /^\/(?:p|reel)\/([a-zA-Z0-9_-]{1,64})\/?$/
    );
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
