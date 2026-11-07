import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import webpush from "web-push";
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const publicVapidKey = "BL-bPaonX1QEsy6uGVyw3gjHQ5ioUaNw7Cs2LasvZU3DQA0hwYT7EG9Z700275T2qxx7zlHDkcTasNcqOGzxhso";
const privateVapidKey = Deno.env.get("VAPID_PRIVATE_KEY");
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const allowedOrigins = new Set([
  "https://www.varanasiconnect.in",
  "https://varanasiconnect.in",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

function response(body: unknown, status = 200, origin: string | null = null) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (origin && allowedOrigins.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function getBearer(req: Request) {
  return req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") {
    const headers = new Headers({
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
    });
    if (origin && allowedOrigins.has(origin)) headers.set("Access-Control-Allow-Origin", origin);
    return new Response("ok", { headers });
  }
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405, origin);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return response({ error: "Invalid request" }, 400, origin); }

  if (body.action === "dispatch") {
    const { data: config } = await supabase.from("vc_push_config")
      .select("config_value").eq("config_key", "cron_secret").maybeSingle();
    if (!config?.config_value || getBearer(req) !== config.config_value) {
      return response({ error: "Unauthorized" }, 401, origin);
    }
    if (!privateVapidKey) return response({ error: "Push sender is not configured" }, 503, origin);
    webpush.setVapidDetails("mailto:community.varanasi@gmail.com", publicVapidKey, privateVapidKey);
    return await dispatchNotifications(origin);
  }

  const token = getBearer(req);
  if (!token) return response({ error: "Sign in required" }, 401, origin);
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  const user = authData?.user;
  if (authError || !user) return response({ error: "Sign in required" }, 401, origin);

  if (body.action === "subscribe") {
    const subscription = body.subscription as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };
    if (!subscription?.endpoint?.startsWith("https://") || !subscription.keys?.p256dh || !subscription.keys.auth) {
      return response({ error: "Invalid browser subscription" }, 400, origin);
    }
    const { error } = await supabase.from("vc_push_subscriptions").upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    }, { onConflict: "endpoint" });
    if (error) return response({ error: "Could not save notification settings" }, 500, origin);
    return response({ ok: true }, 200, origin);
  }

  if (body.action === "unsubscribe") {
    const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
    const { error } = await supabase.from("vc_push_subscriptions")
      .delete().eq("user_id", user.id).eq("endpoint", endpoint);
    if (error) return response({ error: "Could not turn off notifications" }, 500, origin);
    return response({ ok: true }, 200, origin);
  }

  return response({ error: "Unknown action" }, 400, origin);
});

async function dispatchNotifications(origin: string | null) {
  const now = new Date();
  const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const recentCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [{ data: subscriptions, error: subscriptionsError }, { data: events, error: eventsError }] = await Promise.all([
    supabase.from("vc_push_subscriptions").select("id,user_id,endpoint,p256dh,auth,created_at"),
    supabase.from("events").select("id,title,summary,slug,starts_at,created_at,is_published")
      .eq("is_published", true).order("created_at", { ascending: false }).limit(1000),
  ]);
  if (subscriptionsError || eventsError) return response({ error: "Could not load event notifications" }, 500, origin);
  let sent = 0;

  for (const subscription of subscriptions || []) {
    for (const event of events || []) {
      const eventCreatedAt = new Date(event.created_at);
      const eventStartsAt = event.starts_at ? new Date(event.starts_at) : null;
      const newEventEligible = eventCreatedAt >= recentCutoff && eventCreatedAt >= new Date(subscription.created_at);
      const reminderEligible = eventStartsAt && eventStartsAt > now && eventStartsAt <= horizon;
      let notificationType: "new_event" | "event_reminder" | null = null;
      if (newEventEligible || reminderEligible) {
        const { data: sentRows } = await supabase.from("vc_push_deliveries")
          .select("notification_type").eq("subscription_id", subscription.id).eq("event_id", event.id);
        const sentTypes = new Set((sentRows || []).map((row) => row.notification_type));
        if (newEventEligible && !sentTypes.has("new_event")) notificationType = "new_event";
        else if (reminderEligible && !sentTypes.has("event_reminder")) notificationType = "event_reminder";
      }
      if (!notificationType) continue;

      const { data: claim, error: claimError } = await supabase.from("vc_push_deliveries")
        .insert({ subscription_id: subscription.id, event_id: event.id, notification_type: notificationType })
        .select("subscription_id").single();
      if (claimError || !claim) continue;

      const title = notificationType === "new_event" ? "New Varanasi Connect event" : "Event reminder";
      const body = notificationType === "new_event"
        ? `${event.title} has been added. Tap to see the details.`
        : `${event.title} is coming up within 24 hours.`;
      const target = `https://www.varanasiconnect.in/events?event=${encodeURIComponent(event.slug || event.id)}#event-details`;
      try {
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        }, JSON.stringify({ title, body, url: target, tag: `vc-${event.id}-${notificationType}` }));
        sent++;
      } catch (error) {
        await supabase.from("vc_push_deliveries").delete()
          .eq("subscription_id", subscription.id).eq("event_id", event.id).eq("notification_type", notificationType);
        const statusCode = (error as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("vc_push_subscriptions").delete().eq("id", subscription.id);
        }
      }
    }
  }
  return response({ ok: true, sent }, 200, origin);
}
