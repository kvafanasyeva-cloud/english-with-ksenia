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

function telegramShareUrl(task: Homework, answers: Record<string, string>) {
  const lines = [
    "Homework results",
    task.description || "",
    task.title,
    "",
    ...task.exercises.flatMap((section) => [
      section.title,
      ...section.items.map((item) => {
        const answer = answers[`${task.id}::${item.number}`] || "(empty)";
        return `${item.number}. ${answer}`;
      }),
      ""
    ])
  ].filter((line) => line !== undefined);
  const message = lines.join("\n").replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/·/g, "-");
  return `https://t.me/afanasyeva_x?text=${encodeURIComponent(message)}`;
}


const SNAKE_WORDS = ["face", "bear", "rely", "put", "go", "fall", "take", "get", "pay", "endure"];
const SNAKE_EXAMPLE = ["We need to ", "face", " the fact that the old system doesn't work any more."];
const SNAKE_ITEMS: Array<{ before: string; answers: string[]; after: string }> = [
  { before: "After years of hard work, our project finally ", answers: ["bore"], after: " fruit." },
  { before: "You can always ", answers: ["rely"], after: " on me if you need help." },
  { before: "Don't let one bad result ", answers: ["put"], after: " you off trying again." },
  { before: "Prices ", answers: ["went"], after: " up again last month." },
  { before: "She ", answers: ["fell"], after: " ill the day before the exam." },
  { before: "It ", answers: ["took"], after: " me two hours to get there by bus." },
  { before: "How did you ", answers: ["get"], after: " through such a difficult year?" },
  { before: "Hard work always ", answers: ["pays"], after: " off in the end." },
  { before: "The noise was so loud that nobody could ", answers: ["endure", "bear"], after: " it any longer." }
];

function WordSnakeExercise({ checkTrigger, resetTrigger }: { checkTrigger: number; resetTrigger: number }) {
  const [rings, setRings] = useState<Array<[number, number]>>([]);
  const [start, setStart] = useState<number | null>(null);
  const [values, setValues] = useState<string[]>(() => SNAKE_ITEMS.map(() => ""));
  const [checked, setChecked] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [snakeLoaded, setSnakeLoaded] = useState(false);
  useEffect(() => { try { const raw = localStorage.getItem("kate-word-snake"); if (raw) { const saved = JSON.parse(raw); if (Array.isArray(saved.values)) setValues(saved.values); if (Array.isArray(saved.rings)) setRings(saved.rings); } } catch {} setSnakeLoaded(true); }, []);
  useEffect(() => { if (snakeLoaded) { try { localStorage.setItem("kate-word-snake", JSON.stringify({ values, rings })); } catch {} } }, [values, rings, snakeLoaded]);
  const letters = SNAKE_WORDS.join("").split("");
  const normalise = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
  const isCorrect = (index: number) => SNAKE_ITEMS[index].answers.includes(normalise(values[index]));
  const chooseLetter = (index: number) => {
    if (start === null) { setStart(index); return; }
    const a = Math.min(start, index);
    const b = Math.max(start, index);
    if (a !== b && !rings.some(([x, y]) => !(b < x || a > y))) setRings((current) => [...current, [a, b]]);
    setStart(null);
  };
  const rightCount = SNAKE_ITEMS.filter((_, index) => isCorrect(index)).length;

  useEffect(() => { if (checkTrigger) { setChecked(true); setShowAnswers(false); } }, [checkTrigger]);
  useEffect(() => { if (resetTrigger) { setValues(SNAKE_ITEMS.map(() => "")); setRings([]); setStart(null); setChecked(false); setShowAnswers(false); } }, [resetTrigger]);

  return (
    <section className="word-snake-exercise">
      <div className="word-snake-heading">
        <h3>Find the verbs in the word snake</h3>
        <p>Complete the sentences using verbs from the word snake in the correct form.</p>
      </div>
      <div className="word-snake-letters" aria-label="Word snake">
        {letters.map((letter, index) => {
          const ring = rings.find(([a]) => a === index);
          if (ring) {
            const [a, b] = ring;
            return <button type="button" className="word-snake-ring" key={index} title="Click to remove this circle" onClick={() => { setRings((current) => current.filter(([x, y]) => x !== a || y !== b)); setStart(null); }}>{letters.slice(a, b + 1).map((char, offset) => <span key={offset} style={{ transform: "translateY(" + (Math.sin((a + offset) * 0.55) * 7) + "px)" }}>{char}</span>)}</button>;
          }
          if (rings.some(([a, b]) => index > a && index <= b)) return null;
          return <button type="button" className={"word-snake-letter" + (start === index ? " is-start" : "")} key={index} onClick={() => chooseLetter(index)} style={{ transform: "translateY(" + (Math.sin(index * 0.55) * 7) + "px)" }}>{letter}</button>;
        })}
      </div>
      <p className="word-snake-note">Click the first and the last letter of a word to circle it. Click a circle to remove it.</p>
      <div className="word-snake-example">
        <span>EXAMPLE</span>
        {SNAKE_EXAMPLE[0]}<strong>{SNAKE_EXAMPLE[1]}</strong>{SNAKE_EXAMPLE[2]}
      </div>
      <div className="word-snake-questions">
        {SNAKE_ITEMS.map((item, index) => {
          const correct = isCorrect(index);
          const hasAnswer = values[index].trim() !== "";
          const mark = checked && hasAnswer ? (correct ? "ok" : "no") : showAnswers && !correct ? "arrow" : "";
          return (
            <div className="word-snake-question" key={index}>
              <span className="word-snake-number">{index + 1}.</span>
              <p>{item.before}<input aria-label={"Answer " + (index + 1)} className={"word-snake-gap" + (checked && correct ? " is-correct" : "") + (checked && hasAnswer && !correct ? " is-wrong" : "")} value={values[index]} autoComplete="off" spellCheck={false} autoCorrect="off" onChange={(event) => { setValues((current) => current.map((value, i) => i === index ? event.target.value : value)); setChecked(false); setShowAnswers(false); }} />{item.after}</p>
              <span className={"word-snake-mark " + mark} aria-label={mark === "ok" ? "Correct" : mark === "no" ? "Incorrect" : mark === "arrow" ? "Answer shown" : ""}>{mark === "ok" ? "✓" : mark === "no" ? "×" : mark === "arrow" ? "→" : ""}</span>
            </div>
          );
        })}
      </div>
      {checked && <div className="word-snake-controls">
        <button type="button" className="is-ghost" onClick={() => { setValues((current) => current.map((value, index) => SNAKE_ITEMS[index].answers[0])); setShowAnswers(true); }}>Show answers</button>
        <strong className="word-snake-score">{rightCount} / {SNAKE_ITEMS.length}</strong>
      </div>}
    </section>
  );
}


const CROSSWORD_WORDS = [
  { id: "endure", word: "ENDURE", clue: "to suffer something difficult or unpleasant without giving up", row: 0, col: 4, direction: "down" as const },
  { id: "face", word: "FACE", clue: "to accept and deal with a difficult situation", row: 1, col: 1, direction: "down" as const },
  { id: "rely", word: "RELY", clue: "to trust or depend on someone", row: 4, col: 4, direction: "across" as const },
  { id: "bear", word: "BEAR", clue: "to tolerate or accept something unpleasant", row: 4, col: 0, direction: "across" as const }
];

function SampleCrossword({ checkTrigger, resetTrigger }: { checkTrigger: number; resetTrigger: number }) {
  const [letters, setLetters] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [crosswordLoaded, setCrosswordLoaded] = useState(false);
  useEffect(() => { try { const raw = localStorage.getItem("kate-sample-crossword"); if (raw) setLetters(JSON.parse(raw)); } catch {} setCrosswordLoaded(true); }, []);
  useEffect(() => { if (crosswordLoaded) { try { localStorage.setItem("kate-sample-crossword", JSON.stringify(letters)); } catch {} } }, [letters, crosswordLoaded]);
  const cells: Record<string, { letter: string; words: string[]; number?: number }> = {};
  CROSSWORD_WORDS.forEach((entry) => entry.word.split("").forEach((letter, index) => {
    const row = entry.row + (entry.direction === "down" ? index : 0);
    const col = entry.col + (entry.direction === "across" ? index : 0);
    const key = row + "-" + col;
    if (!cells[key]) cells[key] = { letter, words: [], number: index === 0 ? CROSSWORD_WORDS.indexOf(entry) + 1 : undefined };
    cells[key].words.push(entry.id);
  }));
  const rows = Array.from({ length: 6 }, (_, row) => Array.from({ length: 8 }, (_, col) => ({ row, col, cell: cells[row + "-" + col] })));
  const isWordCorrect = (entry: typeof CROSSWORD_WORDS[number]) => entry.word.split("").every((letter, index) => {
    const row = entry.row + (entry.direction === "down" ? index : 0);
    const col = entry.col + (entry.direction === "across" ? index : 0);
    return (letters[row + "-" + col] || "").toUpperCase() === letter;
  });
  useEffect(() => { if (checkTrigger) setChecked(true); }, [checkTrigger]);
  useEffect(() => { if (resetTrigger) { setLetters({}); setChecked(false); } }, [resetTrigger]);
  return <section className="sample-crossword">
    <div className="word-snake-heading"><h3>Crossword · Verb patterns</h3><p>Complete the crossword using the clues. One letter goes in each square.</p></div>
    <div className="crossword-grid" role="group" aria-label="Crossword grid">
      {rows.flatMap((row) => row.map(({ row: r, col, cell }) => cell ? <div className="crossword-cell-wrap" key={r + "-" + col}>{cell.number && <span className="crossword-cell-number">{cell.number}</span>}<input aria-label={"Row " + (r + 1) + ", column " + (col + 1)} maxLength={1} value={letters[r + "-" + col] || ""} className={checked ? (cell.words.every((id) => isWordCorrect(CROSSWORD_WORDS.find((entry) => entry.id === id)!)) ? "crossword-letter is-correct" : "crossword-letter is-wrong") : "crossword-letter"} onChange={(event) => { setLetters((current) => ({ ...current, [r + "-" + col]: event.target.value.slice(-1).toUpperCase() })); setChecked(false); }} /></div> : <span key={r + "-" + col} className="crossword-empty" />))}
    </div>
    <div className="crossword-clues">
      {CROSSWORD_WORDS.map((entry, index) => <div className="crossword-clue" key={entry.id}><strong>{index + 1}. {entry.direction === "across" ? "Across" : "Down"}</strong><span>{entry.clue}</span>{checked && <b>{isWordCorrect(entry) ? "✓" : "×"}</b>}</div>)}
    </div>
    {checked && <div className="word-snake-controls"><strong className="word-snake-score">{CROSSWORD_WORDS.filter(isWordCorrect).length} / {CROSSWORD_WORDS.length}</strong></div>}
  </section>;
}

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
  const [crossedWords, setCrossedWords] = useState<Record<string, boolean>>({});
  const [activityCheckTrigger, setActivityCheckTrigger] = useState(0);
  const [activityResetTrigger, setActivityResetTrigger] = useState(0);
  const [saveNotice, setSaveNotice] = useState("");

  useEffect(() => {
    if (!signedIn || homework.length === 0) return;
    const firstId = homework[0].id;
    setActiveHomeworkId((current) => current && homework.some((task) => task.id === current) ? current : firstId);
  }, [signedIn, homework]);

  useEffect(() => {
    if (!signedIn || homework.length === 0) return;
    const saved: Record<string, string> = {};
    const crossed: Record<string, boolean> = {};
    for (const task of homework) {
      try {
        const raw = localStorage.getItem(`hw-answers|${task.id}`);
        if (raw) {
          const values = JSON.parse(raw) as Record<string, string>;
          for (const [itemKey, value] of Object.entries(values)) saved[`${task.id}::${itemKey}`] = value;
        }
      } catch { /* Ignore unavailable or invalid local drafts. */ }
      try {
        const rawCrossed = localStorage.getItem(`hw-crossed|${task.id}`);
        if (rawCrossed) {
          const values = JSON.parse(rawCrossed) as Record<string, boolean>;
          for (const [wordKey, value] of Object.entries(values)) crossed[`${task.id}::${wordKey}`] = value;
        }
      } catch { /* Ignore unavailable or invalid word-bank drafts. */ }
    }
    setAnswers(saved);
    setCrossedWords(crossed);
  }, [signedIn, homework]);

  useEffect(() => {
    if (!signedIn) return;
    const byTask: Record<string, Record<string, string>> = {};
    for (const [key, value] of Object.entries(answers)) {
      const splitAt = key.indexOf("::");
      if (splitAt < 0) continue;
      const taskId = key.slice(0, splitAt);
      if (!byTask[taskId]) byTask[taskId] = {};
      byTask[taskId][key.slice(splitAt + 2)] = value;
    }
    for (const [taskId, values] of Object.entries(byTask)) {
      try { localStorage.setItem(`hw-answers|${taskId}`, JSON.stringify(values)); } catch { /* Storage may be unavailable. */ }
    }
  }, [answers, signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    const byTask: Record<string, Record<string, boolean>> = {};
    for (const [key, value] of Object.entries(crossedWords)) {
      const splitAt = key.indexOf("::");
      if (splitAt < 0) continue;
      const taskId = key.slice(0, splitAt);
      if (!byTask[taskId]) byTask[taskId] = {};
      byTask[taskId][key.slice(splitAt + 2)] = value;
    }
    for (const [taskId, values] of Object.entries(byTask)) {
      try { localStorage.setItem(`hw-crossed|${taskId}`, JSON.stringify(values)); } catch { /* Storage may be unavailable. */ }
    }
  }, [crossedWords, signedIn]);

  function setAnswer(taskId: string, number: number, value: string) {
    setAnswers((current) => ({ ...current, [`${taskId}::${number}`]: value }));
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
            <p className="privacy-note"><a href="/teacher" style={{color:"inherit"}}>Teacher login ↗</a></p>
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
                      {section.word_bank && <div className="word-bank"><strong>Word bank</strong>{section.word_bank.map((word) => { const wordKey = `${task.id}::${section.id}::${word}`; return <button type="button" className={`word-bank-word ${crossedWords[wordKey] ? "is-crossed" : ""}`} aria-pressed={!!crossedWords[wordKey]} onClick={() => setCrossedWords((current) => ({ ...current, [wordKey]: !current[wordKey] }))} key={word}>{word}</button>; })}</div>}
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
                  {task.id === "18bbb034-4f7e-4a77-aa35-851d101b3d93" && <><WordSnakeExercise checkTrigger={activityCheckTrigger} resetTrigger={activityResetTrigger} /><SampleCrossword checkTrigger={activityCheckTrigger} resetTrigger={activityResetTrigger} /></>}
                  <div className="whole-homework-controls">
                    <button type="button" onClick={() => setActivityCheckTrigger((value) => value + 1)}>Check</button>
                    <button type="button" onClick={() => { try { const saved: Record<string, string> = {}; Object.entries(answers).forEach(([key, value]) => { const prefix = task.id + "::"; if (key.startsWith(prefix)) saved[key.slice(prefix.length)] = value; }); localStorage.setItem("hw-answers|" + task.id, JSON.stringify(saved)); setSaveNotice("Saved on this device"); } catch { setSaveNotice("Could not save on this device"); } }}>Save</button>
                    <button type="button" className="is-ghost" onClick={() => { setAnswers((current) => { const next = { ...current }; Object.keys(next).forEach((key) => { if (key.startsWith(task.id + "::")) delete next[key]; }); return next; }); try { localStorage.removeItem("hw-answers|" + task.id); } catch {} setActivityResetTrigger((value) => value + 1); setSaveNotice(""); }}>Reset</button>
                    {saveNotice && <span className="save-notice" role="status">{saveNotice}</span>}
                    <a className="telegram-button" href={telegramShareUrl(task, answers)} target="_blank" rel="noreferrer">Send to Ksenia in Telegram <span>↗</span></a>
                  </div>
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
