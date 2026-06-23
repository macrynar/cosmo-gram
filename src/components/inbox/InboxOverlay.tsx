"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { Mail, FileText, Bell, Sparkles, X, ChevronLeft, Lock } from "lucide-react";
import { useInbox, type InboxItemT } from "@/components/inbox/InboxProvider";
import { useSubscription } from "@/components/SubscriptionContext";

const EASE = [0.22, 1, 0.36, 1] as const;

function typeIcon(type: InboxItemT["type"]) {
  if (type === "report") return FileText;
  if (type === "announcement" || type === "system") return Bell;
  if (type === "forecast") return Sparkles;
  return Mail;
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "przed chwilą";
  if (min < 60) return `${min} min temu`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} godz temu`;
  const d = Math.round(h / 24);
  if (d === 1) return "wczoraj";
  if (d < 7) return `${d} dni temu`;
  return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
}

const PANEL_BG = "#0E0B18";

export default function InboxOverlay() {
  const { isOpen, items, loading, close, openItem, activeLetter, letterLoading, closeLetter } = useInbox();
  const { isPro } = useSubscription();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Blokada scrolla tła
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  const panelMotion = isMobile
    ? { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } }
    : { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } };

  const panelStyle: React.CSSProperties = isMobile
    ? { left: 0, right: 0, bottom: 0, maxHeight: "88vh", borderTopLeftRadius: 20, borderTopRightRadius: 20 }
    : { top: 0, right: 0, bottom: 0, width: 440, maxWidth: "100vw" };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[90]"
            style={{ background: "rgba(5,4,10,0.62)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
          />
          <motion.aside
            className="fixed z-[100] flex flex-col"
            style={{
              ...panelStyle,
              background: PANEL_BG,
              borderLeft: isMobile ? "none" : "1px solid #2B2540",
              boxShadow: "0 0 60px rgba(0,0,0,0.5)",
            }}
            {...panelMotion}
            transition={{ duration: 0.42, ease: EASE }}
            role="dialog"
            aria-label="Skrzynka"
          >
            {isMobile && (
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
                <div style={{ width: 36, height: 4, borderRadius: 999, background: "#2B2540" }} />
              </div>
            )}

            {activeLetter || letterLoading ? (
              <ReaderView />
            ) : (
              <>
                <header className="flex items-center justify-between" style={{ padding: "18px 20px 14px", borderBottom: "1px solid #1d1830" }}>
                  <h2 style={{ color: "#F4F1EA", fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>Skrzynka</h2>
                  <button onClick={close} aria-label="Zamknij" className="flex items-center justify-center rounded-full hover:bg-[rgba(182,175,198,0.10)]" style={{ width: 32, height: 32 }}>
                    <X size={18} strokeWidth={1.5} color="#B6AFC6" />
                  </button>
                </header>

                <div className="flex-1 overflow-y-auto" style={{ padding: "8px 12px 24px" }}>
                  {loading && items.length === 0 ? (
                    <p style={{ color: "#877FA0", fontSize: 13, textAlign: "center", padding: "40px 0" }}>Wczytuję…</p>
                  ) : items.length === 0 ? (
                    <EmptyState />
                  ) : (
                    items.map((item, i) => {
                      const Icon = typeIcon(item.type);
                      const unread = !item.read_at;
                      return (
                        <motion.button
                          key={item.id}
                          onClick={() => openItem(item)}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.35, ease: EASE }}
                          className="w-full text-left flex gap-3 transition-colors duration-200 hover:bg-[rgba(182,175,198,0.05)]"
                          style={{ padding: "14px 12px", borderRadius: 14, position: "relative" }}
                        >
                          <span
                            className="flex items-center justify-center shrink-0"
                            style={{
                              width: 38, height: 38, borderRadius: 11,
                              background: unread ? "rgba(255,174,61,0.12)" : "rgba(182,175,198,0.07)",
                              border: `1px solid ${unread ? "rgba(255,174,61,0.3)" : "#2B2540"}`,
                            }}
                          >
                            <Icon size={17} strokeWidth={1.5} color={unread ? "#FFB23E" : "#B6AFC6"} />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="flex items-center justify-between gap-2">
                              <span style={{ color: unread ? "#F4F1EA" : "#B6AFC6", fontSize: 14.5, fontWeight: unread ? 600 : 500, lineHeight: 1.3 }}>
                                {item.title}
                              </span>
                              {unread && <span style={{ width: 8, height: 8, borderRadius: 999, background: "#FFAE3D", boxShadow: "0 0 8px rgba(255,174,61,0.7)", flexShrink: 0 }} />}
                            </span>
                            {item.preview && (
                              <span className="block" style={{ color: "#877FA0", fontSize: 12.5, lineHeight: 1.5, marginTop: 3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {item.preview}
                              </span>
                            )}
                            <span className="block" style={{ color: "#5f586e", fontSize: 11, marginTop: 5 }}>{relTime(item.created_at)}</span>
                          </span>
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  function ReaderView() {
    return (
      <>
        <header className="flex items-center gap-2" style={{ padding: "14px 14px 12px", borderBottom: "1px solid #1d1830" }}>
          <button onClick={closeLetter} aria-label="Wróć" className="flex items-center justify-center rounded-full hover:bg-[rgba(182,175,198,0.10)]" style={{ width: 32, height: 32 }}>
            <ChevronLeft size={20} strokeWidth={1.5} color="#B6AFC6" />
          </button>
          <span style={{ color: "#877FA0", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase" }}>List od Astrei</span>
          <button onClick={close} aria-label="Zamknij" className="flex items-center justify-center rounded-full hover:bg-[rgba(182,175,198,0.10)] ml-auto" style={{ width: 32, height: 32 }}>
            <X size={18} strokeWidth={1.5} color="#B6AFC6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto" style={{ padding: "24px 24px 48px" }}>
          {letterLoading || !activeLetter ? (
            <p style={{ color: "#877FA0", fontSize: 13, textAlign: "center", padding: "40px 0" }}>Otwieram list…</p>
          ) : (
            <article style={{ maxWidth: 620, margin: "0 auto" }}>
              <h1 style={{ color: "#F4F1EA", fontSize: 26, fontWeight: 600, lineHeight: 1.25, letterSpacing: "-0.01em", margin: "0 0 12px", fontFamily: "var(--font-cormorant), Georgia, serif" }}>
                {activeLetter.title}
              </h1>
              {activeLetter.signature_label && (
                <span style={{ display: "inline-block", marginBottom: 22, padding: "4px 12px", borderRadius: 999, background: "rgba(255,174,61,0.10)", border: "1px solid rgba(255,174,61,0.25)", color: "#E0B566", fontSize: 11.5, letterSpacing: "0.02em" }}>
                  ✦ {activeLetter.signature_label}
                </span>
              )}
              <div style={{ color: "#D2CCDE", fontSize: 16.5, lineHeight: 1.85 }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p style={{ margin: "0 0 18px" }}>{children}</p>,
                    h2: ({ children }) => <h2 style={{ color: "#E9DCC0", fontSize: 19, fontWeight: 600, margin: "28px 0 12px", fontFamily: "var(--font-cormorant), Georgia, serif" }}>{children}</h2>,
                    h3: ({ children }) => <h3 style={{ color: "#E9DCC0", fontSize: 16.5, fontWeight: 600, margin: "22px 0 10px" }}>{children}</h3>,
                    em: ({ children }) => <em style={{ color: "#B6AFC6", fontStyle: "italic" }}>{children}</em>,
                    strong: ({ children }) => <strong style={{ color: "#F4F1EA", fontWeight: 600 }}>{children}</strong>,
                    blockquote: ({ children }) => <blockquote style={{ borderLeft: "2px solid rgba(255,174,61,0.4)", paddingLeft: 16, margin: "0 0 18px", color: "#E9DCC0", fontStyle: "italic" }}>{children}</blockquote>,
                  }}
                >
                  {activeLetter.content_md}
                </ReactMarkdown>
              </div>

              {!isPro && activeLetter.tier === "free" && (
                <div style={{ marginTop: 36, padding: "24px 22px", borderRadius: 16, background: "rgba(255,174,61,0.06)", border: "1px solid rgba(255,174,61,0.22)", textAlign: "center" }}>
                  <Lock size={20} strokeWidth={1.5} color="#FFB23E" style={{ margin: "0 auto 12px" }} />
                  <p style={{ color: "#E9DCC0", fontSize: 16, lineHeight: 1.5, margin: "0 0 8px", fontFamily: "var(--font-cormorant), Georgia, serif" }}>
                    To dopiero pierwszy list.
                  </p>
                  <p style={{ color: "#B6AFC6", fontSize: 13.5, lineHeight: 1.65, margin: "0 0 18px" }}>
                    Kolejne — o Twoich emocjach, miłości, darach i cieniu — Astrea pisze tylko dla subskrybentów.
                  </p>
                  <Link
                    href="/pricing"
                    onClick={close}
                    style={{ display: "inline-block", padding: "12px 28px", borderRadius: 999, background: "linear-gradient(135deg, #FFC56B, #FFAE3D)", color: "#201405", fontSize: 14, fontWeight: 600, textDecoration: "none" }}
                  >
                    Odblokuj kolejne listy →
                  </Link>
                </div>
              )}
            </article>
          )}
        </div>
      </>
    );
  }
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "56px 24px" }}>
      <Mail size={32} strokeWidth={1.2} color="#3a3450" style={{ margin: "0 auto 16px" }} />
      <p style={{ color: "#B6AFC6", fontSize: 14, margin: "0 0 6px" }}>Tu pojawią się listy od Astrei</p>
      <p style={{ color: "#5f586e", fontSize: 12.5, lineHeight: 1.6, maxWidth: 260, margin: "0 auto" }}>
        Astrea odsłania kolejne warstwy Twojego kosmogramu — krok po kroku.
      </p>
    </div>
  );
}
