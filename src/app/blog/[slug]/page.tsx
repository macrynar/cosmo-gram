import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { mdxComponents } from "@/components/blog/MdxComponents";
import { getPostBySlug, getPublishedPosts } from "@/lib/blog";

const BASE_URL = "https://www.cosmo-gram.com";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const fm = post.frontmatter;
  const title = fm.title.includes("Cosmogram") ? fm.title : `${fm.title} · Cosmogram`;
  const url = `${BASE_URL}/blog/${fm.slug}`;

  return {
    title,
    description: fm.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description: fm.excerpt,
      url,
      siteName: "Cosmogram",
      publishedTime: fm.publishedAt,
      modifiedTime: fm.updatedAt,
      authors: [fm.author.name],
      images: [{ url: `${BASE_URL}${fm.cover}`, width: 1200, height: 630, alt: fm.coverAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: fm.excerpt,
      images: [`${BASE_URL}${fm.cover}`],
    },
  };
}

/* ─── style helpers (spójne z /cosmogram) ─── */
const wrap: CSSProperties = { maxWidth: 760, margin: "0 auto", padding: "0 22px" };
const serif: CSSProperties = {
  fontFamily: "var(--font-fraunces), 'Fraunces', serif",
  fontWeight: 500,
  letterSpacing: "0.01em",
  lineHeight: 1.15,
  color: "var(--text-primary)",
};
const btnPrimary: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "var(--grad-ember)",
  color: "#241704",
  border: "none",
  borderRadius: 999,
  fontWeight: 600,
  fontSize: 15,
  padding: "14px 30px",
  textDecoration: "none",
  boxShadow: "0 8px 26px rgba(255,174,61,.18)",
};
const cardBase: CSSProperties = { background: "var(--bg-elevated)", border: "1px solid var(--line)", borderRadius: 16 };
const metaText: CSSProperties = { color: "var(--text-muted)", fontSize: 13.5 };
const crumbLink: CSSProperties = { color: "var(--text-muted)", textDecoration: "none" };

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || post.frontmatter.draft) notFound();

  const fm = post.frontmatter;
  const url = `${BASE_URL}/blog/${fm.slug}`;
  const wasUpdated = fm.updatedAt > fm.publishedAt;

  const jsonBlogPosting = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: fm.title,
    description: fm.excerpt,
    image: `${BASE_URL}${fm.cover}`,
    datePublished: fm.publishedAt,
    dateModified: fm.updatedAt,
    author: { "@type": "Person", name: fm.author.name, description: fm.author.bio },
    publisher: {
      "@type": "Organization",
      name: "Cosmogram",
      logo: { "@type": "ImageObject", url: `${BASE_URL}/icons/icon-512.png` },
    },
    mainEntityOfPage: url,
    inLanguage: "pl-PL",
  };

  const jsonBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Cosmogram", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: fm.title, item: url },
    ],
  };

  const jsonFaq = fm.faq?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: fm.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  return (
    <div
      style={{
        background: "var(--bg-base)",
        color: "var(--text-primary)",
        fontFamily: "'General Sans', system-ui, sans-serif",
        lineHeight: 1.6,
        minHeight: "100vh",
      }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonBlogPosting) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonBreadcrumb) }} />
      {jsonFaq && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonFaq) }} />
      )}

      <Navbar />

      <main style={{ paddingTop: 92, paddingBottom: 72 }}>
        <article>
          {/* Breadcrumb */}
          <div style={{ ...wrap, marginBottom: 18 }}>
            <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: "var(--text-muted)" }}>
              <Link href="/blog" style={crumbLink}>
                Blog
              </Link>
              <span style={{ margin: "0 8px" }}>›</span>
              <span style={{ color: "var(--accent-deep)" }}>{fm.category}</span>
            </nav>
          </div>

          {/* Tytuł + meta (E-E-A-T) */}
          <header style={{ ...wrap, marginBottom: 26 }}>
            <h1 style={{ ...serif, fontSize: "clamp(30px, 5vw, 44px)", marginBottom: 16 }}>{fm.title}</h1>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 14px", ...metaText }}>
              <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{fm.author.name}</span>
              <span aria-hidden>·</span>
              <time dateTime={fm.publishedAt}>{formatDate(fm.publishedAt)}</time>
              {wasUpdated && (
                <>
                  <span aria-hidden>·</span>
                  <span>zaktualizowano {formatDate(fm.updatedAt)}</span>
                </>
              )}
              <span aria-hidden>·</span>
              <span>{post.readingTimeMin} min czytania</span>
            </div>
          </header>

          {/* Okładka */}
          <div style={{ ...wrap, marginBottom: 32 }}>
            <Image
              src={fm.cover}
              alt={fm.coverAlt}
              width={1200}
              height={630}
              priority
              sizes="(max-width: 760px) 100vw, 760px"
              style={{ width: "100%", height: "auto", borderRadius: 16, border: "1px solid var(--line)" }}
            />
          </div>

          {/* Treść MDX */}
          <div style={wrap}>
            <MDXRemote
              source={post.content}
              components={mdxComponents}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                  rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
                },
              }}
            />
          </div>

          {/* FAQ */}
          {fm.faq?.length ? (
            <section style={{ ...wrap, marginTop: 44 }}>
              <h2 style={{ ...serif, fontSize: "clamp(22px, 3vw, 28px)", marginBottom: 16 }}>
                Najczęstsze pytania
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {fm.faq.map((item) => (
                  <details key={item.q} style={{ ...cardBase, borderRadius: 13, padding: "4px 18px" }}>
                    <summary
                      style={{
                        cursor: "pointer",
                        padding: "15px 0",
                        fontWeight: 600,
                        fontSize: 15,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        listStyle: "none",
                        color: "var(--text-primary)",
                      }}
                    >
                      {item.q}
                      <span style={{ color: "var(--accent-deep)", fontSize: 20, flexShrink: 0 }}>+</span>
                    </summary>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14.5, lineHeight: 1.65, paddingBottom: 16 }}>
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          {/* CTA → pillar */}
          <section style={{ ...wrap, marginTop: 48 }}>
            <div
              style={{
                textAlign: "center",
                background: "radial-gradient(120% 120% at 50% 0%, rgba(224,181,102,.08), var(--bg-elevated))",
                border: "1px solid rgba(224,181,102,.22)",
                borderRadius: 22,
                padding: "40px 28px",
              }}
            >
              <h2 style={{ ...serif, fontSize: "clamp(24px, 3.4vw, 32px)", marginBottom: 12 }}>
                Poznaj swój własny kosmogram
              </h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: 24, maxWidth: 460, marginInline: "auto" }}>
                Zamiast czytać o cudzej mapie nieba — zobacz swoją. Za darmo, bez karty.
              </p>
              <Link href={fm.pillar || "/cosmogram"} style={btnPrimary}>
                Wygeneruj swój kosmogram za darmo →
              </Link>
            </div>
          </section>

          {/* Dyskalimer (YMYL / E-E-A-T) */}
          <div style={{ ...wrap, marginTop: 32 }}>
            <p style={{ ...metaText, fontSize: 12.5, lineHeight: 1.6, fontStyle: "italic" }}>
              Treści mają charakter refleksyjny i rozrywkowy — nie zastępują porady medycznej,
              psychologicznej, prawnej ani finansowej.
            </p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
