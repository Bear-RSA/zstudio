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
      className={cn("relative overflow-hidden", className)}
      style={{
        background:
          // warm pool of light on the back wall, then the floor curve of a cyc
          "radial-gradient(ellipse 45% 55% at 50% 42%, rgba(201,150,122,0.30), transparent 70%), linear-gradient(180deg, #16120f 0%, #0e0c0a 68%, #1a1512 69%, #0b0a09 100%)",
      }}
    >
      <div className="absolute inset-x-0 bottom-0 h-[32%] bg-gradient-to-b from-transparent to-black/50" />
      <Image
        src="/equipment/light-dome.png"
        alt=""
        width={900}
        height={900}
        priority={priority}
        sizes="40vw"
        className="absolute bottom-[12%] left-[0%] w-[56%] drop-shadow-[0_30px_40px_rgba(0,0,0,0.7)]"
      />
      <Image
        src="/equipment/aputure-600d-pro.png"
        alt=""
        width={1000}
        height={1000}
        priority={priority}
        sizes="40vw"
        className="absolute right-[-2%] bottom-[10%] w-[54%] -scale-x-100 drop-shadow-[0_30px_40px_rgba(0,0,0,0.7)]"
      />
    </div>
  );
}
