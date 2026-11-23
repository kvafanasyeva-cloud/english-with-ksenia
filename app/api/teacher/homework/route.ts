import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function validTeacherSession(request: NextRequest) {
  const secret = process.env.TEACHER_SESSION_SECRET;
  const token = request.cookies.get("ewk_teacher")?.value;
  if (!secret || secret.length < 32 || !token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !/^\\d+$/.test(payload) || Number(payload) < Date.now()) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!validTeacherSession(request)) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.json({ error: "The homework database connection is not configured. Please check the Supabase URL and anon key." }, { status: 503 });

  let body: { student_id?: string; title?: string; description?: string; exercises?: unknown; published?: boolean };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!body.student_id || !body.title?.trim() || !Array.isArray(body.exercises) || body.exercises.length === 0) {
    return NextResponse.json({ error: "Student, title and exercises are required." }, { status: 400 });
  }

  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  const response = await fetch(`${url}/rest/v1/homework`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      student_id: body.student_id,
      title: body.title.trim(),
      description: body.description || null,
      exercises: body.exercises,
      published: body.published ?? true,
    }),
    cache: "no-store",
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json({ error: result?.message || result?.details || "Could not create the homework. Please check the database schema." }, { status: 502 });
  }
  return NextResponse.json({ success: true, homework: Array.isArray(result) ? result[0] : result });
}
