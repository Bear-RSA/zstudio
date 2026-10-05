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
  /** JPEG/WebP quality for the optimised copy. Photos with large smooth areas (studio walls) band below ~85. */
  quality?: number;
}

const hasCloudinary = Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);

// A soft pink key light on a pale set: the backdrop for placeholders and product cut-outs.
const spotlight =
  "radial-gradient(ellipse 60% 70% at 30% 20%, rgba(245,191,209,0.16), transparent 60%), radial-gradient(ellipse 80% 60% at 80% 110%, rgba(245,191,209,0.12), transparent 60%), linear-gradient(180deg, #fbeef2 0%, #f3e6e1 100%)";
const cutoutLight =
  "radial-gradient(ellipse 55% 60% at 50% 45%, #ffffff, transparent 70%), linear-gradient(180deg, #fbeef2 0%, #f3e6e1 100%)";

export function Media({
  src,
  alt,
  label,
  sizes = "100vw",
  priority,
  className,
  imgClassName,
  showCredit,
  quality = 85,
}: Props) {
  const local = src && isLocalImage(src);
  const meta = src ? imageMeta[src] : undefined;
  const cutout = meta?.fit === "cutout";

  return (
    <div className={cn("relative isolate overflow-hidden rounded-2xl bg-surface", className)} style={cutout ? { background: cutoutLight } : undefined}>
      {local ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={quality}
          className={cn(
            cutout ? "object-contain p-[12%] drop-shadow-[0_24px_28px_rgba(43,27,34,0.22)]" : "object-cover",
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
          quality={quality}
          className={cn("object-cover", imgClassName)}
        />
      ) : (
        <div role="img" aria-label={alt} className={cn("absolute inset-0", imgClassName)} style={{ background: spotlight }}>
          <span className="wordmark absolute right-5 bottom-4 text-[11px] text-rose/60">{label ?? "Z STUDIOS"}</span>
          <span className="absolute inset-0 flex items-center justify-center font-display text-[min(30vw,180px)] leading-none text-rose/[0.07] select-none">
            Z
          </span>
        </div>
      )}

      {showCredit && meta?.credit && (
        <a
          href={meta.credit.href}
          target="_blank"
          rel="noreferrer"
          className="absolute right-0 bottom-0 bg-ink/80 px-2 py-1 text-[10px] text-muted backdrop-blur-sm"
        >
          {meta.credit.license ? `Photo: ${meta.credit.text}, ${meta.credit.license}` : `Image: ${meta.credit.text}`}
        </a>
      )}
    </div>
  );
}
