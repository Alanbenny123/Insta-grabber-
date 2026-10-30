import React from "react";

import { useFetch } from "@/features/api/hooks/use-fetch";

import { RequestConfigType } from "@/types/request-config";

import { wrapperFetchJsonResponse } from "@/features/api/utils";

export type GetInstagramPostRequest = {
  shortcode: string;
};

export type GetInstagramPostResponse = {
  data: {
    xdt_shortcode_media: {
      video_url: string;
      owner: { username: string };
    };
  };
};

export function useGetInstagramPost() {
  const fetch = useFetch();

  return React.useCallback(
    (data: GetInstagramPostRequest, requestConfig?: RequestConfigType) => {
      return fetch(`/api/instagram/p/${data.shortcode}`, requestConfig).then(
        wrapperFetchJsonResponse<GetInstagramPostResponse>
      );
    },
    [fetch]
  );
}
