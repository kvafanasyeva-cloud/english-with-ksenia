"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("The website is not connected to Supabase yet.");
  if (!supabase) supabase = createClient(url, anonKey);
  return supabase;
}

type Homework = {
  id: string;
  title: string;
  description: string | null;
  exercises: Array<{
    id: string;
    type: string;
    title: string;
    instructions?: string;
    items: Array<{ number: number; prompt?: string; cue?: string; words?: string[] }>;
    word_bank?: string[];
    options?: Array<{ id: string; text: string }>;
  }>;
};

export default function Home() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [homeworkLoading, setHomeworkLoading] = useState(false);
  const [activeHomeworkId, setActiveHomeworkId] = useState<string | null>(null);

  useEffect(() => {
    if (!signedIn || homework.length === 0) return;
    const firstId = homework[0].id;
    setActiveHomeworkId((current) => current && homework.some((task) => task.id === current) ? current : firstId);
  }, [signedIn, homework]);

  useEffect(() => {
    if (!signedIn || homework.length === 0) return;
    const saved: Record<string, string> = {};
    for (const task of homework) {
      try {
        const raw = localStorage.getItem(`hw-answers|${task.id}`);
        if (raw) {
          const values = JSON.parse(raw) as Record<string, string>;\n          for (const [itemKey, value] of Object.entries(values)) saved[`${task.id}::${itemKey}`] = value;\n        }
      } catch { /* Ignore unavailable or invalid local drafts. */ }
    }
    setAnswers(saved);
  }, [signedIn, homework]);

  useEffect(() => {
    if (!signedIn) return;
    const byTask: Record<string, Record<string, string>> = {};
    for (const [key, value] of Object.entries(answers)) {
      const splitAt = key.indexOf("::");
      if (splitAt < 0) continue;
      const taskId = key.slice(0, splitAt);
      const itemKey = key.slice(splitAt + 2);
      if (!byTask[taskId]) byTask[taskId] = {};
      byTask[taskId][itemKey] = value;
    }
    for (const [taskId, values] of Object.entries(byTask)) {
      try { localStorage.setItem(`hw-answers|${taskId}`, JSON.stringify(values)); } catch { /* Storage may be unavailable. */ }
    }
  }, [answers, signedIn]);

  function setAnswer(number: number, value: string) {
    setAnswers((current) => ({ ...current, [String(number)]: value }));
  }

  async function loadHomework() {
    setHomeworkLoading(true);
    const { data, error: homeworkError } = await getSupabase()
      .from("homework")
      .select("id, title, description, exercises")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (homeworkError) {
      setError("You're signed in, but we couldn't load your homework. Please try again.");
    } else {
      setHomework((data || []) as Homework[]);
    }
    setHomeworkLoading(false);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!projectUrl || !anonKey) throw new Error("The website is not connected to Supabase yet.");
      const response = await fetch(`${projectUrl}/functions/v1/student-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: anonKey },
        body: JSON.stringify({ name: name.trim(), code }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "We couldn't log you in. Please check your details.");
      const { error: sessionError } = await getSupabase().auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      });
      if (sessionError) throw new Error("Your login was verified, but we couldn't start your session. Please try again.");
      setSignedIn(true);
      setCode("");
      await loadHomework();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await getSupabase().auth.signOut();
    setSignedIn(false);
    setHomework([]);
    setAnswers({});
    setError("");
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="English with Ksenia home">
          <span className="wordmark-mark">e.</span><span>ENGLISH WITH KSENIA</span>
        </Link>
        <span className="topbar-note">YOUR LEARNING SPACE</span>
      </header>

      {!signedIn ? (
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">A LITTLE SPACE FOR BIG PROGRESS</p>
            <h1>English, one<br /><em>step at a time.</em></h1>
            <p className="intro">Your lessons, homework and progress — all in one place. Come in and pick up where you left off.</p>
          </div>
          <div className="login-card">
            <p className="eyebrow">STUDENT ACCESS</p>
            <h2>Good to see you.</h2>
            <p className="card-copy">Enter your name and personal code to open your learning space.</p>
            <form onSubmit={handleLogin}>
              <label htmlFor="student-name">Your name</label>
              <input id="student-name" type="text" autoComplete="name" placeholder="e.g. Kate" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
              <label htmlFor="student-code">Personal code</label>
              <input id="student-code" type="password" autoComplete="current-password" placeholder="Enter your code" value={code} onChange={(e) => setCode(e.target.value)} required maxLength={100} />
              {error && <p className="error-message" role="alert">{error}</p>}
              <button className="primary-button" type="submit" disabled={loading}>{loading ? "Checking…" : "Enter my space"} {!loading && <span>↗</span>}</button>
            </form>
            <p className="privacy-note">Your personal code is private. Keep it to yourself.</p>
          </div>
        </section>
      ) : (
        <section className="dashboard">
          <div className="dashboard-heading">
            <div>
              <p className="eyebrow">YOUR LEARNING SPACE</p>
              <h1>Welcome, <em>{name.trim()}.</em></h1>
              <p className="intro">Your homework, all in one place. Take it one task at a time.</p>
            </div>
            <button className="secondary-button signout" onClick={handleSignOut}>Sign out</button>
          </div>
          {error && <p className="error-message" role="alert">{error}</p>}
          {homeworkLoading ? <p className="card-copy">Loading your homework…</p> : homework.length === 0 ? (
            <div className="homework-card"><h2>No homework yet</h2><p className="card-copy">There are no published assignments in your space right now.</p></div>
          ) : (
            <>
              <nav className="homework-list" aria-label="Your homework">
                <p className="eyebrow">ALL HOMEWORK</p>
                {homework.map((task) => (
                  <button className={`homework-list-item ${activeHomeworkId === task.id ? "is-active" : ""}`} key={task.id} onClick={() => setActiveHomeworkId(task.id)}>
                    <span><small>{task.description || "ASSIGNMENT"}</small><strong>{task.title}</strong></span>
                    <span className="homework-list-arrow" aria-hidden="true">↗</span>
                  </button>
                ))}
              </nav>
              {homework.filter((task) => task.id === activeHomeworkId).map((task) => (
                <article className="homework-card" key={task.id}>
                  <p className="eyebrow">{task.description || "YOUR ASSIGNMENT"}</p>
                  <h2>{task.title}</h2>
                  <p className="card-copy">Work through each section and enter your answers.</p>
                  {task.exercises?.map((section, index) => (
                    <section className="exercise-section" key={section.id}>
                      <div className="section-heading"><span className="section-number">0{index + 1}</span><div><h3>{section.title}</h3>{section.instructions && <p>{section.instructions}</p>}</div></div>
                      {section.word_bank && <div className="word-bank"><strong>Word bank</strong>{section.word_bank.map((word) => <span key={word}>{word}</span>)}</div>}
                      {section.items.map((item) => {
                        const answerKey = `${task.id}::${item.number}`;
                        return (
                          <div className="question" key={item.number}>
                            <label htmlFor={`answer-${task.id}-${item.number}`}>{item.number}. {item.prompt || item.words?.join(" / ") || ""}</label>
                            {section.type === "matching" ? (
                              <select id={`answer-${task.id}-${item.number}`} value={answers[answerKey] || ""} onChange={(e) => setAnswer(task.id, item.number, e.target.value)}>
                                <option value="">Choose a meaning…</option>
                                {section.options?.map((option) => <option value={option.id} key={option.id}>{option.text}</option>)}
                              </select>
                            ) : (
                              <input id={`answer-${task.id}-${item.number}`} type="text" spellCheck={false} autoCorrect="off" placeholder={item.cue ? `Use: ${item.cue}` : "Your answer"} value={answers[answerKey] || ""} onChange={(e) => setAnswer(task.id, item.number, e.target.value)} />
                            )}
                          </div>
                        );
                      })}
                    </section>
                  ))}
                  <p className="privacy-note">Your draft answers are saved on this device and will be here when you return using this browser.</p>
                </article>
              ))}
            </>
          )}
        </section>
      )}

      <footer className="footer"><span>ENGLISH WITH KSENIA</span><span>LEARN WITH CURIOSITY.</span></footer>
    </main>
  );
}
