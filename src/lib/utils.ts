import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isShortcodePresent(url: string) {
  const regex = /\/(p|reel)\/([a-zA-Z0-9_-]+)\/?/;
  const match = url.match(regex);

  if (match && match[2]) {
    return true;
  }

  return false;
}

export function getPostShortcode(url: string): string | null {
  // Regex to extract the shortcode from both /p/ and /reel/ URLs
  const regex = /\/(p|reel)\/([a-zA-Z0-9_-]+)(?:\/|\?|$)/i;
  const match = url.match(regex);

  if (match && match[2]) {
    return match[2];
  }

  return null;
}
