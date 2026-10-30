import { NextRequest, NextResponse } from "next/server";

const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const DOWNLOAD_TIMEOUT_MS = 60_000;

function isAllowedMediaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    return (
      url.protocol === "https:" &&
      (url.port === "" || url.port === "443") &&
      !url.username &&
      !url.password &&
      (hostname.endsWith(".cdninstagram.com") ||
        hostname.endsWith(".fbcdn.net"))
    );
  } catch {
    return false;
  }
}

function safeFilename(value: string | null): string {
  const name = (value || "instagram-video.mp4")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120);
  return name.endsWith(".mp4") ? name : "instagram-video.mp4";
}

export async function GET(request: NextRequest) {
  const fileUrl = request.nextUrl.searchParams.get("url");
  if (!fileUrl || !isAllowedMediaUrl(fileUrl)) {
    return NextResponse.json(
      { error: "invalidUrl", message: "A valid Instagram media URL is required" },
      { status: 400 }
    );
  }

  const signal = AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS);

  try {
    let url = fileUrl;
    let videoResponse: Response | undefined;

    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
      videoResponse = await fetch(url, {
        headers: { Accept: "video/mp4,video/*;q=0.9,*/*;q=0.1" },
        redirect: "manual",
        signal,
        cache: "no-store",
      });

      if (![301, 302, 303, 307, 308].includes(videoResponse.status)) break;

      const location = videoResponse.headers.get("location");
      if (!location) {
        return NextResponse.json({ error: "upstreamError" }, { status: 502 });
      }

      const nextUrl = new URL(location, url).toString();
      if (!isAllowedMediaUrl(nextUrl) || redirects === MAX_REDIRECTS) {
        return NextResponse.json({ error: "invalidRedirect" }, { status: 502 });
      }
      await videoResponse.body?.cancel();
      url = nextUrl;
    }

    if (!videoResponse?.ok || !videoResponse.body) {
      return NextResponse.json({ error: "upstreamError" }, { status: 502 });
    }

    const contentType = videoResponse.headers.get("content-type")?.toLowerCase() || "";
    if (
      !contentType.startsWith("video/") &&
      !contentType.startsWith("application/octet-stream") &&
      !contentType.startsWith("binary/octet-stream")
    ) {
      await videoResponse.body.cancel();
      return NextResponse.json({ error: "invalidMedia" }, { status: 502 });
    }

    const contentLength = Number(videoResponse.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_VIDEO_BYTES) {
      await videoResponse.body.cancel();
      return NextResponse.json({ error: "mediaTooLarge" }, { status: 413 });
    }

    let receivedBytes = 0;
    const limitedStream = videoResponse.body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          receivedBytes += chunk.byteLength;
          if (receivedBytes > MAX_VIDEO_BYTES) {
            controller.error(new Error("Media exceeds download limit"));
            return;
          }
          controller.enqueue(chunk);
        },
      })
    );

    const headers = new Headers({
      "Content-Disposition": `attachment; filename="${safeFilename(request.nextUrl.searchParams.get("filename"))}"`,
      "Content-Type": contentType || "video/mp4",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    if (contentLength > 0) headers.set("Content-Length", String(contentLength));

    return new NextResponse(limitedStream, { status: 200, headers });
  } catch (error) {
    console.error("Download proxy error:", error);
    return NextResponse.json({ error: "upstreamError" }, { status: 502 });
  }
}
