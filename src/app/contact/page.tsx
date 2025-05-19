import React from "react";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">Contact Us</h1>

      <div className="prose dark:prose-invert max-w-none">
        <p className="mb-6">
          Have questions, feedback, or need assistance? We&apos;d love to hear
          from you! Please use one of the methods below to get in touch with our
          team.
        </p>

        <div className="max-w-lg rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">Email Us</h2>
          <p className="mb-2">For general inquiries:</p>
          <a
            href="mailto:contact@instagramdownloader.com"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            contact@instagramdownloader.com
          </a>

          <p className="mt-4 mb-2">For support:</p>
          <a
            href="mailto:support@instagramdownloader.com"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            support@instagramdownloader.com
          </a>
        </div>

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
