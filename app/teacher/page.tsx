"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Student = { id: string; name: string; created_at: string };
type Homework = { id: string; student_id: string; title: string; description: string | null; published: boolean; created_at: string; due_at: string | null };
type Submission = { id: string; student_id: string; homework_id: string; score: number | null; submitted_at: string };

export default function TeacherArea() {
  const [code, setCode] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState("all");

  async function loadData() {
    const response = await fetch("/api/teacher/data", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load your students.");
    setStudents(data.students || []);
    setHomework(data.homework || []);
    setSubmissions(data.submissions || []);
    setLoggedIn(true);
  }

  useEffect(() => {
    loadData().catch(() => undefined);
  }, []);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/teacher/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "K", code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed.");
      setCode("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }

  async function logout() {
    await fetch("/api/teacher/logout", { method: "POST" });
    setLoggedIn(false); setStudents([]); setHomework([]); setSubmissions([]);
  }

  const visibleHomework = useMemo(() => selected === "all" ? homework : homework.filter(item => item.student_id === selected), [selected, homework]);

  if (!loggedIn) return <main className="page-shell">
    <header className="topbar"><Link className="wordmark" href="/"><span className="wordmark-mark">e.</span><span>ENGLISH WITH KSENIA</span></Link><span className="topbar-note">TEACHER ACCESS</span></header>
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow">PRIVATE TEACHER SPACE</p><h1>Your students.<br/><em>One overview.</em></h1><p className="intro">Manage your students&apos; homework and review their submitted work in one place.</p></div>
      <div className="login-card"><p className="eyebrow">TEACHER LOGIN</p><h2>Welcome back.</h2><p className="card-copy">Sign in with your private teacher access code.</p><form onSubmit={login}><label htmlFor="teacher-name">Username</label><input id="teacher-name" value="K" readOnly aria-label="Username K"/><label htmlFor="teacher-code">Private access code</label><input id="teacher-code" type="password" autoComplete="current-password" value={code} onChange={e=>setCode(e.target.value)} required/><button className="primary-button" disabled={loading}>{loading?"Checking…":"Enter teacher area"} <span>↗</span></button>{error&&<p className="error-message" role="alert">{error}</p>}</form><p className="privacy-note">This area is private. Do not share your teacher code.</p></div>
    </section><footer className="footer"><span>ENGLISH WITH KSENIA</span><Link href="/">STUDENT LOGIN</Link></footer>
  </main>;

  return <main className="page-shell">
    <header className="topbar"><Link className="wordmark" href="/"><span className="wordmark-mark">e.</span><span>ENGLISH WITH KSENIA</span></Link><button className="secondary-button signout" onClick={logout}>Sign out</button></header>
    <section className="dashboard">
      <div className="dashboard-heading"><div><p className="eyebrow">PRIVATE TEACHER SPACE</p><h1>Your <em>students.</em></h1><p className="intro">Every student, their homework and submitted results.</p></div></div>
      <div className="teacher-stats"><div><strong>{students.length}</strong><span>STUDENTS</span></div><div><strong>{homework.length}</strong><span>ASSIGNMENTS</span></div><div><strong>{submissions.length}</strong><span>SUBMISSIONS</span></div></div>
      <nav className="homework-list"><p className="eyebrow">STUDENTS</p><button className={selected==="all"?"homework-list-item is-active":"homework-list-item"} onClick={()=>setSelected("all")}><span><strong>All students</strong></span><span className="homework-list-arrow">{students.length}</span></button>{students.map(student=><button key={student.id} className={selected===student.id?"homework-list-item is-active":"homework-list-item"} onClick={()=>setSelected(student.id)}><span><strong>{student.name}</strong><small>Joined {new Date(student.created_at).toLocaleDateString()}</small></span><span className="homework-list-arrow">↗</span></button>)}</nav>
      <div className="homework-list"><p className="eyebrow">HOMEWORK {selected!=="all"?"· "+(students.find(s=>s.id===selected)?.name||""):"· ALL STUDENTS"}</p>{visibleHomework.map(item=><article className="homework-list-item" key={item.id}><span><small>{students.find(s=>s.id===item.student_id)?.name||"Student"} · {item.description||new Date(item.created_at).toLocaleDateString()}</small><strong>{item.title}</strong></span><span className="tag">{item.published?"Published":"Draft"} · {submissions.filter(s=>s.homework_id===item.id).length} submissions</span></article>)}{visibleHomework.length===0&&<p className="card-copy">No homework for this selection yet.</p>}</div>
      {error&&<p className="error-message">{error}</p>}
    </section><footer className="footer"><span>ENGLISH WITH KSENIA</span><span>YOUR TEACHING SPACE</span></footer>
  </main>;
}
