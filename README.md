# Instagram Grabber(Instagram Video Downloader)

This project is an educational demonstration of building a web application to
download Instagram videos using Next.js. The primary goal is to explore modern
web development techniques, including server-side rendering/components, API
interaction (potentially via Next.js API routes), state management, form
handling, and building a clean UI with Shadcn/ui.

Disclaimer: This tool is intended for educational purposes only. Downloading
videos from Instagram may violate their Terms of Service. Please respect
copyright laws and the platform's policies. Use this tool responsibly and only
for content you have the right to download.

Website Preview:https://insta-grabber-black.vercel.app/

A Instagram Video Downloader web application built with Next.js.

## Configuration

The metadata lookup uses Instagram's private web GraphQL query. Set
`INSTAGRAM_GRAPHQL_DOC_ID` if Instagram changes the query document ID; the app
otherwise uses the currently bundled value. `INSTAGRAM_APP_ID` can also be set
if the web app ID changes. These values are server-side environment variables.
Because this is an undocumented interface, Instagram can change or block it at
any time.

The download proxy accepts HTTPS media URLs on Instagram's `cdninstagram.com`
and Meta's `fbcdn.net` subdomains, follows only redirects within those domains,
and limits each download to 200 MiB and 60 seconds.
