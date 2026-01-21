"use client";

import { BelloWidget } from "@bello/bello-sdk/react";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-900">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold">Bello SDK Demo</h1>
          <p className="text-zinc-600">
            Local package test inside the Next.js demo app.
          </p>
        </div>
        <div className="">
          <BelloWidget
            projectId="f463961b-f209-4daf-8c0e-c14183925669"
            apiBaseUrl="http://localhost:3001"
          />
        </div>
      </div>
    </main>
  );
}
