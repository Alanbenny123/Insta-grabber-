import { NextRequest, NextResponse } from "next/server";
import { getInstagramPostGraphQL } from "./utils";

interface RouteContext {
  params: Promise<{ shortcode: string }>;
}

type UpstreamMedia = {
  is_video?: boolean;
  video_url?: string;
  owner?: { username?: string };
};

export async function GET(_: NextRequest, context: RouteContext) {
  const { shortcode } = await context.params;
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(shortcode || "")) {
    return NextResponse.json(
      { error: "noShortcode", message: "A valid shortcode is required" },
      { status: 400 }
    );
  }

  try {
    const response = await getInstagramPostGraphQL({ shortcode });

    if (response.status === 404) {
      return NextResponse.json(
        { error: "notFound", message: "Post not found" },
        { status: 404 }
      );
    }
    if (response.status === 429) {
      return NextResponse.json(
        { error: "tooManyRequests", message: "Try again later" },
        { status: 429 }
      );
    }
    if (!response.ok) {
      console.error("Instagram metadata request failed:", response.status);
      return NextResponse.json(
        { error: "serverError", message: "Instagram metadata is unavailable" },
        { status: 502 }
      );
    }

    const payload = (await response.json()) as {
      data?: { xdt_shortcode_media?: UpstreamMedia | null };
    };
    if (!payload?.data || !("xdt_shortcode_media" in payload.data)) {
      console.error("Instagram metadata response has an unexpected shape");
      return NextResponse.json(
        { error: "serverError", message: "Instagram metadata is unavailable" },
        { status: 502 }
      );
    }

    const media = payload.data.xdt_shortcode_media;
    if (!media) {
      return NextResponse.json(
        { error: "notFound", message: "Post not found" },
        { status: 404 }
      );
    }
    if (media.is_video === false) {
      return NextResponse.json(
        { error: "notVideo", message: "Post is not a video" },
        { status: 400 }
      );
    }
    if (media.is_video !== true || !media.video_url || !media.owner?.username) {
      console.error("Instagram video metadata is incomplete");
      return NextResponse.json(
        { error: "serverError", message: "Instagram metadata is unavailable" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      data: {
        xdt_shortcode_media: {
          video_url: media.video_url,
          owner: { username: media.owner.username },
        },
      },
    });
  } catch (error) {
    console.error("Instagram metadata request failed:", error);
    return NextResponse.json(
      { error: "serverError", message: "Instagram metadata is unavailable" },
      { status: 502 }
    );
  }
}
