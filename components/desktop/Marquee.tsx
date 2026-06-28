export default function Marquee({
  text,
  logo,
}: {
  text: string;
  logo?: string;
}) {
  // Prefer a locally installed Adobe Garamond Pro; fall back to the web-loaded
  // EB Garamond (--font-garamond), then generic serif.
  const garamond = '"Adobe Garamond Pro", var(--font-garamond), Garamond, serif';

  // Two identical groups so the -50% translate loops seamlessly.
  const group = (
    <div className="flex shrink-0 items-center">
      {Array.from({ length: 6 }).map((_, i) =>
        logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={logo}
            alt={text}
            className="mx-6 h-5 w-auto select-none sm:h-6"
          />
        ) : (
          <span
            key={i}
            style={{ fontFamily: garamond }}
            className="mx-6 whitespace-nowrap text-xl leading-none text-black sm:text-2xl"
          >
            {text}
          </span>
        ),
      )}
    </div>
  );

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full overflow-hidden border-t border-black/15 bg-white py-1">
      <div className="marquee-track">
        {group}
        {group}
      </div>
    </div>
  );
}
