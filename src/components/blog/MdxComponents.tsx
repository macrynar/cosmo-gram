import Link from "next/link";
import type { CSSProperties, ReactNode, AnchorHTMLAttributes, ImgHTMLAttributes } from "react";

const serif: CSSProperties = {
  fontFamily: "var(--font-fraunces), 'Fraunces', serif",
  fontWeight: 500,
  letterSpacing: "0.01em",
  lineHeight: 1.2,
  color: "var(--text-primary)",
};

const linkStyle: CSSProperties = {
  color: "var(--accent-deep)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
  textDecorationColor: "rgba(224,181,102,.4)",
};

function MdxLink({ href = "", children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  // Kotwice w obrębie strony (np. self-link nagłówka z rehype-autolink) — neutralne, bez podkreślenia.
  if (href.startsWith("#")) {
    return (
      <a href={href} style={{ color: "inherit", textDecoration: "none" }} {...rest}>
        {children}
      </a>
    );
  }
  // Linki wewnętrzne → next/link.
  if (href.startsWith("/")) {
    return (
      <Link href={href} style={linkStyle}>
        {children}
      </Link>
    );
  }
  // Linki zewnętrzne → nowa karta + bezpieczne rel.
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={linkStyle} {...rest}>
      {children}
    </a>
  );
}

export const mdxComponents = {
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 style={{ ...serif, fontSize: "clamp(24px, 3.2vw, 30px)", margin: "44px 0 14px", scrollMarginTop: 96 }}>
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 style={{ ...serif, fontSize: "clamp(19px, 2.4vw, 22px)", margin: "32px 0 10px", scrollMarginTop: 96 }}>
      {children}
    </h3>
  ),
  h4: ({ children }: { children?: ReactNode }) => (
    <h4 style={{ ...serif, fontSize: 17, margin: "24px 0 8px", scrollMarginTop: 96 }}>{children}</h4>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p style={{ color: "var(--text-secondary)", fontSize: 16.5, lineHeight: 1.75, margin: "0 0 18px" }}>
      {children}
    </p>
  ),
  a: MdxLink,
  ul: ({ children }: { children?: ReactNode }) => (
    <ul style={{ color: "var(--text-secondary)", fontSize: 16.5, lineHeight: 1.7, margin: "0 0 18px", paddingLeft: 22, listStyle: "disc" }}>
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol style={{ color: "var(--text-secondary)", fontSize: 16.5, lineHeight: 1.7, margin: "0 0 18px", paddingLeft: 22, listStyle: "decimal" }}>
      {children}
    </ol>
  ),
  li: ({ children }: { children?: ReactNode }) => <li style={{ margin: "0 0 8px" }}>{children}</li>,
  strong: ({ children }: { children?: ReactNode }) => (
    <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{children}</strong>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote
      style={{
        borderLeft: "3px solid var(--accent-deep)",
        background: "var(--bg-elevated)",
        borderRadius: "0 12px 12px 0",
        padding: "14px 20px",
        margin: "0 0 22px",
        color: "var(--text-secondary)",
        fontStyle: "italic",
      }}
    >
      {children}
    </blockquote>
  ),
  hr: () => <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "36px 0" }} />,
  img: ({ src, alt = "", ...rest }: ImgHTMLAttributes<HTMLImageElement>) => (
    // Obrazy w treści MDX nie mają znanych wymiarów → zwykły <img> zamiast next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof src === "string" ? src : undefined}
      alt={alt}
      loading="lazy"
      style={{ width: "100%", height: "auto", borderRadius: 14, border: "1px solid var(--line)", margin: "8px 0 22px" }}
      {...rest}
    />
  ),
  code: ({ children }: { children?: ReactNode }) => (
    <code
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--line)",
        borderRadius: 6,
        padding: "1px 6px",
        fontSize: "0.9em",
        fontFamily: "var(--font-montserrat), monospace",
      }}
    >
      {children}
    </code>
  ),
  table: ({ children }: { children?: ReactNode }) => (
    <div style={{ overflowX: "auto", margin: "0 0 22px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>{children}</table>
    </div>
  ),
  th: ({ children }: { children?: ReactNode }) => (
    <th style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid var(--line)", color: "var(--accent-deep)", ...serif, fontSize: 15 }}>
      {children}
    </th>
  ),
  td: ({ children }: { children?: ReactNode }) => (
    <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)", color: "var(--text-secondary)" }}>
      {children}
    </td>
  ),
};
