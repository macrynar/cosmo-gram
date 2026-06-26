const ORG = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Cosmogram",
  url: "https://www.cosmo-gram.com",
  logo: "https://www.cosmo-gram.com/icons/icon-512.png",
  description:
    "Cosmogram — astrologia osobista oparta na danych astronomicznych i AI. Kosmogram natalny, synastria, kalendarz tranzytów i chat z Astreą, po polsku.",
  // TODO(Mac): uzupełnij realnymi profilami i odkomentuj. NIE wstawiaj zmyślonych URL-i.
  // sameAs: ["https://www.instagram.com/...", "https://www.tiktok.com/@...", "https://www.facebook.com/..."],
};

const WEBSITE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Cosmogram",
  url: "https://www.cosmo-gram.com",
  inLanguage: "pl-PL",
  publisher: { "@type": "Organization", name: "Cosmogram" },
};

export default function OrganizationJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify([ORG, WEBSITE]) }}
    />
  );
}
