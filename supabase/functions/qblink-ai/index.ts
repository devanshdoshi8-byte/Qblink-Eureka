import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Msg { role: "user" | "assistant" | "system"; content: string }

function mapCategory(raw: string): string {
  const c = (raw || "").toLowerCase();
  if (/(clinic|hospital|dental|medical|health|doctor)/.test(c)) return "Healthcare";
  if (/(cafe|café|coffee|bakery|brunch)/.test(c)) return "Cafes";
  if (/(restaurant|food|dining)/.test(c)) return "Restaurants";
  if (/(salon|barber|spa|grooming|beauty)/.test(c)) return "Salons";
  if (/(government|public|passport|municipal|transport|rto)/.test(c)) return "Government";
  return "Other";
}

// Rich demo fallback so the AI always has data to recommend from.
const DEMO_FALLBACK = [
  // Healthcare (5)
  { id: "d1",  name: "Sharma Dental Clinic",     category: "Clinic",     address: "Lajpat Nagar, Delhi",       rating: 4.6, waiting: 3,  est: 15, open: true },
  { id: "d2",  name: "City General Hospital",    category: "Hospital",   address: "Park Street, Kolkata",      rating: 4.3, waiting: 18, est: 12, open: true },
  { id: "d3",  name: "QuickFix Clinic",          category: "Clinic",     address: "Koramangala, Bengaluru",    rating: 4.4, waiting: 5,  est: 10, open: true },
  { id: "d4",  name: "LittleOnes Pediatrics",    category: "Clinic",     address: "Whitefield, Bengaluru",     rating: 4.8, waiting: 6,  est: 14, open: true },
  { id: "d5",  name: "MedCare Family Clinic",    category: "Clinic",     address: "Andheri West, Mumbai",      rating: 4.5, waiting: 2,  est: 12, open: true },
  // Restaurants (5)
  { id: "d6",  name: "Spice Garden Restaurant",  category: "Restaurant", address: "Connaught Place, Delhi",    rating: 4.5, waiting: 9,  est: 8,  open: true },
  { id: "d7",  name: "Tandoor House",            category: "Restaurant", address: "Indiranagar, Bengaluru",    rating: 4.6, waiting: 14, est: 9,  open: true },
  { id: "d8",  name: "Burger Republic",          category: "Restaurant", address: "Bandra Linking Road, Mumbai", rating: 4.4, waiting: 11, est: 7, open: true },
  { id: "d9",  name: "Sushi & Sake",             category: "Restaurant", address: "Cyber Hub, Gurugram",       rating: 4.7, waiting: 4,  est: 11, open: true },
  { id: "d10", name: "Aroma Café & Bakery",      category: "Cafe",       address: "MG Road, Bengaluru",        rating: 4.8, waiting: 7,  est: 6,  open: true },
  // Salons (3)
  { id: "d11", name: "Royal Barber Studio",      category: "Salon",      address: "Bandra West, Mumbai",       rating: 4.9, waiting: 12, est: 20, open: true },
  { id: "d12", name: "Glow Beauty Lounge",       category: "Salon",      address: "Hitech City, Hyderabad",    rating: 4.7, waiting: 2,  est: 25, open: true },
  { id: "d13", name: "Serene Day Spa",           category: "Spa",        address: "Anna Nagar, Chennai",       rating: 4.7, waiting: 2,  est: 45, open: true },
  // Government (3)
  { id: "d14", name: "Regional Passport Office", category: "Government", address: "Bhikaji Cama Place, Delhi", rating: 4.1, waiting: 42, est: 18, open: true },
  { id: "d15", name: "RTO Transport Office",     category: "Transport",  address: "Andheri East, Mumbai",      rating: 3.9, waiting: 56, est: 22, open: true },
  { id: "d16", name: "Municipal Corporation Desk", category: "Municipal", address: "Town Hall, Pune",          rating: 4.0, waiting: 28, est: 15, open: true },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json() as {
      messages?: Msg[];
      mode: "customer" | "business" | "queue_companion";
      businessId?: string;
      insight?: "queue" | "analytics" | "pickup" | "customer_queue" | "customer_pickup";
      payload?: Record<string, unknown>;
      queueContext?: {
        user_position?: number;
        estimated_wait_time?: number;
        now_serving?: number | null;
        user_token?: number | null;
        business_name?: string;
        location?: string;
      };
    };
    const { messages = [], mode, businessId, insight, payload, queueContext } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // For anonymous/aggregate modes (customer, queue_companion) the anon key is enough.
    // For business-scoped modes, we require an authenticated owner of the business.
    const isBusinessScoped =
      mode === "business" ||
      (insight && ["queue", "analytics", "pickup"].includes(insight) && businessId);

    let supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    if (isBusinessScoped) {
      const authHeader = req.headers.get("Authorization") || "";
      if (!authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const token = authHeader.replace("Bearer ", "");
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: userData, error: userErr } = await userClient.auth.getUser(token);
      if (userErr || !userData?.user?.id) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!businessId) {
        return new Response(JSON.stringify({ error: "businessId required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: owned } = await userClient
        .from("businesses").select("id").eq("id", businessId).eq("owner_id", userData.user.id).maybeSingle();
      if (!owned) {
        const { data: isAdmin } = await userClient.rpc("is_admin");
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      // Use the user-scoped client so all reads still go through RLS.
      supabase = userClient;
    }

    // Build live context snapshot from Qblink data only.
    let context = "";
    if (mode === "queue_companion") {
      // No DB queries — values come strictly from the client UI.
      const qc = queueContext ?? {};
      context = `LOCKED QUEUE CONTEXT (do NOT recalculate, do NOT override):
- user_position: ${qc.user_position ?? "?"} people ahead
- estimated_wait_time: ${qc.estimated_wait_time ?? "?"} minutes
- now_serving: ${qc.now_serving ?? "?"}
- user_token: ${qc.user_token ?? "?"}
- business_name: ${qc.business_name ?? "this place"}
- location: ${qc.location ?? "unknown"}`;
    } else if (mode === "customer") {
      const { data: businesses } = await supabase
        .from("businesses")
        .select("id, name, category, address, rating, is_recommended")
        .limit(40);
      const { data: queues } = await supabase
        .from("queues")
        .select("id, business_id, name, status, estimated_service_time, current_token");
      const { data: visitors } = await supabase
        .from("queue_visitors")
        .select("queue_id, status")
        .eq("status", "waiting");

      type Row = {
        id: string; name: string; category: string; address: string;
        rating: number; waiting: number; est: number; open: boolean;
      };
      const live: Row[] = (businesses ?? []).map((b: any) => {
        const qs = (queues ?? []).filter((q: any) => q.business_id === b.id);
        const waiting = qs.reduce(
          (n: number, q: any) => n + ((visitors ?? []).filter((v: any) => v.queue_id === q.id).length),
          0,
        );
        const est = qs[0]?.estimated_service_time ?? 5;
        const open = qs.length === 0 ? true : qs.some((q: any) => q.status === "active");
        return { id: b.id, name: b.name, category: b.category ?? "Other", address: b.address ?? "—", rating: b.rating ?? 4.3, waiting, est, open };
      });

      // Merge demo fallback so AI ALWAYS has rich data to reason over.
      const merged: Row[] = live.length >= 5 ? live : [...live, ...DEMO_FALLBACK];

      const grouped: Record<string, Row[]> = {};
      merged.forEach((r) => {
        const key = mapCategory(r.category);
        (grouped[key] ||= []).push(r);
      });

      const lines: string[] = [];
      Object.entries(grouped).forEach(([cat, rows]) => {
        rows.sort((a, b) => (a.waiting * a.est) - (b.waiting * b.est));
        lines.push(`\n[${cat}]`);
        rows.forEach((r) => {
          const wait = r.waiting * r.est;
          const status = !r.open ? "Closed" : wait <= 5 ? "Low wait" : wait <= 15 ? "Moderate" : "Busy";
          lines.push(`- ${r.name} | ${r.address} | Queue: ${r.waiting} ppl | Wait: ${wait} mins | Status: ${status} | Rating: ${r.rating}`);
        });
      });

      context = `LIVE QBLINK BUSINESSES (real + demo merged):${lines.join("\n")}`;
    } else if (mode === "business" && businessId) {
      const { data: queues } = await supabase
        .from("queues")
        .select("id, name, status, estimated_service_time, current_token, next_token")
        .eq("business_id", businessId);
      const queueIds = (queues ?? []).map((q) => q.id);
      const { data: visitors } = await supabase
        .from("queue_visitors")
        .select("queue_id, status, joined_at, called_at, served_at")
        .in("queue_id", queueIds.length ? queueIds : ["00000000-0000-0000-0000-000000000000"]);
      const { data: orders } = await supabase
        .from("pickup_orders")
        .select("status, eta_minutes, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(50);

      const waiting = (visitors ?? []).filter((v) => v.status === "waiting").length;
      const served = (visitors ?? []).filter((v) => v.status === "served").length;
      const avgEta = orders && orders.length
        ? Math.round(orders.reduce((s, o) => s + (o.eta_minutes ?? 0), 0) / orders.length)
        : 0;
      const hours: Record<number, number> = {};
      (visitors ?? []).forEach((v) => {
        const h = new Date(v.joined_at).getHours();
        hours[h] = (hours[h] ?? 0) + 1;
      });
      const peak = Object.entries(hours).sort((a, b) => b[1] - a[1])[0];

      context = `LIVE QBLINK OPERATIONS:
Queues: ${(queues ?? []).map((q) => `${q.name}(${q.status}, est ${q.estimated_service_time}m)`).join(", ") || "none"}
Now waiting: ${waiting}
Served today (window): ${served}
Active pickup orders: ${(orders ?? []).filter((o) => o.status !== "picked_up").length}
Avg pickup ETA: ${avgEta}m
Peak hour: ${peak ? `${peak[0]}:00 (${peak[1]} joins)` : "n/a"}`;
    }

    const QBLINK_KNOWLEDGE = `
QBLINK PLATFORM KNOWLEDGE (use naturally when relevant):
- Qblink is a hardware-free smart queue OS for walk-in businesses. Customers join queues remotely from their phone, watch live position + ETA, and arrive only when it's almost their turn.
- Works for: clinics, hospitals, diagnostic centers, dentists, restaurants, cafes, salons, spas, retail, and government offices (passport / RTO / municipal desks).
- Customer benefits: no physical waiting, live position + ETA, freedom to use the wait, less crowding, less disease exposure in healthcare, predictable visits.
- Business benefits: discovery for walk-in traffic, reduced no-shows, smoother peak hours, fewer angry waiting customers, analytics (peak hours, average wait, served vs skipped), staff plan better.
- How it works: business creates a queue → customer scans QR or opens Qblink, picks the place, taps "Join Queue" → gets a token + live updates → returns when called. Pickup flow exists for restaurants/cafes (order ahead, track ready status).
- Trust: real-time data, transparent positions, no fake numbers. Built in India by a small founder team.
- Official Qblink contacts (share these when anyone asks for support, help, escalation, business onboarding, partnership, founder, or contact info — use these EXACT details every time):
  • Phone: +91 9372090507
  • Email: teamqblink@gmail.com
  • Email: qblinkofficial@gmail.com
- Founder: Devansh Doshi. For founder-only / personal feedback you may also share devanshdoshi8@gmail.com, but always include the team contacts above first.
- Ways users can support: recommend Qblink to a clinic / cafe / salon they visit, share feedback, become an early supporter. Never be pushy about it.

TRUST & PRIVACY (this is the ONLY source of truth for any privacy, security, or data-access question. Mirror this wording exactly. Do NOT add, embellish, or invent any security detail — no mention of encryption standards, protocols, certifications, audits, servers, storage locations, deletion timelines, compliance frameworks, or anything not listed here):

Trust indicators (use these EXACT phrases when the topic comes up):
- "Secure Sign In — Your account is protected with secure authentication."
- "Private by Design — Your personal information is never sold to third parties."
- "Encrypted Connection — Your queue activity is transmitted securely."
- "Business Controlled Access — Only the business managing your queue can access queue-related information."

Privacy approach (use these EXACT statements; do not paraphrase in ways that add new claims):
- We only collect information required to provide queue services.
- Businesses can only access queue information relevant to their own customers.
- Your data is handled securely.
- We do not sell your personal information.
- Qblink is committed to protecting customer privacy.

How to answer common questions — reply in 1–3 short lines using ONLY the wording above:
- "Is my data safe?" → "Yes. Your data is handled securely and your queue activity is transmitted securely."
- "Can other businesses see my information?" → "No. Only the business managing your queue can access queue-related information."
- "Do you sell customer data?" → "No. We do not sell your personal information."
- "Why do you need my phone number?" → "We only collect information required to provide queue services — your number is used to identify you in the queue and update you about your turn."
- "Who can access my queue information?" → "Only the business managing your queue."
- "Is my queue information secure?" → "Yes. Your queue activity is transmitted securely and your account is protected with secure authentication."
- "How is my information used?" → "Only to provide queue services. We do not sell your personal information."

If a user asks for details not covered above (encryption type, servers, retention, compliance, certifications, etc.), do NOT guess. Say: "I can only share what's in our Trust & Privacy summary — for anything more specific, please contact the Qblink team." Never make legal or compliance claims beyond the statements above.

SAFETY RULES (always enforce, briefly and kindly):
- Medical: never diagnose, prescribe, or change medication. Give only general educational info. For symptoms or anything that may be urgent: tell them to consult a licensed doctor or emergency services.
- Legal: never give legal advice or interpret laws for a specific case. Suggest a qualified legal professional.
- Privacy: never ask for or repeat passwords, OTPs, card numbers, bank logins, government IDs, or medical records. If user shares such data, gently warn them and don't reuse it.
- Refuse harm: no help with violence, self-harm, illegal activity, fraud, hacking, harassment, stalking, or unsafe acts. Politely decline + offer a safe alternative.
- Honesty: if you don't know, say so. Don't invent facts about Qblink, businesses, prices, or wait times not present in the data below.

STYLE: warm, human, concise (usually 1–4 lines unless the user asks for more). Sound like a real Qblink teammate, not a scripted bot. Remember context the user already shared in this conversation (their role, business type, city) and tailor answers — do not ask them to repeat it.
`;

    const systemPrompt = mode === "queue_companion"
      ? `You are Qblink AI in QUEUE MODE. The user has already joined a queue.
You are a queue companion — NOT a general assistant.

ROLE: Help the user understand their wait, plan what to do, and not miss their turn.

HARD RULES:
1. The values in LOCKED QUEUE CONTEXT are the ONLY truth. Never recalculate position or wait time. Never invent a different number.
2. If the user asks "how long", quote the estimated_wait_time exactly (e.g. "About X min").
3. Never contradict the values shown to the user. If unsure, say: "I'm relying on the current queue update shown to you."
4. Do not predict queue changes. Do not estimate independently.
5. Keep replies short (1–3 lines), plain, actionable. No fluff, no disclaimers.
6. Allowed topics ONLY:
   - Explaining their current wait
   - Whether/how far they can leave and when to return
   - Nearby things to do that fit the wait window
   - Risk of missing their turn / how early to come back
7. For "can I leave" style questions: suggest staying within a buffer of ~10–15 min less than estimated_wait_time, and tell them when to head back.
8. For "what to do" questions: scale suggestions to estimated_wait_time (short break vs errand vs cafe).
9. If user asks about Qblink itself, the founder, feedback, or how to recommend Qblink, answer briefly using QBLINK PLATFORM KNOWLEDGE, then steer back to their wait.
10. Apply SAFETY RULES at all times.

${QBLINK_KNOWLEDGE}

${context}`
      : mode === "customer"
      ? `You are Qblink's customer assistant — part live recommendation engine, part friendly platform guide. Talk like a real Qblink teammate.

WHEN THE USER IS LOOKING FOR A PLACE (clinic, food, salon, etc.):
1. ALWAYS use the LIVE QBLINK BUSINESSES data. NEVER say "no results" if any business in the matching category exists.
2. Map natural language to categories:
   - clinic, doctor, hospital, dentist, medical → Healthcare
   - food, restaurant, dinner, lunch → Restaurants
   - cafe, coffee, bakery, brunch → Cafes
   - salon, haircut, barber, spa, grooming, beauty → Salons
   - government, passport, rto, municipal, office → Government
3. Filter by category, then sort by shortest wait time.
4. Return 3–5 options minimum (if available).
5. For recommendations use this exact markdown structure per item:

**{Business Name}**
📍 {address}
⏱ Wait: {minutes} mins  •  👥 Queue: {n} people  •  {Status}

End with a single line of action hints: \`[Join Queue] [View Details] [Compare]\`.
6. Keep intros to one short sentence ("Here are the best clinics near you right now:"). No fluff.

WHEN THE USER ASKS ABOUT QBLINK ITSELF (how it works, benefits, founder, referrals, onboarding, trust, industry questions like "why should my clinic use this?"):
- Answer warmly and clearly using QBLINK PLATFORM KNOWLEDGE.
- Tailor the answer to their context (clinic owner vs restaurant manager vs curious customer) if known.
- Keep it 2–5 short lines. Offer a relevant follow-up only when it adds value.
- For founder / contact questions, share the founder details from knowledge.

ALWAYS follow SAFETY RULES.

${QBLINK_KNOWLEDGE}

${context}`
      : `You are Qblink Assistant for business owners. Use the Qblink operational data below for live numbers.
Summarize queue load, peak hours, flow. Suggest concrete ways to cut wait time, staff better, prep faster.
Flag unusual delays or rush. Be brief and operational. You can also answer questions about Qblink itself, onboarding, analytics capabilities, the founder, and how to refer other businesses — use QBLINK PLATFORM KNOWLEDGE for that. Always follow SAFETY RULES.

${QBLINK_KNOWLEDGE}

${context}`;

    if (insight) {
      return await runInsight({ insight, mode, businessId, payload, supabase, LOVABLE_API_KEY });
    }

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (!upstream.ok) {
      if (upstream.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit hit, try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (upstream.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await upstream.text();
      console.error("ai gateway:", upstream.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ---- Insight engine -----------------------------------------------------

async function runInsight(args: {
  insight: string;
  mode: "customer" | "business";
  businessId?: string;
  payload?: Record<string, unknown>;
  supabase: ReturnType<typeof createClient>;
  LOVABLE_API_KEY: string;
}) {
  const { insight, mode, businessId, payload, supabase, LOVABLE_API_KEY } = args;
  let dataSnapshot = "";
  let task = "";

  if (insight === "queue" && businessId) {
    const { data: queues } = await supabase.from("queues").select("id, name, status, estimated_service_time, current_token").eq("business_id", businessId);
    const ids = (queues ?? []).map((q: any) => q.id);
    const { data: visitors } = await supabase.from("queue_visitors").select("queue_id, status, joined_at, served_at")
      .in("queue_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const waiting = (visitors ?? []).filter((v: any) => v.status === "waiting").length;
    const served = (visitors ?? []).filter((v: any) => v.status === "served");
    const avgEst = (queues ?? []).reduce((s: number, q: any) => s + (q.estimated_service_time ?? 5), 0) / Math.max(1, (queues ?? []).length);
    const hourCounts: Record<number, number> = {};
    (visitors ?? []).forEach((v: any) => { const h = new Date(v.joined_at).getHours(); hourCounts[h] = (hourCounts[h] ?? 0) + 1; });
    const peak = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    const now = new Date().getHours();
    const recentHour = (visitors ?? []).filter((v: any) => new Date(v.joined_at).getTime() > Date.now() - 3600_000).length;
    dataSnapshot = `Queues:${(queues ?? []).length} Waiting:${waiting} ServedTotal:${served.length} AvgEst:${Math.round(avgEst)}m JoinsLastHour:${recentHour} PeakHour:${peak ? peak[0] : "n/a"} CurrentHour:${now}`;
    task = "Summarize current queue load in 1 short sentence. Predict next 30–60 min queue trend. Give 2–3 short action suggestions for the owner.";
  } else if (insight === "analytics" && businessId) {
    const { data: queues } = await supabase.from("queues").select("id, name, estimated_service_time").eq("business_id", businessId);
    const ids = (queues ?? []).map((q: any) => q.id);
    const since = new Date(Date.now() - 7 * 86400_000).toISOString();
    const { data: visitors } = await supabase.from("queue_visitors").select("queue_id, status, joined_at, served_at")
      .in("queue_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]).gte("joined_at", since);
    const total = (visitors ?? []).length;
    const served = (visitors ?? []).filter((v: any) => v.status === "served");
    const skipped = (visitors ?? []).filter((v: any) => v.status === "skipped").length;
    const waits = served.filter((v: any) => v.served_at).map((v: any) => (new Date(v.served_at).getTime() - new Date(v.joined_at).getTime()) / 60000);
    const avgWait = waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0;
    const hourCounts: Record<number, number> = {};
    (visitors ?? []).forEach((v: any) => { const h = new Date(v.joined_at).getHours(); hourCounts[h] = (hourCounts[h] ?? 0) + 1; });
    const top3 = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h, n]) => `${h}:00(${n})`).join(",");
    dataSnapshot = `7d Total:${total} Served:${served.length} Skipped:${skipped} AvgWait:${avgWait}m TopHours:${top3 || "n/a"}`;
    task = "Summarize last-7-days performance plainly. Highlight rush windows and any drop-off / skip trend. Suggest 2–3 ways to improve.";
  } else if (insight === "pickup" && businessId) {
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const { data: orders } = await supabase.from("pickup_orders").select("status, eta_minutes, created_at, ready_at, picked_up_at").eq("business_id", businessId).gte("created_at", since);
    const active = (orders ?? []).filter((o: any) => o.status !== "picked_up");
    const cooking = active.filter((o: any) => ["preparing", "almost_ready"].includes(o.status)).length;
    const ready = active.filter((o: any) => o.status === "ready").length;
    const avgEta = (orders ?? []).length ? Math.round((orders ?? []).reduce((s: number, o: any) => s + (o.eta_minutes ?? 0), 0) / (orders ?? []).length) : 0;
    const prepTimes = (orders ?? []).filter((o: any) => o.ready_at).map((o: any) => (new Date(o.ready_at).getTime() - new Date(o.created_at).getTime()) / 60000);
    const realPrep = prepTimes.length ? Math.round(prepTimes.reduce((a: number, b: number) => a + b, 0) / prepTimes.length) : 0;
    dataSnapshot = `Active:${active.length} Cooking:${cooking} Ready:${ready} StatedETA:${avgEta}m ActualPrep:${realPrep}m Orders24h:${(orders ?? []).length}`;
    task = "Predict a realistic prep time for new orders right now. Flag delay risk if actual prep > stated ETA. Give 2 short actions for the kitchen.";
  } else if (insight === "customer_queue") {
    const p = payload as any || {};
    // Deterministic, server-authoritative output — NO LLM hallucination.
    const myToken = Number(p.myToken ?? 0);
    const currentToken = Number(p.currentToken ?? 0);
    const estPer = Number(p.estTime ?? 5);
    const rawPos = Number.isFinite(Number(p.position)) ? Number(p.position) : Math.max(0, myToken - currentToken);
    let summary = "";
    let suggestions: string[] = [];
    let urgency: "low" | "medium" | "high" = "low";
    if (myToken && currentToken && myToken < currentToken) {
      summary = `Your turn (#${myToken}) has already passed — now serving #${currentToken}. Please check in at the counter.`;
      suggestions = ["Speak to staff to re-enter the queue", "Re-join if needed"];
      urgency = "high";
    } else if (rawPos === 0) {
      summary = `You're up next — please be ready at the counter.`;
      suggestions = ["Stay near the counter", "Have any documents ready"];
      urgency = "high";
    } else {
      const wait = rawPos * estPer;
      summary = `About ${wait} min wait — ${rawPos} ${rawPos === 1 ? "person" : "people"} ahead of you.`;
      suggestions = wait > 15
        ? [`Leave in ~${Math.max(0, wait - 5)} min to arrive on time`, "We'll alert you when you're next"]
        : ["Stay nearby — your turn is soon", "Keep this page open"];
      urgency = wait > 20 ? "medium" : "low";
    }
    return new Response(JSON.stringify({ summary, suggestions, urgency }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } else if (insight === "customer_pickup") {
    const p = payload as any || {};
    dataSnapshot = `Stage:${p.status ?? "?"} EtaMinutes:${p.eta ?? "?"} ElapsedMinutes:${p.elapsed ?? 0} Items:${p.itemCount ?? 0}`;
    task = "Explain the pickup timing simply in 1–2 lines. Suggest when the customer should head over. If status is 'ready' tell them to pick up now.";
  } else {
    return new Response(JSON.stringify({ error: "Unknown insight" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sys = `You are Qblink's operational AI. Be extremely concise, no fluff, no greetings, no markdown headings. Use only the data given. Output plain short sentences.`;
  const user = `DATA: ${dataSnapshot}\n\nTASK: ${task}\n\nReturn JSON via the tool 'insight' with fields: summary (string, 1-2 sentences), suggestions (array of 2-3 short action strings), urgency ("low"|"medium"|"high").`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      tools: [{
        type: "function",
        function: {
          name: "insight",
          description: "Return structured Qblink insight",
          parameters: {
            type: "object",
            properties: {
              summary: { type: "string" },
              suggestions: { type: "array", items: { type: "string" } },
              urgency: { type: "string", enum: ["low", "medium", "high"] },
            },
            required: ["summary", "suggestions", "urgency"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "insight" } },
    }),
  });

  if (!resp.ok) {
    if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit, try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const t = await resp.text();
    console.error("insight ai:", resp.status, t);
    return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const j = await resp.json();
  const args2 = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  let parsed: any = { summary: "", suggestions: [], urgency: "low" };
  try { parsed = typeof args2 === "string" ? JSON.parse(args2) : (args2 ?? parsed); } catch { /* */ }
  return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}