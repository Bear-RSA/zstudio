import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Z Studios — Film equipment & studio hire, Cape Town", template: "%s · Z Studios" },
  description:
    "Cape Town filmmaking hub. Hire cameras, lighting, backdrops and audio by the day, or book the studio for photoshoots, podcasts, music videos and headshots.",
};

export const viewport: Viewport = {
  themeColor: "#0b0a09",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-ZA" className={`${inter.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">
        {/* Restores "grid already seen this session" before first paint on hard reloads (see EquipmentGrid). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("zs-grid-seen"))document.documentElement.setAttribute("data-grid-seen","")}catch(e){}`,
          }}
        />
        {children}
        <Toaster
          theme="dark"
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
