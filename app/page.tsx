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

type HomeworkItem = {
  number: number;
  prompt?: string;
  cue?: string;
  words?: string[];
  before?: string;
  after?: string;
};

type HomeworkExercise = {
  id: string;
  type: string;
  title: string;
  instructions?: string;
  items: HomeworkItem[];
  word_bank?: string[];
  options?: Array<{ id: string; text: string }>;
  snake_words?: string[];
  example?: { before: string; word: string; after: string };
};

type Homework = {
  id: string;
  title: string;
  description: string | null;
  exercises: HomeworkExercise[];
};

type GradeResult = {
  score: number;
  total: number;
  wrong_or_empty: number[];
};

function homeworkDateLabel(task: Homework) {
  const match = task.title.match(/(\\d{1,2})\\.(\\d{1,2})/);
  if (!match) return task.title;
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const month = months[Number(match[2]) - 1];
  return month ? Number(match[1]) + " " + month : task.title;
}

function telegramShareUrl(task: Homework, grade: GradeResult) {
  const wrongOrEmpty = grade.wrong_or_empty.length ? grade.wrong_or_empty.join(", ") : "none";
  const message = [
    "Homework - " + homeworkDateLabel(task),
    "Score: " + grade.score + " / " + grade.total,
    "Wrong or empty: " + wrongOrEmpty
  ].join("\\n").replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-");
  return "https://t.me/afanasyeva_x?text=" + encodeURIComponent(message);
}


const KATE_NOV_21_HOMEWORK: Homework = {
  id: "kate-2026-11-21-b1-vocabulary",
  title: "21.11 · Everyday life & communication",
  description: "21 November · Vocabulary practice",
  exercises: [
    {
      id: "nov21-gap-fill",
      type: "gap",
      title: "Complete the sentences",
      instructions: "Complete each sentence with one word or phrase from the word bank.",
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
      
      items: [
        { number: 1, prompt: "The way you see yourself is called your ___." },
        { number: 2, prompt: "The plural of 'child' is ___." },
        { number: 3, prompt: "___ it was raining, we went for a walk." },
        { number: 4, prompt: "We should listen to ___, even when their opinions differ from ours." },
        { number: 5, prompt: "Please don't ___ me for something I didn't do." }
      ]
    },
    {
      id: "nov21-rewrite",
      type: "rewrite",
      title: "Rewrite the sentences",
      
      items: [
        { number: 1, prompt: "I don't understand what you mean. (quite get)" },
        { number: 2, prompt: "I agree with your opinion. (share)" },
        { number: 3, prompt: "Although she was tired, she finished the task. (even though)" },
        { number: 4, prompt: "I will tell you my decision tomorrow. (say)" }
      ]
    },
    {
      id: "nov21-error-correction",
      type: "error-correction",
      title: "Correct the mistakes",
      instructions: "Each sentence contains one mistake. Rewrite the sentence correctly.",
      items: [
        { number: 1, prompt: "I don't can understand what he is saying." },
        { number: 2, prompt: "Even though it was late, but we kept talking." },
        { number: 3, prompt: "She explained me her opinion." },
        { number: 4, prompt: "We have celebrated her birthday last weekend." },
        { number: 5, prompt: "These figures don't adds up." }
      ]
    }
  ]
};

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

function WordSnakeExercise({ checkTrigger, resetTrigger, startNumber = 1 }: { checkTrigger: number; resetTrigger: number; startNumber?: number }) {
  const [rings, setRings] = useState<Array<[number, number]>>([]);
  const [start, setStart] = useState<number | null>(null);
  const [values, setValues] = useState<string[]>(() => SNAKE_ITEMS.map(() => ""));
  const [checked, setChecked] = useState(false);
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

  useEffect(() => { if (checkTrigger) setChecked(true); }, [checkTrigger]);
  useEffect(() => { if (resetTrigger) { setValues(SNAKE_ITEMS.map(() => "")); setRings([]); setStart(null); setChecked(false); } }, [resetTrigger]);

  return (
    <section className="word-snake-exercise">
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
          const mark = checked && hasAnswer ? (correct ? "ok" : "no") : "";
          return (
            <div className="word-snake-question" key={index}>
              <span className="word-snake-number">{startNumber + index}.</span>
              <p>{item.before}<input aria-label={"Answer " + (index + 1)} className={"word-snake-gap" + (checked && correct ? " is-correct" : "") + (checked && hasAnswer && !correct ? " is-wrong" : "")} value={values[index]} autoComplete="off" spellCheck={false} autoCorrect="off" onChange={(event) => { setValues((current) => current.map((value, i) => i === index ? event.target.value : value)); setChecked(false); }} />{item.after}</p>
              <span className={"word-snake-mark " + mark} aria-label={mark === "ok" ? "Correct" : mark === "no" ? "Incorrect" : ""}>{mark === "ok" ? <span className="simple-checkmark" aria-hidden="true" /> : mark === "no" ? "×" : ""}</span>
            </div>
          );
        })}
      </div>
      {checked && <div className="word-snake-controls">
        <strong className="word-snake-score">{rightCount} / {SNAKE_ITEMS.length}</strong>
      </div>}
    </section>
  );
}



function LessonWordSnake({
  taskId,
  section,
  startNumber,
  answers,
  onAnswer,
  grade,
  resetTrigger
}: {
  taskId: string;
  section: HomeworkExercise;
  startNumber: number;
  answers: Record<string, string>;
  onAnswer: (taskId: string, number: number, value: string) => void;
  grade?: GradeResult;
  resetTrigger: number;
}) {
  const [rings, setRings] = useState<Array<[number, number]>>([]);
  const [start, setStart] = useState<number | null>(null);
  const [snakeLoaded, setSnakeLoaded] = useState(false);
  const targets = section.snake_words || [];
  const letters = targets.join("").replace(/\s/g, "").split("");
  const storageKey = "word-snake|" + taskId + "|" + section.id;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved.rings)) setRings(saved.rings);
      }
    } catch { /* Ignore unavailable or invalid saved circles. */ }
    setSnakeLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!snakeLoaded) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ rings })); } catch { /* Storage may be unavailable. */ }
  }, [rings, snakeLoaded, storageKey]);

  useEffect(() => {
    if (resetTrigger) {
      setRings([]);
      setStart(null);
    }
  }, [resetTrigger]);

  function chooseLetter(index: number) {
    if (start === null) {
      setStart(index);
      return;
    }
    const a = Math.min(start, index);
    const b = Math.max(start, index);
    if (a !== b && !rings.some(([x, y]) => !(b < x || a > y))) {
      setRings((current) => [...current, [a, b]]);
    }
    setStart(null);
  }

  return (
    <div className="word-snake-exercise lesson-word-snake">
      <div className="word-snake-letters" aria-label="Word snake">
        {letters.map((letter, index) => {
          const ring = rings.find(([a]) => a === index);
          if (ring) {
            const [a, b] = ring;
            return (
              <button
                type="button"
                className="word-snake-ring"
                key={index}
                title="Click to remove this circle"
                onClick={() => { setRings((current) => current.filter(([x, y]) => x !== a || y !== b)); setStart(null); }}
              >
                {letters.slice(a, b + 1).map((char, offset) => (
                  <span key={offset} style={{ transform: "translateY(" + (Math.sin((a + offset) * 0.55) * 7) + "px)" }}>{char}</span>
                ))}
              </button>
            );
          }
          if (rings.some(([a, b]) => index > a && index <= b)) return null;
          return (
            <button
              type="button"
              className={"word-snake-letter" + (start === index ? " is-start" : "")}
              key={index}
              onClick={() => chooseLetter(index)}
              style={{ transform: "translateY(" + (Math.sin(index * 0.55) * 7) + "px)" }}
            >
              {letter}
            </button>
          );
        })}
      </div>
      <p className="word-snake-note">Click the first and last letter of each word or phrase to circle it. Click a circle to remove it.</p>
      <div className="word-snake-questions">
        {section.items.map((item, index) => {
          const displayNumber = startNumber + index;
          const value = answers[taskId + "::" + displayNumber] || "";
          const wrong = grade?.wrong_or_empty.includes(displayNumber) || false;
          const mark = grade ? (wrong ? "no" : "ok") : "";
          return (
            <div className="word-snake-question" key={displayNumber}>
              <span className="word-snake-number">{displayNumber}.</span>
              <p>
                {item.before}
                <input
                  aria-label={"Answer " + displayNumber}
                  className={"word-snake-gap" + (grade && !wrong ? " is-correct" : "") + (grade && wrong && value.trim() ? " is-wrong" : "")}
                  value={value}
                  autoComplete="off"
                  spellCheck={false}
                  autoCorrect="off"
                  onChange={(event) => onAnswer(taskId, displayNumber, event.target.value)}
                />
                {item.after}
              </p>
              <span className={"word-snake-mark " + mark} aria-label={mark === "ok" ? "Correct" : mark === "no" ? "Incorrect or empty" : ""}>
                {mark === "ok" ? "✓" : mark === "no" ? "×" : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
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
  const [grades, setGrades] = useState<Record<string, GradeResult>>({});
  const [gradingTaskId, setGradingTaskId] = useState<string | null>(null);
  const [gradeError, setGradeError] = useState("");

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
    setAnswers((current) => ({ ...current, [taskId + "::" + number]: value }));
    setGrades((current) => {
      if (!current[taskId]) return current;
      const next = { ...current };
      delete next[taskId];
      return next;
    });
    setGradeError("");
  }

  async function handleCheck(task: Homework) {
    setActivityCheckTrigger((value) => value + 1);
    setGrades((current) => {
      const next = { ...current };
      delete next[task.id];
      return next;
    });
    setGradeError("");
    setGradingTaskId(task.id);

    const taskAnswers: Record<string, string> = {};
    const prefix = task.id + "::";
    Object.entries(answers).forEach(([key, value]) => {
      if (key.startsWith(prefix)) taskAnswers[key.slice(prefix.length)] = value;
    });

    try {
      const { data, error: checkError } = await getSupabase().rpc("grade_homework", {
        p_homework_id: task.id,
        p_answers: taskAnswers
      });
      if (checkError) throw checkError;
      const result = data as GradeResult | null;
      if (!result || typeof result.score !== "number" || typeof result.total !== "number" || !Array.isArray(result.wrong_or_empty)) {
        throw new Error("The grading service returned an unexpected result.");
      }
      setGrades((current) => ({ ...current, [task.id]: result }));
    } catch {
      setGradeError("Automatic checking is not available for this homework yet. Please try again later.");
    } finally {
      setGradingTaskId(null);
    }
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
      const databaseHomework = ((data || []) as Homework[]).filter(
        (task) => task.id !== "18bbb034-4f7e-4a77-aa35-851d101b3d93"
      );
      const visibleHomework = name.trim().toLowerCase() === "kate" &&
        !databaseHomework.some((task) => task.id === KATE_NOV_21_HOMEWORK.id)
        ? [KATE_NOV_21_HOMEWORK, ...databaseHomework]
        : databaseHomework;
      setHomework(visibleHomework);
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
    setGrades({});
    setGradeError("");
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
          </div>
        </section>
      ) : (
        <section className="dashboard">
          <div className="dashboard-heading">
            <div>
              <p className="eyebrow">YOUR LEARNING SPACE</p>
              <h1>Welcome, <em>{name.trim().charAt(0).toUpperCase() + name.trim().slice(1)}.</em></h1>
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
                  <button className={`homework-list-item ${activeHomeworkId === task.id ? "is-active" : ""}`} key={task.id} onClick={() => setActiveHomeworkId((current) => current === task.id ? null : task.id)}>
                    <span><strong>{task.id === "18bbb034-4f7e-4a77-aa35-851d101b3d93" ? "18.11 · Films, feelings & should have + V3" : task.title}</strong></span>
                    <span className="homework-list-arrow" aria-hidden="true">{activeHomeworkId === task.id ? "−" : "+"}</span>
                  </button>
                ))}
              </nav>
              {homework.filter((task) => task.id === activeHomeworkId).map((task) => (
                <article className="homework-card" key={task.id}>
                  <h2>{task.id === "18bbb034-4f7e-4a77-aa35-851d101b3d93" ? "18.11 · Films, feelings & should have + V3" : task.title}</h2>
                  {task.exercises?.map((section, index) => (
                    <section className="exercise-section" key={section.id}>
                      <div className="section-heading"><span className="section-number">0{index + 1}</span><div><h3>{section.title}</h3>{section.instructions && <p>{section.instructions}</p>}</div></div>
                      {section.type !== "snake" && section.word_bank && <div className="word-bank"><strong>Word bank</strong>{section.word_bank.map((word) => { const wordKey = `${task.id}::${section.id}::${word}`; return <button type="button" className={`word-bank-word ${crossedWords[wordKey] ? "is-crossed" : ""}`} aria-pressed={!!crossedWords[wordKey]} onClick={() => setCrossedWords((current) => ({ ...current, [wordKey]: !current[wordKey] }))} key={word}>{word}</button>; })}</div>}
                      {section.type === "snake" ? (
                        <LessonWordSnake
                          taskId={task.id}
                          section={section}
                          startNumber={task.exercises.slice(0, index).reduce((total, exercise) => total + exercise.items.length, 0) + 1}
                          answers={answers}
                          onAnswer={setAnswer}
                          grade={grades[task.id]}
                          resetTrigger={activityResetTrigger}
                        />
                      ) : section.items.map((item, itemIndex) => {
                        const previousItems = task.exercises.slice(0, index).reduce((total, exercise) => total + exercise.items.length, 0);
                        const displayNumber = previousItems + itemIndex + 1;
                        const answerKey = task.id + "::" + displayNumber;
                        return (
                          <div className={"question" + (section.type === "matching" ? "" : " answers-under")} key={item.number}>
                            {section.type === "gap" ? (
                              <label className="inline-gap-label" htmlFor={"answer-" + task.id + "-" + displayNumber}>
                                <span className="question-number">{displayNumber}.</span> {(item.prompt || "").split("___")[0]}
                                <input className="inline-gap-input" id={"answer-" + task.id + "-" + displayNumber} type="text" spellCheck={false} autoCorrect="off" value={answers[answerKey] || ""} onChange={(e) => setAnswer(task.id, displayNumber, e.target.value)} aria-label={"Answer to question " + displayNumber} />
                                {(item.prompt || "").split("___").slice(1).join("___")}
                              </label>
                            ) : (
                              <>
                                <label htmlFor={"answer-" + task.id + "-" + displayNumber}><span className="question-number">{displayNumber}.</span> {item.prompt || item.words?.join(" / ") || ""}</label>
                                {section.type === "matching" ? (
                                  <select id={"answer-" + task.id + "-" + displayNumber} value={answers[answerKey] || ""} onChange={(e) => setAnswer(task.id, displayNumber, e.target.value)}>
                                    <option value="">Choose a meaning…</option>
                                    {section.options?.map((option) => <option value={option.id} key={option.id}>{option.text}</option>)}
                                  </select>
                                ) : (
                                  <input id={"answer-" + task.id + "-" + displayNumber} type="text" spellCheck={false} autoCorrect="off" value={answers[answerKey] || ""} onChange={(e) => setAnswer(task.id, displayNumber, e.target.value)} />
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </section>
                  ))}
                  {grades[task.id] && <div className="homework-score"><p className="grade-summary">Score: {grades[task.id].score} / {grades[task.id].total}</p></div>}
                  {task.id === "18bbb034-4f7e-4a77-aa35-851d101b3d93" && <section className="exercise-section word-snake-section"><div className="section-heading"><span className="section-number">{String((task.exercises?.length || 0) + 1).padStart(2, "0")}</span><div><h3>Find the verbs in the word snake</h3><p>Complete the sentences using verbs from the word snake in the correct form.</p></div></div><WordSnakeExercise checkTrigger={activityCheckTrigger} resetTrigger={activityResetTrigger} startNumber={(task.exercises?.reduce((total, exercise) => total + exercise.items.length, 0) || 0) + 1} /></section>}
                  <div className="whole-homework-controls">
                    <button type="button" disabled={gradingTaskId === task.id} onClick={() => handleCheck(task)}>{gradingTaskId === task.id ? "Checking…" : "Check"}</button>
                    <button type="button" onClick={() => { try { const saved: Record<string, string> = {}; Object.entries(answers).forEach(([key, value]) => { const prefix = task.id + "::"; if (key.startsWith(prefix)) saved[key.slice(prefix.length)] = value; }); localStorage.setItem("hw-answers|" + task.id, JSON.stringify(saved)); setSaveNotice("Saved on this device"); } catch { setSaveNotice("Could not save on this device"); } }}>Save</button>
                    <button type="button" className="is-ghost" onClick={() => { setAnswers((current) => { const next = { ...current }; Object.keys(next).forEach((key) => { if (key.startsWith(task.id + "::")) delete next[key]; }); return next; }); setGrades((current) => { const next = { ...current }; delete next[task.id]; return next; }); setGradeError(""); try { localStorage.removeItem("hw-answers|" + task.id); localStorage.removeItem("word-snake|" + task.id + "|nov24-word-snake"); } catch {} setActivityResetTrigger((value) => value + 1); setSaveNotice(""); }}>Reset</button>
                    {saveNotice && <span className="save-notice" role="status">{saveNotice}</span>}
                    {gradeError && <span className="grade-error" role="alert">{gradeError}</span>}
                    {grades[task.id] ? (
                      <a className="telegram-button" href={telegramShareUrl(task, grades[task.id])} target="_blank" rel="noreferrer">Send to Ksenia in Telegram <span>↗</span></a>
                    ) : (
                      <span className="telegram-hint">Check your answers to prepare the Telegram message.</span>
                    )}
                  </div>
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
