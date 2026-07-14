import WorkGallery from "@/components/WorkGallery";
import { getArtworks } from "@/lib/store";
import { getInstagramFeed } from "@/lib/instagram";

export const dynamic = "force-dynamic";

export default async function PaparazziPage() {
  const [artworks, instagram] = await Promise.all([
    getArtworks("paparazzi"),
    getInstagramFeed(),
  ]);
  return (
    <WorkGallery
      artworks={artworks}
      instagram={instagram}
      emptyNoun="paparazzi"
      minimal
    />
  );
}
