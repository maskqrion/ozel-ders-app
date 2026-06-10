// POST /api/push/subscribe  — tarayıcı push aboneliğini kaydet / güncelle
// DELETE /api/push/subscribe — aboneliği kaldır (çıkış yaparken)

import { NextRequest, NextResponse } from "next/server";
import { createServer } from "@/lib/supabase/server";

interface SubscribeBody {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function POST(req: NextRequest) {
  const supabase = await createServer();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SubscribeBody;
  try {
    body = await req.json() as SubscribeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    return NextResponse.json({ error: "Missing subscription fields" }, { status: 400 });
  }

  const ua = req.headers.get("user-agent")?.slice(0, 200) ?? null;

  const { error } = await supabase
    .from("web_push_subscriptions")
    .upsert(
      {
        user_id:    user.id,
        endpoint:   body.endpoint,
        p256dh:     body.keys.p256dh,
        auth_key:   body.keys.auth,
        user_agent: ua,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );

  if (error) {
    return NextResponse.json({ error: "Abonelik kaydedilemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServer();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { endpoint: string };
  try {
    body = await req.json() as { endpoint: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await supabase
    .from("web_push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", body.endpoint);

  return NextResponse.json({ ok: true });
}
