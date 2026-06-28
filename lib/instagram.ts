import { site } from "./site";

export type IgPost = {
  id: string;
  image: string;
  permalink: string;
  caption?: string;
};

export type IgFeed = {
  posts: IgPost[];
  /** Profile picture URL, if the feed provides one. */
  avatar?: string;
};

/** Shape of a single post as returned by a behold.so feed. */
type BeholdPost = {
  id: string;
  permalink: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  prunedCaption?: string;
  caption?: string;
  sizes?: Record<string, { mediaUrl?: string } | undefined>;
};

/**
 * Fetch the latest Instagram posts for the contact profile from behold.so.
 * Returns an empty feed if no feed id is configured or the request fails, so
 * the UI can gracefully fall back to its placeholder grid.
 */
export async function getInstagramFeed(): Promise<IgFeed> {
  const feed = process.env.BEHOLD_FEED_ID || site.contact.instagramFeed;
  if (!feed) return { posts: [] };

  const url = feed.startsWith("http")
    ? feed
    : `https://feeds.behold.so/${feed}`;

  try {
    // Revalidate every 10 minutes so we don't hammer behold on every request
    // (the page itself is force-dynamic).
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return { posts: [] };

    const data = await res.json();
    const raw: BeholdPost[] = Array.isArray(data) ? data : (data.posts ?? []);
    const avatar: string | undefined =
      data?.profilePictureUrl || data?.feedMetadata?.profilePictureUrl;

    const posts = raw.slice(0, 9).map((p) => ({
      id: p.id,
      image:
        p.sizes?.medium?.mediaUrl ||
        p.sizes?.small?.mediaUrl ||
        p.mediaUrl ||
        p.thumbnailUrl ||
        "",
      permalink: p.permalink,
      caption: p.prunedCaption || p.caption,
    }));

    return { posts, avatar };
  } catch {
    return { posts: [] };
  }
}
