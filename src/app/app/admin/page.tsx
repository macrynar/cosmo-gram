"use client";

import { redirect } from "next/navigation";

export default function AdminRoot() {
  redirect("/app/admin/prompts");
}
