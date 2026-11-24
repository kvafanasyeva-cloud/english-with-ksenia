"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Student = { id: string; name: string; created_at: string };
type HomeworkItem = { number?: number; prompt?: string; words?: string[]; before?: string; after?: string };
type HomeworkExercise = {
  id: string;
  type: string;
  title: string;
  instructions?: string;
  items: HomeworkItem[];
  word_bank?: string[];
  snake_words?: string[];
  options?: Array<{ id: string; text: string }>;
};
type Homework = {
  id: string;
  student_id: string;
  title: string;
  description: string | null;
  published: boolean;
  created_at: string;
  due_at: string | null;
  exercises: HomeworkExercise[];
};
type Submission = { id: string; student_id: string; homework_id: string; score: number | null; submitted_at: string };

const KATE_NOV_21_HOMEWORK: Omit<Homework, "student_id"> = {
  id: "kate-2026-11-21-b1-vocabulary",
  title: "21.11 · Everyday life & communication",
  description: "21 November · Vocabulary practice",
  published: true,
  created_at: "2026-11-21T09:00:00.000Z",
  due_at: null,
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

function TeacherWordSnake({ words }: { words: string[] }) {
  const [rings, setRings] = useState<Array<[number, number]>>([]);
  const [start, setStart] = useState<number | null>(null);
  const letters = words.join("").replace(/\s/g, "").split("");

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
            return <button type="button" className="word-snake-ring" key={index} title="Click to remove this circle" onClick={() => { setRings((current) => current.filter(([x, y]) => x !== a || y !== b)); setStart(null); }}>{letters.slice(a, b + 1).map((char, offset) => <span key={offset} style={{ transform: "translateY(" + (Math.sin((a + offset) * 0.55) * 7) + "px)" }}>{char}</span>)}</button>;
          }
          if (rings.some(([a, b]) => index > a && index <= b)) return null;
          return <button type="button" className={"word-snake-letter" + (start === index ? " is-start" : "")} key={index} onClick={() => chooseLetter(index)} style={{ transform: "translateY(" + (Math.sin(index * 0.55) * 7) + "px)" }}>{letter}</button>;
        })}
      </div>
      <p className="word-snake-note">Click the first and last letter of each word or phrase to circle it. Click a circle to remove it.</p>
    </div>
  );
}

export default function TeacherArea() {
  const [code, setCode] = useState("");
  const [teacherCode, setTeacherCode] = useState("");
  const [teacherAnswers, setTeacherAnswers] = useState<Record<string, string>>({});
  const [teacherGrades, setTeacherGrades] = useState<Record<string, {score:number; total:number; wrong_or_empty:number[]}>>({});
  const [teacherSaveNotice, setTeacherSaveNotice] = useState("");
  const [teacherCrossedWords, setTeacherCrossedWords] = useState<Record<string, boolean>>({});
  const [checkingHomework, setCheckingHomework] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [expandedHomework, setExpandedHomework] = useState<string | null>(null);
  const expandedHomeworkRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!expandedHomework || !expandedHomeworkRef.current) return;
    expandedHomeworkRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [expandedHomework]);

  async function loadData(accessCode: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) throw new Error("The website is not connected to Supabase yet.");

    const response = await fetch(`${url.replace(/\/$/, "")}/functions/v1/teacher-dashboard`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`
      },
      body: JSON.stringify({ username: "k", code: accessCode })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "The username or code is incorrect.");

    const loadedStudents: Student[] = data.students || [];
    const loadedHomework: Homework[] = data.homework || [];
    const kate = loadedStudents.find((student) => student.name.trim().toLowerCase() === "kate");
    if (kate && !loadedHomework.some((item) => item.id === KATE_NOV_21_HOMEWORK.id)) {
      loadedHomework.push({ ...KATE_NOV_21_HOMEWORK, student_id: kate.id });
    }
    loadedHomework.sort((a, b) => b.created_at.localeCompare(a.created_at));

    setStudents(loadedStudents);
    setHomework(loadedHomework);
    setSubmissions(data.submissions || []);
    setTeacherCode(accessCode);
    setTeacherAnswers({});
    setTeacherGrades({});
    setLoggedIn(true);
    setExpandedHomework(null);
  }

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await loadData(code);
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setLoggedIn(false);
    setStudents([]);
    setHomework([]);
    setSubmissions([]);
    setExpandedHomework(null);
    setCode("");
    setTeacherCode("");
    setTeacherAnswers({});
    setTeacherGrades({});
    setError("");
  }


  if (!loggedIn) return <main className="page-shell">
    <header className="topbar">
      <Link className="wordmark" href="/"><span className="wordmark-mark">e.</span><span>ENGLISH WITH KSENIA</span></Link>
      <span className="topbar-note">TEACHER ACCESS</span>
    </header>
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">PRIVATE TEACHER SPACE</p>
        <h1>Your students.<br/><em>One overview.</em></h1>
        <p className="intro">All your students and their homework, together in one place.</p>
      </div>
      <div className="login-card">
        <p className="eyebrow">TEACHER LOGIN</p>
        <h2>Welcome back.</h2>
        <form onSubmit={login}>
          <label htmlFor="teacher-name">Username</label>
          <input id="teacher-name" value="k" readOnly aria-label="Username k"/>
          <label htmlFor="teacher-code">Code</label>
          <input id="teacher-code" type="password" autoComplete="current-password" placeholder="k" value={code} onChange={(event) => setCode(event.target.value)} required/>
          <button className="primary-button" type="submit" disabled={loading}>{loading ? "Opening…" : "Enter teacher area"} <span>↗</span></button>
          {error && <p className="error-message" role="alert">{error}</p>}
        </form>
      </div>
    </section>
    <footer className="footer"><span>ENGLISH WITH KSENIA</span><Link href="/">STUDENT LOGIN</Link></footer>
  </main>;

  return <main className="page-shell">
    <header className="topbar">
      <Link className="wordmark" href="/"><span className="wordmark-mark">e.</span><span>ENGLISH WITH KSENIA</span></Link>
      <button className="secondary-button signout" onClick={logout}>Sign out</button>
    </header>
    <section className="dashboard">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">PRIVATE TEACHER SPACE</p>
          <h1>Your <em>students.</em></h1>
        </div>
      </div>

      <section className="teacher-roster" aria-label="Students and homework">
        {students.map((student) => {
          const studentHomework = homework.filter((item) => item.student_id === student.id);
          return (
            <section className="teacher-student-group" key={student.id}>
              <h2 className="teacher-student-heading">{student.name}</h2>
              <div className="teacher-homework-links">
                {studentHomework.map((item) => {
                  const dateLabel = new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
                  const cleanTitle = item.title.replace(/^\d{1,2}[./]\d{1,2}\s*[·—-]\s*/, "");
                  const isActive = expandedHomework === item.id;
                  return (
                    <button type="button" key={item.id} className={"teacher-homework-link" + (isActive ? " is-active" : "")} aria-expanded={isActive} onClick={() => { setExpandedHomework(isActive ? null : item.id); setTeacherSaveNotice(""); }}>
                      <span className="teacher-homework-date">{dateLabel}</span>
                      <span className="teacher-homework-title">{cleanTitle}</span>
                    </button>
                  );
                })}
                {studentHomework.length === 0 && <p className="teacher-empty">No homework yet.</p>}
              </div>
            </section>
          );
        })}
      </section>

      {homework.filter((item) => item.id === expandedHomework).map((item) => {
        const student = students.find((entry) => entry.id === item.student_id);
        const studentName = student?.name || "Student";
        const dateLabel = new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
        const cleanTitle = item.title.replace(/^\d{1,2}[./]\d{1,2}\s*[·—-]\s*/, "");
        const boardDate = item.title.match(/^(\d{1,2}[./]\d{1,2})/);
        return (
          <article className="homework-card teacher-homework-card" key={item.id} ref={(node) => { expandedHomeworkRef.current = node; }}>
            <p className="eyebrow teacher-card-meta">{studentName.toUpperCase()} · {dateLabel.toUpperCase()}{boardDate ? " · BOARD " + boardDate[1] : ""}</p>
            <h2>{cleanTitle}</h2>
            {item.exercises?.map((exercise, index) => {
              const offset = item.exercises.slice(0, index).reduce((total, previous) => total + (previous.items?.length || 0), 0);
              return (
                <section className="exercise-section" key={exercise.id || index}>
                  <div className="section-heading">
                    <span className="section-number">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3>{exercise.title}</h3>
                      {exercise.instructions && <p>{exercise.instructions}</p>}
                    </div>
                  </div>

                  {exercise.word_bank?.length ? (
                    <div className="word-bank">
                      <strong>WORD BOX</strong>
                      {exercise.word_bank.map((word) => {
                        const wordKey = item.id + "::" + exercise.id + "::" + word;
                        return <button type="button" className={teacherCrossedWords[wordKey] ? "word-bank-word is-crossed" : "word-bank-word"} aria-pressed={!!teacherCrossedWords[wordKey]} onClick={() => setTeacherCrossedWords((current) => ({ ...current, [wordKey]: !current[wordKey] }))} key={word}>{word}</button>;
                      })}
                      <p className="teacher-word-bank-note">Click or tap a word to cross it out when you've used it.</p>
                    </div>
                  ) : null}

                  {exercise.type === "snake" && exercise.snake_words?.length ? <TeacherWordSnake words={exercise.snake_words} /> : null}

                  {exercise.items?.map((entry, entryIndex) => {
                    const number = offset + entryIndex + 1;
                    const answerId = item.id + "::" + number;
                    const prompt = entry.prompt || (entry.words || []).join(" / ") || "";
                    const updateAnswer = (value: string) => {
                      setTeacherAnswers((current) => ({ ...current, [answerId]: value }));
                      setTeacherGrades((current) => {
                        const next = { ...current };
                        delete next[item.id];
                        return next;
                      });
                    };

                    if (exercise.type === "snake") {
                      return (
                        <div className="word-snake-question" key={entry.number ?? entryIndex}>
                          <span className="word-snake-number">{number}.</span>
                          <p>{entry.before || ""}<input aria-label={"Answer " + number} className="word-snake-gap" value={teacherAnswers[answerId] || ""} autoComplete="off" spellCheck={false} autoCorrect="off" onChange={(event) => updateAnswer(event.target.value)} />{entry.after || ""}</p>
                          <span className={"word-snake-mark " + (teacherGrades[item.id] ? (teacherGrades[item.id].wrong_or_empty.includes(number) ? "no" : "ok") : "")}>{teacherGrades[item.id] ? (teacherGrades[item.id].wrong_or_empty.includes(number) ? "×" : "✓") : ""}</span>
                        </div>
                      );
                    }

                    if (exercise.type === "gap" && prompt.includes("___")) {
                      return (
                        <div className="question answers-under" key={entry.number ?? entryIndex}>
                          <label className="inline-gap-label" htmlFor={"teacher-answer-" + item.id + "-" + number}>
                            {number}. {prompt.split("___")[0]}
                            <input className="inline-gap-input" id={"teacher-answer-" + item.id + "-" + number} value={teacherAnswers[answerId] || ""} autoComplete="off" spellCheck={false} autoCorrect="off" onChange={(event) => updateAnswer(event.target.value)} />
                            {prompt.split("___").slice(1).join("___")}
                          </label>
                        </div>
                      );
                    }

                    return (
                      <div className={"question" + (exercise.type === "matching" ? "" : " answers-under")} key={entry.number ?? entryIndex}>
                        <label htmlFor={"teacher-answer-" + item.id + "-" + number}>{number}. {prompt}</label>
                        {exercise.type === "matching" ? (
                          <select id={"teacher-answer-" + item.id + "-" + number} value={teacherAnswers[answerId] || ""} onChange={(event) => updateAnswer(event.target.value)}>
                            <option value="">Choose a meaning…</option>
                            {exercise.options?.map((option) => <option key={option.id} value={option.id}>{option.text}</option>)}
                          </select>
                        ) : (
                          <input id={"teacher-answer-" + item.id + "-" + number} value={teacherAnswers[answerId] || ""} autoComplete="off" spellCheck={false} autoCorrect="off" onChange={(event) => updateAnswer(event.target.value)} />
                        )}
                      </div>
                    );
                  })}

                  {exercise.options?.length && exercise.type !== "matching" ? (
                    <div className="teacher-options"><strong>Options:</strong>{exercise.options.map((option) => <span key={option.id}>{option.id}. {option.text}</span>)}</div>
                  ) : null}
                </section>
              );
            })}

            {teacherGrades[item.id] && (
              <div className="homework-score">
                <p className="grade-summary">Score: {teacherGrades[item.id].score} / {teacherGrades[item.id].total}</p>
              </div>
            )}

            <div className="whole-homework-controls">
              <button type="button" disabled={checkingHomework === item.id} onClick={async () => {
                setCheckingHomework(item.id);
                try {
                  const response = await fetch((process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "") + "/functions/v1/teacher-dashboard", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
                      Authorization: "Bearer " + (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "")
                    },
                    body: JSON.stringify({
                      username: "k",
                      code: teacherCode,
                      action: "grade",
                      homework_id: item.id,
                      answers: Object.fromEntries(Object.entries(teacherAnswers).filter(([key]) => key.startsWith(item.id + "::")).map(([key, value]) => [key.slice(item.id.length + 2), value]))
                    })
                  });
                  const result = await response.json();
                  if (!response.ok) throw new Error(result.error || "Could not check this homework.");
                  setTeacherGrades((current) => ({ ...current, [item.id]: result }));
                } catch (err) {
                  window.alert(err instanceof Error ? err.message : "Could not check this homework.");
                } finally {
                  setCheckingHomework(null);
                }
              }}>{checkingHomework === item.id ? "Checking…" : "Check"}</button>
              <button type="button" onClick={() => {
                const savedAnswers = Object.fromEntries(Object.entries(teacherAnswers).filter(([key]) => key.startsWith(item.id + "::")));
                try {
                  localStorage.setItem("teacher-preview|" + item.id, JSON.stringify(savedAnswers));
                  setTeacherSaveNotice("Saved on this device");
                } catch {
                  setTeacherSaveNotice("Could not save on this device");
                }
              }}>Save</button>
              <button type="button" className="is-ghost" onClick={() => {
                setTeacherAnswers((current) => {
                  const next = { ...current };
                  Object.keys(next).forEach((key) => { if (key.startsWith(item.id + "::")) delete next[key]; });
                  return next;
                });
                setTeacherGrades((current) => {
                  const next = { ...current };
                  delete next[item.id];
                  return next;
                });
                setTeacherSaveNotice("");
              }}>Reset</button>
              {teacherSaveNotice && <span className="save-notice" role="status">{teacherSaveNotice}</span>}
            </div>
          </article>
        );
      })}
    </section>
    <footer className="footer"><span>ENGLISH WITH KSENIA</span><span>YOUR TEACHING SPACE</span></footer>
  </main>;
}
