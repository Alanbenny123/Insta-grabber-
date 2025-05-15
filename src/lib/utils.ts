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

/**
 * Parse the DASH manifest to extract video streams
 * @param dashManifest XML string containing the DASH manifest
 * @returns Array of video representations sorted by quality (highest first)
 */
export async function parseDashManifest(dashManifest: string) {
  try {
    // Parse the XML manifest
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(dashManifest, "text/xml");

    // Get all the video representations
    const videoRepresentations = Array.from(
      xmlDoc.querySelectorAll('Representation[mimetype="video/mp4"]')
    );

    // Extract the info from each representation and sort by quality (highest first)
    const videos = videoRepresentations
      .map((rep) => {
        const bandwidth = parseInt(rep.getAttribute("bandwidth") || "0", 10);
        const width = parseInt(rep.getAttribute("width") || "0", 10);
        const height = parseInt(rep.getAttribute("height") || "0", 10);
        const url = rep.querySelector("BaseURL")?.textContent || "";

        return {
          url,
          width,
          height,
          bandwidth,
          quality: `${width}x${height}`,
        };
      })
      .sort((a, b) => b.width - a.width); // Sort by width (descending)

    return videos;
  } catch (error) {
    console.error("Error parsing DASH manifest:", error);
    return [];
  }
}

/**
 * Get the best quality video URL from a DASH manifest
 * @param dashManifest The DASH manifest XML string
 * @returns The URL of the highest quality video stream, or null if none found
 */
export async function getHighestQualityVideoUrl(
  dashManifest: string
): Promise<string | null> {
  const videos = await parseDashManifest(dashManifest);

  if (videos.length > 0) {
    return videos[0].url; // Return the highest quality video URL
  }

  return null;
}
