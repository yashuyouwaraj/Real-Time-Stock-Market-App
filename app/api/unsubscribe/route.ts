import { NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeTokenDetailed } from "@/lib/unsubscribe";
import { unsubscribeEmail } from "@/lib/subscription";

function getRedirectUrl(request: NextRequest, status: string) {
  const redirectUrl = new URL("/unsubscribe", request.url);
  redirectUrl.searchParams.set("status", status);
  return redirectUrl;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const { email, valid, reason } = verifyUnsubscribeTokenDetailed(token);

  if (!valid || !email) {
    return NextResponse.redirect(getRedirectUrl(request, reason || "invalid"));
  }

  try {
    const result = await unsubscribeEmail(email);
    if (!result.success) {
      return NextResponse.redirect(getRedirectUrl(request, "not-found"));
    }

    return NextResponse.redirect(getRedirectUrl(request, "success"));
  } catch (error) {
    console.error("unsubscribe api error:", error);
    return NextResponse.redirect(getRedirectUrl(request, "error"));
  }
}

