"use client";

import React, { useState } from "react";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormItem,
  FormLabel,
  FormField,
  FormControl,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Download, Loader2, X } from "lucide-react";

import {
  cn,
  getPostShortcode,
  isShortcodePresent,
  getHighestQualityVideoUrl,
} from "@/lib/utils";
import { useGetInstagramPostMutation } from "@/features/react-query/mutations/instagram";
import { HTTP_CODE_ENUM } from "@/features/api/http-codes";

// 5 minutes
const CACHE_TIME = 5 * 60 * 1000;

type CachedUrl = {
  videoUrl?: string;
  expiresAt: number;
  invalid?: {
    messageKey: string;
  };
  username?: string;
  dashManifest?: string;
};

const FormValidations = {
  url: {
    REGEX: /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel)\/.+$/,
  },
};

const useFormSchema = () => {
  const t = useTranslations("components.instagramForm.inputs");

  return z.object({
    url: z
      .string({ required_error: t("url.validation.required") })
      .trim()
      .min(1, {
        message: t("url.validation.required"),
      })
      .regex(FormValidations.url.REGEX, t("url.validation.invalid"))
      .refine(
        (value) => {
          return isShortcodePresent(value);
        },
        { message: t("url.validation.invalid") }
      ),
  });
};

export function InstagramForm(props: { className?: string }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const cachedUrls = React.useRef(new Map<string, CachedUrl>());
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [lastDownloadedUrl, setLastDownloadedUrl] = useState<string>("");

  const t = useTranslations("components.instagramForm");

  const {
    isError,
    isPending,
    mutateAsync: getInstagramPost,
  } = useGetInstagramPostMutation();

  const formSchema = useFormSchema();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    },
  });

  const errorMessage = form.formState.errors.url?.message;

  const isDisabled = isPending || !form.formState.isDirty;
  const isShowClearButton = form.watch("url").length > 0;

  function clearUrlField() {
    form.setValue("url", "");
    form.clearErrors("url");
    inputRef.current?.focus();
  }

  function setCachedUrl(
    shortcode: string,
    videoUrl?: string,
    invalid?: CachedUrl["invalid"],
    username?: string,
    dashManifest?: string
  ) {
    cachedUrls.current?.set(shortcode, {
      videoUrl,
      expiresAt: Date.now() + CACHE_TIME,
      invalid,
      username,
      dashManifest,
    });
  }

  function getCachedUrl(shortcode: string) {
    const cachedUrl = cachedUrls.current?.get(shortcode);

    if (!cachedUrl) {
      return null;
    }

    if (cachedUrl.expiresAt < Date.now()) {
      cachedUrls.current.delete(shortcode);
      return null;
    }

    return cachedUrl;
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isError) {
      toast.dismiss("toast-error");
    }

    const shortcode = getPostShortcode(values.url);

    if (!shortcode) {
      form.setError("url", { message: t("inputs.url.validation.invalid") });
      return;
    }

    const cachedUrl = getCachedUrl(shortcode);
    if (cachedUrl?.invalid) {
      form.setError("url", { message: t(cachedUrl.invalid.messageKey) });
      return;
    }

    if (cachedUrl?.videoUrl) {
      // If we have a dash manifest in cache, try to get high quality URL
      if (cachedUrl.dashManifest) {
        try {
          const highQualityUrl = await getHighestQualityVideoUrl(
            cachedUrl.dashManifest
          );
          if (highQualityUrl) {
            triggerDownload(highQualityUrl, cachedUrl.username);
            return;
          }
        } catch (error) {
          console.error("Error getting high quality URL:", error);
        }
      }
      // Fall back to regular URL if needed
      triggerDownload(cachedUrl.videoUrl, cachedUrl.username);
      return;
    }

    try {
      const { data, status } = await getInstagramPost({ shortcode });

      if (status === HTTP_CODE_ENUM.OK) {
        const downloadUrl = data.data.xdt_shortcode_media.video_url;
        const username = data.data.xdt_shortcode_media.owner.username;
        const dashInfo = data.data.xdt_shortcode_media.dash_info;
        const dashManifest = dashInfo?.video_dash_manifest;

        let highQualityUrl = downloadUrl;

        // Try to get a higher quality URL from the DASH manifest
        if (dashManifest && dashInfo?.is_dash_eligible) {
          try {
            const bestUrl = await getHighestQualityVideoUrl(dashManifest);
            if (bestUrl) {
              highQualityUrl = bestUrl;
            }
          } catch (error) {
            console.error("Error parsing DASH manifest:", error);
          }
        }

        if (highQualityUrl) {
          triggerDownload(highQualityUrl, username);
          setCachedUrl(
            shortcode,
            downloadUrl,
            undefined,
            username,
            dashManifest
          );
          toast.success(t("toasts.success"), {
            id: "toast-success",
            position: "top-center",
            duration: 1500,
          });
        } else {
          throw new Error("Video URL not found");
        }
      } else if (
        status === HTTP_CODE_ENUM.NOT_FOUND ||
        status === HTTP_CODE_ENUM.BAD_REQUEST ||
        status === HTTP_CODE_ENUM.TOO_MANY_REQUESTS ||
        status === HTTP_CODE_ENUM.INTERNAL_SERVER_ERROR
      ) {
        const errorMessageKey = `serverErrors.${data.error}`;
        form.setError("url", { message: t(errorMessageKey) });
        if (
          status === HTTP_CODE_ENUM.BAD_REQUEST ||
          status === HTTP_CODE_ENUM.NOT_FOUND
        ) {
          setCachedUrl(shortcode, undefined, {
            messageKey: errorMessageKey,
          });
        }
      } else {
        throw new Error("Failed to fetch video");
      }
    } catch (error) {
      console.error(error);
      toast.error(t("toasts.error"), {
        dismissible: true,
        id: "toast-error",
        position: "top-center",
      });
    }
  }

  function triggerDownload(videoUrl: string, username?: string) {
    if (typeof window === "undefined") return;

    // Check if this is the same URL as last download
    if (videoUrl === lastDownloadedUrl) {
      const shouldRedownload = window.confirm(
        "You've already downloaded this reel. Do you want to download it again?"
      );
      if (!shouldRedownload) return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    setLastDownloadedUrl(videoUrl);

    const randomTime = new Date().getTime().toString().slice(-8);
    const filename = username
      ? `instagram-${username}-${randomTime}.mp4`
      : `gram-grabberz-${randomTime}.mp4`;

    const proxyUrl = new URL("/api/download-proxy", window.location.origin);
    proxyUrl.searchParams.append("url", videoUrl);
    proxyUrl.searchParams.append("filename", filename);

    // Use XMLHttpRequest for progress tracking
    const xhr = new XMLHttpRequest();
    xhr.open("GET", proxyUrl.toString(), true);
    xhr.responseType = "blob";

    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        setDownloadProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = xhr.response;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      setIsDownloading(false);
      setDownloadProgress(0);
    };

    xhr.onerror = () => {
      console.error("Download failed");
      setIsDownloading(false);
      setDownloadProgress(0);
    };

    xhr.send();
  }

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className={cn("w-full space-y-2", props.className)}>
      {errorMessage ? (
        <p className="h-4 text-sm text-red-500 sm:text-start">{errorMessage}</p>
      ) : (
        <div className="h-4"></div>
      )}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full flex-col gap-2 sm:flex-row sm:items-end"
        >
          <FormField
            control={form.control}
            name="url"
            rules={{ required: true }}
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="sr-only">
                  {t("inputs.url.label")}
                </FormLabel>
                <FormControl>
                  <div className="relative w-full">
                    <Input
                      {...field}
                      type="url"
                      ref={inputRef}
                      minLength={1}
                      maxLength={255}
                      placeholder={t("inputs.url.placeholder")}
                    />
                    {isShowClearButton && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={clearUrlField}
                        className="absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 cursor-pointer"
                      >
                        <X className="text-red-500" />
                      </Button>
                    )}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            disabled={isDisabled}
            type="submit"
            className="bg-teal-500 text-white hover:bg-teal-600 dark:bg-teal-700 dark:hover:bg-teal-600"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {t("submit")}
          </Button>
        </form>
      </Form>
      <p className="text-muted-foreground text-center text-xs">{t("hint")}</p>
      {isDownloading && (
        <div className="mt-2">
          <div className="h-2.5 w-full rounded-full bg-gray-200">
            <div
              className="h-2.5 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {downloadProgress}% downloaded
          </p>
        </div>
      )}
    </div>
  );
}
