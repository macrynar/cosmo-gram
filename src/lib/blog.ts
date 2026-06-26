import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";

export type BlogFrontmatter = {
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
  author: { name: string; bio: string };
  cover: string;
  coverAlt: string;
  category: string;
  tags: string[];
  pillar: string;
  faq?: { q: string; a: string }[];
  draft?: boolean;
};

export type BlogPost = {
  frontmatter: BlogFrontmatter;
  slug: string;
  content: string; // surowy MDX (do MDXRemote)
  readingTimeMin: number;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

/** Pola wymagane we frontmatterze — brak któregokolwiek = crash w buildzie. */
function validate(fm: Record<string, unknown>, file: string): BlogFrontmatter {
  const fail = (msg: string): never => {
    throw new Error(`[blog] ${file}: ${msg}`);
  };

  const str = (key: string): string => {
    const v = fm[key];
    if (typeof v !== "string" || v.trim() === "") fail(`brak lub puste pole tekstowe "${key}"`);
    return v as string;
  };

  const author = fm.author as { name?: unknown; bio?: unknown } | undefined;
  if (!author || typeof author.name !== "string" || typeof author.bio !== "string") {
    fail(`pole "author" musi mieć { name, bio } (string)`);
  }

  if (!Array.isArray(fm.tags) || fm.tags.some((t) => typeof t !== "string")) {
    fail(`pole "tags" musi być listą stringów`);
  }

  let faq: BlogFrontmatter["faq"];
  if (fm.faq !== undefined) {
    if (!Array.isArray(fm.faq)) fail(`pole "faq" musi być listą { q, a }`);
    faq = (fm.faq as unknown[]).map((item, i) => {
      const it = item as { q?: unknown; a?: unknown };
      if (typeof it?.q !== "string" || typeof it?.a !== "string") {
        fail(`faq[${i}] musi mieć { q, a } (string)`);
      }
      return { q: it.q as string, a: it.a as string };
    });
  }

  return {
    title: str("title"),
    slug: str("slug"),
    excerpt: str("excerpt"),
    publishedAt: str("publishedAt"),
    updatedAt: str("updatedAt"),
    author: { name: (author as { name: string }).name, bio: (author as { bio: string }).bio },
    cover: str("cover"),
    coverAlt: str("coverAlt"),
    category: str("category"),
    tags: fm.tags as string[],
    pillar: str("pillar"),
    faq,
    draft: fm.draft === true,
  };
}

/** Wszystkie posty z content/blog/*.mdx (łącznie z draftami). */
export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
      const { data, content } = matter(raw);
      const frontmatter = validate(data, file);

      const fileSlug = file.replace(/\.mdx$/, "");
      if (frontmatter.slug !== fileSlug) {
        throw new Error(
          `[blog] ${file}: slug "${frontmatter.slug}" nie zgadza się z nazwą pliku "${fileSlug}"`,
        );
      }

      return {
        frontmatter,
        slug: frontmatter.slug,
        content,
        readingTimeMin: Math.max(1, Math.round(readingTime(content).minutes)),
      };
    });
}

/** Posty do publikacji: draft !== true, sort po publishedAt malejąco. */
export function getPublishedPosts(): BlogPost[] {
  return getAllPosts()
    .filter((p) => p.frontmatter.draft !== true)
    .sort((a, b) => b.frontmatter.publishedAt.localeCompare(a.frontmatter.publishedAt));
}

export function getPostBySlug(slug: string): BlogPost | null {
  return getAllPosts().find((p) => p.slug === slug) ?? null;
}
