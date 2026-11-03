// DISC-03 / CNT-20 — RSS with full content for Markdown posts.
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { render } from 'astro:content';
import { getPublishedPosts } from '@/lib/posts';

export const GET: APIRoute = async (context) => {
  const posts = await getPublishedPosts();
  const site = context.site ?? new URL('https://mika-net.io');
  const container = await AstroContainer.create();

  const items = await Promise.all(
    posts.map(async (post) => {
      let content: string | undefined;
      try {
        const { Content } = await render(post);
        content = await container.renderToString(Content);
      } catch {
        content = undefined; // description + link still go out (CNT-20)
      }
      return {
        title: post.data.title,
        link: `/posts/${post.id}/`,
        pubDate: post.data.pubDate,
        description: post.data.description,
        categories: post.data.tags,
        ...(content ? { content } : {}),
      };
    }),
  );

  return rss({
    title: 'Lessons Distilled — writing by Michael Johnson',
    description: 'Lessons learned from building things.',
    site,
    items,
    stylesheet: '/rss.xsl',
    customData: '<language>en-us</language>',
    trailingSlash: true,
  });
};
