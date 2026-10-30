import { RequestConfigType } from "@/types/request-config";

const DEFAULT_DOC_ID = "8845758582119845";
const DEFAULT_APP_ID = "1217981644879628";

export type GetInstagramPostRequest = {
  shortcode: string;
};

export function getInstagramPostGraphQL(
  data: GetInstagramPostRequest,
  requestConfig?: RequestConfigType
) {
  const body = new URLSearchParams({
    av: "0",
    __d: "www",
    __user: "0",
    __a: "1",
    fb_api_caller_class: "RelayModern",
    fb_api_req_friendly_name: "PolarisPostActionLoadPostQueryQuery",
    variables: JSON.stringify({
      shortcode: data.shortcode,
      fetch_tagged_user_count: null,
      hoisted_comment_id: null,
      hoisted_reply_id: null,
    }),
    server_timestamps: "true",
    doc_id: process.env.INSTAGRAM_GRAPHQL_DOC_ID || DEFAULT_DOC_ID,
  });

  const timeout = AbortSignal.timeout(10_000);
  const signal = requestConfig?.signal
    ? AbortSignal.any([requestConfig.signal, timeout])
    : timeout;

  return fetch("https://www.instagram.com/graphql/query", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
      "X-FB-Friendly-Name": "PolarisPostActionLoadPostQueryQuery",
      "X-IG-App-ID": process.env.INSTAGRAM_APP_ID || DEFAULT_APP_ID,
    },
    body,
    referrer: `https://www.instagram.com/p/${data.shortcode}/`,
    cache: "no-store",
    signal,
  });
}
