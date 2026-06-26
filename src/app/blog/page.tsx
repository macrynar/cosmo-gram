import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPublishedPosts, getCoverUrl } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Cosmogram",
  description:
    "Artykuły o astrologii, kosmogramach i tym, co mówią gwiazdy. Wiedza, która pomaga rozumieć siebie głębiej.",
  alternates: { canonical: "https://www.cosmo-gram.com/blog" },
};

const wrap: CSSProperties = { maxWidth: 1000, margin: "0 auto", padding: "0 22px" };
const serif: CSSProperties = {
  fontFamily: "var(--font-fraunces), 'Fraunces', serif",
  fontWeight: 500,
  letterSpacing: "0.01em",
  lineHeight: 1.15,
  color: "var(--text-primary)",
};
const cardBase: CSSProperties = { background: "var(--bg-elevated)", border: "1px solid var(--line)", borderRadius: 16 };

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}

export default function BlogPage() {
  const posts = getPublishedPosts();

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
      <Navbar />

      <main style={{ paddingTop: 96, paddingBottom: 80 }}>
        <div style={wrap}>
          <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 44px" }}>
            <h1 style={{ ...serif, fontSize: "clamp(34px, 5vw, 48px)", marginBottom: 14 }}>Blog</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 17 }}>
              Astrologia osobista bez żargonu — kosmogram, tranzyty i to, co mówi o Tobie niebo.
            </p>
          </div>

          {posts.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)" }}>
              Pierwsze artykuły już wkrótce.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 20,
              }}
            >
              {posts.map((post) => {
                const fm = post.frontmatter;
                const coverUrl = getCoverUrl(post);
                return (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    style={{ ...cardBase, overflow: "hidden", textDecoration: "none", display: "flex", flexDirection: "column" }}
                  >
                    <div style={{ position: "relative", aspectRatio: "1200 / 630", background: "var(--bg-base)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverUrl}
                        alt={fm.coverAlt}
                        loading="lazy"
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ padding: 20, display: "flex", flexDirection: "column", flex: 1 }}>
                      <span
                        style={{
                          fontSize: 11,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: "var(--accent-deep)",
                          marginBottom: 10,
                        }}
                      >
                        {fm.category}
                      </span>
                      <h2 style={{ ...serif, fontSize: 20, marginBottom: 10 }}>{fm.title}</h2>
                      <p style={{ color: "var(--text-secondary)", fontSize: 14.5, lineHeight: 1.6, marginBottom: 16, flex: 1 }}>
                        {fm.excerpt}
                      </p>
                      <div style={{ color: "var(--text-muted)", fontSize: 12.5, display: "flex", gap: 10 }}>
                        <time dateTime={fm.publishedAt}>{formatDate(fm.publishedAt)}</time>
                        <span aria-hidden>·</span>
                        <span>{post.readingTimeMin} min czytania</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
