import React from "react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">Terms of Service</h1>

      <div className="prose dark:prose-invert max-w-none">
        <h2 className="mt-8 mb-4 text-2xl font-semibold">1. Introduction</h2>
        <p>
          Welcome to Instagram Downloader. By accessing or using our service,
          you agree to be bound by these Terms of Service. If you disagree with
          any part of the terms, you may not access the service.
        </p>

        <h2 className="mt-8 mb-4 text-2xl font-semibold">2. Use of Service</h2>
        <p>
          Our service allows you to download publicly available content from
          Instagram. You are responsible for ensuring that your use of our
          service complies with Instagram&apos;s terms of service and applicable
          laws.
        </p>

        <h2 className="mt-8 mb-4 text-2xl font-semibold">3. Limitations</h2>
        <p>
          You may not use our service for any illegal purpose or in violation of
          any local, state, national, or international law. You must not attempt
          to gain unauthorized access to any portion of the service or any other
          systems connected to the service.
        </p>

        <h2 className="mt-8 mb-4 text-2xl font-semibold">
          4. Changes to Terms
        </h2>
        <p>
          We reserve the right to modify these terms at any time. We will
          provide notice of any significant changes through appropriate means.
        </p>

        <div className="mt-12 border-t pt-4">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
