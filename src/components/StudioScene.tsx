import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Stand-in for studio photography: a key light and a dome softbox on a lit
 * cyclorama, built from the equipment cut-outs. Replace with Z Studios' own
 * photos by giving the studio resource `images`.
 */
export function StudioScene({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <div
      role="img"
      aria-label="Studio set with a key light and softbox"
      className={cn("relative isolate overflow-hidden rounded-2xl", className)}
      style={{
        background:
          // pink wash on a white cyclorama wall, then the floor curve
          "radial-gradient(ellipse 45% 55% at 50% 40%, rgba(245,191,209,0.20), transparent 70%), linear-gradient(180deg, #fbf3f5 0%, #f6e7ec 68%, #efdbe2 69%, #f5e6eb 100%)",
      }}
    >
      <div className="absolute inset-x-0 bottom-0 h-[32%] bg-gradient-to-b from-transparent to-rose/10" />
      <Image
        src="/equipment/light-dome.png"
        alt=""
        width={900}
        height={900}
        priority={priority}
        sizes="40vw"
        className="absolute bottom-[12%] left-[0%] w-[56%] drop-shadow-[0_30px_36px_rgba(43,27,34,0.28)]"
      />
      <Image
        src="/equipment/aputure-600d-pro.png"
        alt=""
        width={1000}
        height={1000}
        priority={priority}
        sizes="40vw"
        className="absolute right-[-2%] bottom-[10%] w-[54%] -scale-x-100 drop-shadow-[0_30px_36px_rgba(43,27,34,0.28)]"
      />
    </div>
  );
}
