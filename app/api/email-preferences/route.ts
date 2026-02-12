import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/better-auth/auth";
import { verifyUnsubscribeTokenDetailed } from "@/lib/unsubscribe";
import { getEmailSubscriptionStatus, setEmailSubscription } from "@/lib/subscription";

async function resolveEmailFromRequest(token?: string) {
  if (token) {
    const parsed = verifyUnsubscribeTokenDetailed(token);
    if (!parsed.valid || !parsed.email) {
      return { email: null as string | null, error: parsed.reason || "invalid" };
    }
    return { email: parsed.email, error: null as string | null };
  }

  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user?.email?.trim().toLowerCase() || null;

  if (!email) {
    return { email: null as string | null, error: "unauthorized" };
  }

  return { email, error: null as string | null };
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const { email, error } = await resolveEmailFromRequest(token || undefined);
  if (error || !email) {
    return NextResponse.json({ success: false, error: error || "invalid" }, { status: 400 });
  }

  const isSubscribed = await getEmailSubscriptionStatus(email);
  if (isSubscribed === null) {
    return NextResponse.json({ success: false, error: "not-found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, email, isSubscribed });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    token?: string;
    action?: "subscribe" | "unsubscribe";
  };
  const token = typeof body.token === "string" ? body.token : "";
  const action = body.action === "subscribe" || body.action === "unsubscribe" ? body.action : null;

  if (!action) {
    return NextResponse.json({ success: false, error: "invalid-action" }, { status: 400 });
  }

  const { email, error } = await resolveEmailFromRequest(token || undefined);
  if (error || !email) {
    return NextResponse.json({ success: false, error: error || "invalid" }, { status: 400 });
  }

  const nextSubscribed = action === "subscribe";
  const result = await setEmailSubscription(email, nextSubscribed);
  if (!result.success) {
    return NextResponse.json({ success: false, error: "not-found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, email, isSubscribed: nextSubscribed });
}
