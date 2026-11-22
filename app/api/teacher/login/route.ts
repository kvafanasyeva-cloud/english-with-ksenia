import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  const expectedCode = process.env.TEACHER_ACCESS_CODE;
  const secret = process.env.TEACHER_SESSION_SECRET;
  if (!expectedCode || !secret || secret.length < 32) {
    return NextResponse.json({ error: "Teacher login has not been configured yet." }, { status: 503 });
  }

  let body: { username?: string; code?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (body.username?.trim().toLowerCase() !== "k" || typeof body.code !== "string" || !safeEqual(body.code, expectedCode)) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return NextResponse.json({ error: "The username or access code is incorrect." }, { status: 401 });
  }

  const expires = Date.now() + 8 * 60 * 60 * 1000;
  const payload = String(expires);
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  const response = NextResponse.json({ success: true });
  response.cookies.set("ewk_teacher", payload + "." + signature, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict",
    path: "/", expires: new Date(expires),
  });
  return response;
}
