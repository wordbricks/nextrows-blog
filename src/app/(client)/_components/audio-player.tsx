"use client";

import { BASE_PATH } from "@/env/basePath";

type Props = {
  src: string;
  title: string;
};

export default function AudioPlayer({ src, title }: Props) {
  return (
    <div className="mb-8 flex justify-center">
      <div className="w-full max-w-2xl rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-5 py-4 shadow-sm">
        <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
          Listen to this article
        </p>
        {/* Native controls: keyboard accessible, no autoplay, no JS player dependency */}
        <audio controls preload="none" src={`${BASE_PATH}${src}`} aria-label={`Audio version of ${title}`} className="w-full h-10" />
      </div>
    </div>
  );
}
