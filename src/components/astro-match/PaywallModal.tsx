"use client";

import PaywallModal from "@/components/PaywallModal";

type Props = { onClose: () => void };

export default function AstroMatchPaywallModal({ onClose }: Props) {
  return (
    <PaywallModal
      onClose={onClose}
      reason="Pierwszy Astro Match jest bezpłatny. Kolejne wymagają subskrypcji."
    />
  );
}
