"use client";

import Image from "next/image";
import { CldImage } from "next-cloudinary";
import { cn } from "@/lib/cn";
import { imageMeta, isLocalImage } from "@/lib/images";

interface Props {
  /** A local path (/equipment/…) or a Cloudinary public ID. When missing, a branded frame is shown. */
  src?: string;
  alt: string;
  label?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  /** Show the photo credit over the image (required for Creative Commons images on detail pages). */
  showCredit?: boolean;
}

const hasCloudinary = Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);

// A warm key light falling on an empty set: the backdrop for placeholders and product cut-outs.
const spotlight =
  "radial-gradient(ellipse 60% 70% at 30% 20%, rgba(201,150,122,0.22), transparent 60%), radial-gradient(ellipse 80% 60% at 80% 110%, rgba(138,95,76,0.25), transparent 60%), linear-gradient(180deg, #171412 0%, #0b0a09 100%)";
const cutoutLight =
  "radial-gradient(ellipse 55% 60% at 50% 45%, rgba(201,150,122,0.28), transparent 70%), linear-gradient(180deg, #1a1614 0%, #0b0a09 100%)";

export function Media({ src, alt, label, sizes = "100vw", priority, className, imgClassName, showCredit }: Props) {
  const local = src && isLocalImage(src);
  const meta = src ? imageMeta[src] : undefined;
  const cutout = meta?.fit === "cutout";

  return (
    <div className={cn("relative overflow-hidden bg-surface", className)} style={cutout ? { background: cutoutLight } : undefined}>
      {local ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn(
            cutout ? "object-contain p-[12%] drop-shadow-[0_24px_32px_rgba(0,0,0,0.6)]" : "object-cover",
            imgClassName,
          )}
        />
      ) : src && hasCloudinary ? (
        <CldImage
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          format="auto"
          quality="auto"
          className={cn("object-cover", imgClassName)}
        />
      ) : (
        <div role="img" aria-label={alt} className={cn("absolute inset-0", imgClassName)} style={{ background: spotlight }}>
          <span className="wordmark absolute right-5 bottom-4 text-[11px] text-rose/50">{label ?? "Z STUDIOS"}</span>
          <span className="absolute inset-0 flex items-center justify-center font-display text-[min(30vw,180px)] leading-none text-bone/[0.04] select-none">
            Z
          </span>
        </div>
      )}

      {showCredit && meta?.credit && (
        <a
          href={meta.credit.href}
          target="_blank"
          rel="noreferrer"
          className="absolute right-0 bottom-0 bg-ink/70 px-2 py-1 text-[10px] text-muted backdrop-blur-sm"
        >
          {meta.credit.license ? `Photo: ${meta.credit.text}, ${meta.credit.license}` : `Image: ${meta.credit.text}`}
        </a>
      )}
    </div>
  );
}
