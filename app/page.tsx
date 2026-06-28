import Desktop from "@/components/desktop/Desktop";
import { getInstagramFeed } from "@/lib/instagram";

export const dynamic = "force-dynamic";

export default async function Home() {
  const instagram = await getInstagramFeed();
  return <Desktop instagram={instagram} />;
}
