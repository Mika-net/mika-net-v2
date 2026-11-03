// CNT-09 / CNT-10 — one place that decides which posts are visible and which tags get pages.
import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/** Drafts are included only when INCLUDE_DRAFTS=true (dev and local builds), never in prod. */
export const includeDrafts = import.meta.env.INCLUDE_DRAFTS === 'true' || import.meta.env.DEV;

export async function getVisiblePosts(): Promise<Post[]> {
  const all = await getCollection('posts', ({ data }) => includeDrafts || !data.draft);
  return all.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

/** Non-draft posts only — for feeds and sitemaps in every environment (CNT-09). */
export async function getPublishedPosts(): Promise<Post[]> {
  const all = await getCollection('posts', ({ data }) => !data.draft);
  return all.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

/** Tags with two or more non-draft posts get an index page. */
export async function getLinkableTags(): Promise<Map<string, Post[]>> {
  const posts = await getPublishedPosts();
  const byTag = new Map<string, Post[]>();
  for (const p of posts) for (const t of p.data.tags) byTag.set(t, [...(byTag.get(t) ?? []), p]);
  for (const [t, list] of byTag) if (list.length < 2) byTag.delete(t);
  return byTag;
}

export function groupByYear(posts: Post[]): [number, Post[]][] {
  const map = new Map<number, Post[]>();
  for (const p of posts) {
    const y = p.data.pubDate.getUTCFullYear();
    map.set(y, [...(map.get(y) ?? []), p]);
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0]);
}

/** FE-40: featured posts first (max 3), filled to three with the newest non-featured posts. */
export async function getSelectedPosts(): Promise<Post[]> {
  const posts = await getVisiblePosts();
  const featured = posts.filter((p) => p.data.featured).slice(0, 3);
  const rest = posts.filter((p) => !featured.includes(p));
  return [...featured, ...rest].slice(0, 3);
}
