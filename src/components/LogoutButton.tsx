"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Icon from "@/components/Icon";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* Even if the request fails we still send them to the login screen. */
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink-200 bg-surface px-4 text-sm font-medium text-ink-700 transition-colors hover:border-ink-300 hover:text-ink-900 disabled:opacity-60"
    >
      <Icon name="logout" className="h-4.5 w-4.5" />
      {pending ? "Logging out…" : "Log out"}
    </button>
  );
}
