import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
// Georgia is the brand font: a system font, so there's nothing to load (see --font-display).

export const metadata: Metadata = {
  title: { default: "Z Studios — A creative space in Woodstock, Cape Town", template: "%s · Z Studios" },
  description:
    "A space where dreams are nurtured. Studio hire, podcast and photography studios, video production, equipment rental and workshops in Woodstock, Cape Town.",
};

export const viewport: Viewport = {
  themeColor: "#fdf9f9",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-ZA" className={`${inter.variable}`} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">
        {/* Restores "grid already seen this session" before first paint on hard reloads (see EquipmentGrid). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("zs-grid-seen"))document.documentElement.setAttribute("data-grid-seen","")}catch(e){}`,
          }}
        />
        {children}
        <Toaster
          theme="light"
          position="bottom-center"
          toastOptions={{
            style: {
              background: "var(--color-raised)",
              border: "1px solid var(--color-line-strong)",
              color: "var(--color-bone)",
              borderRadius: "4px",
            },
          }}
        />
      </body>
    </html>
  );
}
