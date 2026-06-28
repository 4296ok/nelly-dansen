import WorkGallery from "@/components/WorkGallery";
import { getArtworks } from "@/lib/store";
import { getInstagramFeed } from "@/lib/instagram";

export const dynamic = "force-dynamic";

export default async function WorkPage() {
  const [artworks, instagram] = await Promise.all([
    getArtworks(),
    getInstagramFeed(),
  ]);
  return <WorkGallery artworks={artworks} instagram={instagram} />;
}
