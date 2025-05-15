// app/api/download-proxy/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileUrl = searchParams.get("url");
  const filename = searchParams.get("filename") || "instagram-video.mp4"; // Default filename

  if (!fileUrl) {
    return NextResponse.json(
      { error: "missingUrl", message: "url is required" },
      { status: 400 }
    );
  }

  try {
    // Validate the URL slightly (optional but recommended)
    if (!fileUrl.startsWith("https://")) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Set up request headers to ensure we get the best quality
    const headers = new Headers();
    headers.set(
      "User-Agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );
    headers.set("Accept", "*/*");
    headers.set("Accept-Encoding", "identity"); // Important for getting uncompressed video

    // Fetch the video from the external URL
    const videoResponse = await fetch(fileUrl, {
      headers: headers,
    });

    if (!videoResponse.ok) {
      throw new Error(`Failed to fetch video: ${videoResponse.statusText}`);
    }

    // Get the video data as a ReadableStream
    const videoStream = videoResponse.body;

    if (!videoStream) {
      throw new Error("Video stream is not available");
    }

    // Set headers to force download
    const responseHeaders = new Headers();
    responseHeaders.set(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    // Try to get Content-Type from original response, fallback to generic video type
    responseHeaders.set(
      "Content-Type",
      videoResponse.headers.get("Content-Type") || "video/mp4"
    );

    // Optionally set Content-Length if available
    if (videoResponse.headers.get("Content-Length")) {
      responseHeaders.set(
        "Content-Length",
        videoResponse.headers.get("Content-Length")!
      );
    }

    // Return the stream response
    return new NextResponse(videoStream, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("Download proxy error:", error);
    return NextResponse.json(
      { error: "serverError", message: error.message },
      { status: 500 }
    );
  }
}
