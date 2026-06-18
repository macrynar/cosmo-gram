import { redirect } from "next/navigation";

// Stary chat został zastąpiony przez /app/chat (redesign Astrea + licznik wiadomości).
// Zachowujemy ten route jako przekierowanie, by stare linki/zakładki działały.
export default async function ChatRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") qs.set(k, v);
    else if (Array.isArray(v) && v[0]) qs.set(k, v[0]);
  }
  const q = qs.toString();
  redirect(`/app/chat${q ? `?${q}` : ""}`);
}
