import { useState } from "react";

export type Plan = "free" | "pro";

/**
 * Resolves the current user's plan.
 * Driven by a `?plan=pro` query param (falls back to the `ttt_plan`
 * localStorage key, then "free"). Replace with real subscription state
 * once billing is wired up.
 */
export function usePlan(): Plan {
  const read = (): Plan => {
    if (typeof window === "undefined") return "free";
    const q = new URLSearchParams(window.location.search).get("plan");
    if (q === "pro" || q === "free") return q;
    const stored = window.localStorage.getItem("ttt_plan");
    return stored === "pro" ? "pro" : "free";
  };
  const [plan] = useState<Plan>(read);
  return plan;
}
