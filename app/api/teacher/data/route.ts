import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function validTeacherSession(request: NextRequest) {
  const secret = process.env.TEACHER_SESSION_SECRET;
  const token = request.cookies.get("ewk_teacher")?.value;
  if (!secret || secret.length < 32 || !token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !/^\d+$/.test(payload) || Number(payload) < Date.now()) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  if (!validTeacherSession(request)) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: "The teacher data connection is not configured." }, { status: 503 });

  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const [studentsRes, homeworkRes, submissionsRes] = await Promise.all([
    fetch(`${url}/rest/v1/students?select=id,name,created_at&order=name.asc`, { headers, cache: "no-store" }),
    fetch(`${url}/rest/v1/homework?select=id,student_id,title,description,published,created_at,due_at&order=created_at.desc`, { headers, cache: "no-store" }),
    fetch(`${url}/rest/v1/submissions?select=id,student_id,homework_id,score,submitted_at&order=submitted_at.desc`, { headers, cache: "no-store" }),
  ]);
  if (!studentsRes.ok || !homeworkRes.ok || !submissionsRes.ok) {
    return NextResponse.json({ error: "Could not load the teacher overview. Please check the database permissions." }, { status: 502 });
  }
  const [students, homework, submissions] = await Promise.all([studentsRes.json(), homeworkRes.json(), submissionsRes.json()]);
  return NextResponse.json({ students, homework, submissions });
}
