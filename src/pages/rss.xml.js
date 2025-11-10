import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts";
import MarkdownIt from "markdown-it";
import { parse as htmlParse } from "node-html-parser";
import { getImage } from "astro:assets";
const md = new MarkdownIt();
const imagesGlob = import.meta.glob(
  "/src/content/**/*.{jpeg,jpg,png,gif,webp,svg,avif}",
);
export async function GET(context) {
  const posts = await getCollection("blog");
  const items = [];
  for (const post of posts) {
    const hero = post.data.heroImage;
    const heroSrc =
      hero && typeof hero === "object" && "src" in hero ? hero.src : hero;
    const heroAbs = heroSrc
      ? new URL(heroSrc, context.site).toString()
      : undefined;
    const bodyHtml = md.render(post.body || "");
    const html = htmlParse(bodyHtml);
    const imgs = html.querySelectorAll("img");
    const fileDir =
      "/src/content/project/" +
      (post.id.includes("/")
        ? post.id.slice(0, post.id.lastIndexOf("/") + 1)
        : "");
    for (const img of imgs) {
      const src = img.getAttribute("src");
      if (!src) continue;
      if (/^https?:\/\//i.test(src)) continue;
      if (src.startsWith("/")) {
        const abs = new URL(src, context.site).toString();
        img.setAttribute("src", abs);
        continue;
      }
      try {
        const normalized = new URL(src, "file://" + fileDir).pathname;
        const mod = imagesGlob[normalized]
          ? await imagesGlob[normalized]()
          : undefined;
        if (mod && mod.default) {
          const optimized = await getImage({ src: mod.default });
          const abs = new URL(optimized.src, context.site).toString();
          img.setAttribute("src", abs);
        }
      } catch {}
    }
    const type =
      heroAbs && heroAbs.toLowerCase().endsWith(".png")
        ? "image/png"
        : heroAbs && heroAbs.toLowerCase().endsWith(".webp")
          ? "image/webp"
          : heroAbs && heroAbs.toLowerCase().endsWith(".gif")
            ? "image/gif"
            : heroAbs && heroAbs.toLowerCase().endsWith(".svg")
              ? "image/svg+xml"
              : heroAbs
                ? "image/jpeg"
                : undefined;
    items.push({
      title: post.data.title,
      description: post.data.description || SITE_DESCRIPTION,
      pubDate: post.data.pubDate,
      updatedDate: post.data.updatedDate,
      link: `/projects/${post.id}/`,
      enclosure:
        heroAbs && type ? { url: heroAbs, length: 0, type } : undefined,
      customData: heroAbs
        ? `<media:content medium="image" url="${heroAbs}" />`
        : undefined,
    });
  }
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    xmlns: { media: "http://search.yahoo.com/mrss/" },
    items,
    stylesheet: '/pretty-feed-v3.xsl',
  });
}
