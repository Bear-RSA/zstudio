import type { Metadata } from "next";
import { Steps } from "./Steps";

export const metadata: Metadata = { title: "Book", robots: { index: false } };

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-8 sm:pt-12">
      <Steps />
      <div className="mt-10">{children}</div>
    </div>
  );
}
