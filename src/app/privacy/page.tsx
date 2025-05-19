import React from "react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">Privacy Policy</h1>

      <div className="prose dark:prose-invert max-w-none">
        <h2 className="mt-8 mb-4 text-2xl font-semibold">
          1. Information We Collect
        </h2>
        <p>
          When you use our Instagram Downloader service, we may collect certain
          information about your device and your activity, including IP address,
          browser type, operating system, and the Instagram content you
          download.
        </p>

        <h2 className="mt-8 mb-4 text-2xl font-semibold">
          2. How We Use Your Information
        </h2>
        <p>
          We use the information we collect primarily to provide, maintain, and
          improve our service. This includes detecting and addressing technical
          issues and optimizing the user experience.
        </p>

        <h2 className="mt-8 mb-4 text-2xl font-semibold">
          3. Cookies and Similar Technologies
        </h2>
        <p>
          We may use cookies and similar tracking technologies to track activity
          on our service and store certain information. You can instruct your
          browser to refuse all cookies or to indicate when a cookie is being
          sent.
        </p>

        <h2 className="mt-8 mb-4 text-2xl font-semibold">4. Data Security</h2>
        <p>
          We implement appropriate security measures to protect your personal
          information. However, no method of transmission over the Internet or
          electronic storage is 100% secure, and we cannot guarantee absolute
          security.
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
