"use client";

import { useCallback, useEffect, useRef, type ProfilerOnRenderCallback } from "react";

/** Opt-in, local development diagnostics. No telemetry or additional UI. */
export function useGridProfile() {
  const enabled = useRef(false);
  const target = useRef<HTMLDivElement>(null);
  const samples = useRef<number[]>([]);
  useEffect(() => {
    enabled.current = process.env.NODE_ENV === "development" && new URLSearchParams(location.search).get("grid-profile") === "1";
  }, []);
  const onRender = useCallback<ProfilerOnRenderCallback>((_id, phase, duration) => {
    if (!enabled.current || phase === "mount" || !target.current) return;
    const values = samples.current;
    values.push(duration);
    if (values.length > 200) values.shift();
    const sorted = [...values].sort((a,b) => a-b);
    target.current.dataset.gridProfile = JSON.stringify({ samples: values.length, lastRenderMs: +duration.toFixed(2), medianRenderMs: +sorted[Math.floor(sorted.length / 2)].toFixed(2), p95RenderMs: +sorted[Math.ceil(sorted.length * .95) - 1].toFixed(2) });
  }, []);
  return { target, onRender };
}
