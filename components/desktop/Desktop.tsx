import DesktopShell from "./DesktopShell";
import Marquee from "./Marquee";
import { site } from "@/lib/site";
import type { IgFeed } from "@/lib/instagram";

export default function Desktop({ instagram }: { instagram: IgFeed }) {
  const bg = `linear-gradient(rgba(40,20,60,0.35), rgba(20,30,20,0.45)), url(${site.background})`;

  return (
    <DesktopShell
      instagram={instagram}
      className="overflow-hidden bg-zinc-700"
      style={{ background: bg, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {/* Looping background video (poster/photo shows while it loads) */}
      {site.backgroundVideo && (
        <>
          <video
            className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={site.background}
            src={site.backgroundVideo}
          />
          {/* Darkening overlay so the windows stay readable over the video */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[rgba(40,20,60,0.35)] to-[rgba(20,30,20,0.45)]" />
        </>
      )}

      <Marquee text={site.marquee} logo={site.marqueeLogo} />
    </DesktopShell>
  );
}
