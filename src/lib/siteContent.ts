import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, any>();
const subs = new Map<string, Set<(v: any) => void>>();

export async function loadSiteContent(key: string, fallback: any = {}) {
  if (cache.has(key)) return cache.get(key);
  const { data } = await supabase.from("site_content").select("value").eq("key", key).maybeSingle();
  const v = data?.value ?? fallback;
  cache.set(key, v);
  return v;
}

export async function saveSiteContent(key: string, value: any) {
  const { error } = await supabase.from("site_content").upsert({ key, value });
  if (error) throw error;
  cache.set(key, value);
  subs.get(key)?.forEach((cb) => cb(value));
}

export function useSiteContent<T = any>(key: string, fallback: T): T {
  const [val, setVal] = useState<T>(cache.get(key) ?? fallback);
  useEffect(() => {
    let mounted = true;
    loadSiteContent(key, fallback).then((v) => mounted && setVal(v));
    const set = subs.get(key) ?? new Set();
    set.add(setVal as any);
    subs.set(key, set);
    return () => { mounted = false; set.delete(setVal as any); };
  }, [key]);
  return val;
}