"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthShell } from "@/src/components/auth/AuthShell";

// Built by the mobile repo's GitHub workflow on every push; "latest" always points at the newest build
const REPO = "hamza-ahmed1/LMS_App";
const APK_NAME = "TCF-Campus.apk";
const DOWNLOAD_URL = `https://github.com/${REPO}/releases/latest/download/${APK_NAME}`;

type Release = { version: string; publishedAt: string; sizeMb: string } | "none" | null;

const steps = [
  "Tap Download and open the file when it finishes.",
  "If Android asks, allow your browser to install unknown apps.",
  "Tap Install, then sign in with your student account.",
];

export default function ApkPage() {
  const [release, setRelease] = useState<Release>(null);

  useEffect(() => {
    fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((data: { name?: string; tag_name?: string; published_at?: string; assets?: { name: string; size: number }[] }) => {
        const asset = data.assets?.find((item) => item.name === APK_NAME);
        if (!asset) return setRelease("none");
        setRelease({
          version: (data.name ?? data.tag_name ?? "").replace(/^TCF Campus\s*/, ""),
          publishedAt: data.published_at ?? "",
          sizeMb: (asset.size / 1024 / 1024).toFixed(1),
        });
      })
      // Release details are a nice extra; the download link works without them
      .catch((status) => setRelease(status === 404 ? "none" : null));
  }, []);

  return (
    <AuthShell title="Get the TCF Campus app" subtitle="Attendance, marks, fee challans and campus notices on your Android phone.">
      <div className="space-y-5">
        {release === "none" ? (
          <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
            The first version of the app is still being built. Please check back in a little while.
          </p>
        ) : (
          <a
            href={DOWNLOAD_URL}
            className="flex w-full items-center justify-center gap-2 rounded-xl theme-bg-primary px-5 py-3.5 text-base font-semibold theme-text-on-primary shadow-lg shadow-black/10 transition theme-hover-primary"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12m0 0-5-5m5 5 5-5M5 21h14" />
            </svg>
            Download for Android
          </a>
        )}

        {release && release !== "none" ? (
          <p className="text-center text-xs theme-text-muted">
            Version {release.version} · {release.sizeMb} MB
            {release.publishedAt ? ` · updated ${new Date(release.publishedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}` : ""}
          </p>
        ) : null}

        <div>
          <h2 className="mb-2 text-sm font-semibold theme-text">How to install</h2>
          <ol className="space-y-2">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm theme-text-soft">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full theme-bg-primary-soft text-xs font-semibold theme-text-primary">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <p className="text-xs theme-text-muted">
          Android only. Installing a newer version keeps you signed in. Staff can use the{" "}
          <Link href="/login" className="font-medium theme-text-primary underline">
            web portal
          </Link>
          .
        </p>
      </div>
    </AuthShell>
  );
}
