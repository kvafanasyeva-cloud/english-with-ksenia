"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Student = { id: string; name: string; created_at: string };
type Homework = { id: string; student_id: string; title: string; description: string | null; published: boolean; created_at: string; due_at: string | null };
type Submission = { id: string; student_id: string; homework_id: string; score: number | null; submitted_at: string };


const KATE_NOV_21_HOMEWORK = {
  title: "21.11 · B1 vocabulary",
  description: "21 November · Vocabulary practice",
  exercises: [
    {
      id: "nov21-gap-fill",
      type: "gap",
      title: "Complete the sentences",
      instructions: "Use the words in the box. Change the form if necessary.",
      word_bank: ["cancel", "add up", "consider", "celebrate", "defend", "comprehend", "opinion", "holiday", "door"],
      items: [
        { number: 1, prompt: "We had to ___ the meeting because the teacher was ill." },
        { number: 2, prompt: "These numbers don't ___ . Can you check them again?" },
        { number: 3, prompt: "Have you ever ___ moving to another country?" },
        { number: 4, prompt: "We're going to ___ my sister's birthday this weekend." },
        { number: 5, prompt: "It's important to ___ your point of view with clear reasons." },
        { number: 6, prompt: "I didn't ___ what he was trying to explain." },
        { number: 7, prompt: "In my ___, this is the best solution." },
        { number: 8, prompt: "We usually travel abroad during the summer ___." },
        { number: 9, prompt: "Please close the ___ quietly when you leave." }
      ]
    },
    {
      id: "nov21-matching",
      type: "matching",
      title: "Match the phrases and meanings",
      instructions: "Choose the correct meaning for each phrase.",
      options: [
        { id: "a", text: "to understand something" },
        { id: "b", text: "to agree with someone" },
        { id: "c", text: "to be busy doing your job" },
        { id: "d", text: "to tell someone something" },
        { id: "e", text: "to understand or hear something with difficulty" }
      ],
      items: [
        { number: 1, prompt: "quite get / catch it" },
        { number: 2, prompt: "agree" },
        { number: 3, prompt: "at work" },
        { number: 4, prompt: "say something to you" },
        { number: 5, prompt: "comprehend" }
      ]
    },
    {
      id: "nov21-complete",
      type: "write",
      title: "Complete the sentences",
      instructions: "Use the words and phrases in brackets. Make any necessary changes.",
      items: [
        { number: 1, prompt: "The way you see yourself is called your ___.", cue: "self-perception" },
        { number: 2, prompt: "The plural of 'child' is ___.", cue: "child" },
        { number: 3, prompt: "___ it was raining, we went for a walk.", cue: "even though" },
        { number: 4, prompt: "There were several ___ waiting outside.", cue: "other people" },
        { number: 5, prompt: "Please don't ___ me for something I didn't do.", cue: "defend" }
      ]
    },
    {
      id: "nov21-rewrite",
      type: "rewrite",
      title: "Rewrite the sentences",
      instructions: "Rewrite each sentence using the word or phrase given. Keep the meaning the same.",
      items: [
        { number: 1, prompt: "I don't understand what you mean. (quite get)", cue: "quite get" },
        { number: 2, prompt: "I agree with your opinion. (share)", cue: "share" },
        { number: 3, prompt: "Although she was tired, she finished the task. (even though)", cue: "even though" },
        { number: 4, prompt: "I will tell you my decision tomorrow. (say)", cue: "say" }
      ]
    }
  ]
};

export default function TeacherArea() {
  const [code, setCode] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState("all");
  const [creatingHomework, setCreatingHomework] = useState(false);
  const [createNotice, setCreateNotice] = useState("");

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

  async function createKateHomework() {
    const kate = students.find((student) => student.name.trim().toLowerCase() === "kate");
    if (!kate) { setCreateNotice("Kate was not found in your student list."); return; }
    if (homework.some((item) => item.student_id === kate.id && item.title === KATE_NOV_21_HOMEWORK.title)) {
      setCreateNotice("This homework already exists for Kate."); return;
    }
    setCreatingHomework(true);
    setCreateNotice("");
    try {
      const response = await fetch("/api/teacher/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: kate.id, ...KATE_NOV_21_HOMEWORK, published: true })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create homework.");
      setCreateNotice("Kate’s 21.11 homework has been created and published.");
      await loadData();
      setSelected(kate.id);
    } catch (err) {
      setCreateNotice(err instanceof Error ? err.message : "Could not create homework.");
    } finally { setCreatingHomework(false); }
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
      <div className="homework-list"><p className="eyebrow">QUICK CREATE</p><p className="card-copy">Create and publish the prepared B1 vocabulary homework for Kate.</p><button className="primary-button" type="button" onClick={createKateHomework} disabled={creatingHomework || !students.some((student) => student.name.trim().toLowerCase() === "kate")}>{creatingHomework ? "Creating…" : "Create Kate’s 21.11 homework"} <span>↗</span></button>{createNotice && <p className="card-copy" role="status">{createNotice}</p>}</div>
      <nav className="homework-list"><p className="eyebrow">STUDENTS</p><button className={selected==="all"?"homework-list-item is-active":"homework-list-item"} onClick={()=>setSelected("all")}><span><strong>All students</strong></span><span className="homework-list-arrow">{students.length}</span></button>{students.map(student=><button key={student.id} className={selected===student.id?"homework-list-item is-active":"homework-list-item"} onClick={()=>setSelected(student.id)}><span><strong>{student.name}</strong><small>Joined {new Date(student.created_at).toLocaleDateString()}</small></span><span className="homework-list-arrow">↗</span></button>)}</nav>
      <div className="homework-list"><p className="eyebrow">HOMEWORK {selected!=="all"?"· "+(students.find(s=>s.id===selected)?.name||""):"· ALL STUDENTS"}</p>{visibleHomework.map(item=><article className="homework-list-item" key={item.id}><span><small>{students.find(s=>s.id===item.student_id)?.name||"Student"} · {item.description||new Date(item.created_at).toLocaleDateString()}</small><strong>{item.title}</strong></span><span className="tag">{item.published?"Published":"Draft"} · {submissions.filter(s=>s.homework_id===item.id).length} submissions</span></article>)}{visibleHomework.length===0&&<p className="card-copy">No homework for this selection yet.</p>}</div>
      {error&&<p className="error-message">{error}</p>}
    </section><footer className="footer"><span>ENGLISH WITH KSENIA</span><span>YOUR TEACHING SPACE</span></footer>
  </main>;
}
