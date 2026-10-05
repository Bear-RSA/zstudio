import { MessageCircle } from "lucide-react";
import { contact, whatsappUrl } from "@/content/contact";

/** Floating click-to-chat. Plain link to wa.me: no script, no tracking. */
export function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noreferrer"
      aria-label={`Chat with Z Studios on WhatsApp, ${contact.phone}`}
      className="press fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex h-12 items-center gap-2 rounded-full bg-pink px-4 text-[12px] font-medium tracking-[0.14em] text-bone uppercase shadow-[0_8px_24px_rgba(168,56,95,0.25)] sm:right-6 sm:bottom-6"
    >
      <MessageCircle size={18} aria-hidden />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
