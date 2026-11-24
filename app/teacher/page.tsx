"use client";

import { useMemo, useState } from "react";
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

export default function TeacherArea() {
  const [code, setCode] = useState("");
  const [teacherCode, setTeacherCode] = useState("");
  const [teacherAnswers, setTeacherAnswers] = useState<Record<string, string>>({});
  const [teacherGrades, setTeacherGrades] = useState<Record<string, {score:number; total:number; wrong_or_empty:number[]}>>({});
  const [teacherCrossedWords, setTeacherCrossedWords] = useState<Record<string, boolean>>({});
  const [checkingHomework, setCheckingHomework] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState("all");
  const [expandedHomework, setExpandedHomework] = useState<string | null>(null);

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
    setSelected("all");
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
    setSelected("all");
    setExpandedHomework(null);
    setCode("");
    setTeacherCode("");
    setTeacherAnswers({});
    setTeacherGrades({});
    setError("");
  }

  const visibleHomework = useMemo(
    () => selected === "all" ? homework : homework.filter((item) => item.student_id === selected),
    [selected, homework]
  );
  const selectedStudentName = students.find((student) => student.id === selected)?.name;

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
          <p className="intro">Every student, every assignment, all in one place.</p>
        </div>
      </div>

      <div className="teacher-stats">
        <div className="teacher-stat"><strong>{students.length}</strong><span>STUDENTS</span></div>
        <div className="teacher-stat"><strong>{homework.length}</strong><span>HOMEWORKS</span></div>
        <div className="teacher-stat"><strong>{submissions.length}</strong><span>SUBMISSIONS</span></div>
      </div>

      <nav className="homework-list teacher-student-list" aria-label="Filter homework by student">
        <p className="eyebrow">STUDENTS</p>
        <button type="button" className={selected === "all" ? "homework-list-item is-active" : "homework-list-item"} onClick={() => { setSelected("all"); setExpandedHomework(null); }}>
          <span><strong>All students</strong><small>Show every assignment</small></span>
          <span className="homework-list-arrow">{homework.length}</span>
        </button>
        {students.map((student) => {
          const count = homework.filter((item) => item.student_id === student.id).length;
          return <button type="button" key={student.id} className={selected === student.id ? "homework-list-item is-active" : "homework-list-item"} onClick={() => { setSelected(student.id); setExpandedHomework(null); }}>
            <span><strong>{student.name}</strong><small>{count} {count === 1 ? "homework" : "homeworks"}</small></span>
            <span className="homework-list-arrow">↗</span>
          </button>;
        })}
      </nav>

      <section className="homework-list teacher-homework-list">
        <p className="eyebrow">HOMEWORK · {selectedStudentName || "ALL STUDENTS"}</p>
        {visibleHomework.map((item) => {
          const studentName = students.find((student) => student.id === item.student_id)?.name || "Student";
          const submissionCount = submissions.filter((submission) => submission.homework_id === item.id).length;
          const questionCount = item.exercises?.reduce((total, exercise) => total + (exercise.items?.length || 0), 0) || 0;
          const isExpanded = expandedHomework === item.id;
          return <article className="teacher-assignment" key={item.id}>
            <button type="button" className="teacher-assignment-row" aria-expanded={isExpanded} onClick={() => setExpandedHomework(isExpanded ? null : item.id)}>
              <span className="teacher-assignment-main">
                <small>{studentName} · {item.description || new Date(item.created_at).toLocaleDateString()}</small>
                <strong>{item.title}</strong>
                <span className="teacher-assignment-meta">{item.exercises?.length || 0} exercises · {questionCount} questions · {submissionCount} submissions</span>
              </span>
              <span className={item.published ? "teacher-status is-published" : "teacher-status"}>{item.published ? "Published" : "Draft"}</span>
              <span className="homework-list-arrow">{isExpanded ? "−" : "+"}</span>
            </button>
            {isExpanded && <div className="teacher-assignment-detail">
              {item.exercises?.map((exercise, index) => {
                const offset = item.exercises.slice(0, index).reduce((total, previous) => total + (previous.items?.length || 0), 0);
                return <section className="teacher-exercise-preview" key={exercise.id || index}>
                  <h3><span>{String(index + 1).padStart(2, "0")}</span>{exercise.title}</h3>
                  {exercise.instructions && <p className="teacher-exercise-instructions">{exercise.instructions}</p>}
                  {exercise.word_bank?.length ? <div className="teacher-word-bank"><strong>Word bank</strong>{exercise.word_bank.map((word) => <button type="button" className={teacherCrossedWords[item.id + "::" + exercise.id + "::" + word] ? "teacher-word-crossed" : "teacher-word-choice"} key={word} onClick={() => setTeacherCrossedWords((current)=>({...current,[item.id + "::" + exercise.id + "::" + word]:!current[item.id + "::" + exercise.id + "::" + word]}))}>{word}</button>)}</div> : null}
                  {exercise.snake_words?.length ? <div className="teacher-snake-letters" aria-label="Word snake">{exercise.snake_words.join("").replace(/\s/g, "").split("").map((letter, i) => <span key={i}>{letter}</span>)}</div> : null}
                  {exercise.items?.map((entry, entryIndex) => {
                    const number = offset + entryIndex + 1;
                    const answerId = item.id + "::" + number;
                    const prompt = entry.prompt || (entry.words || []).join(" / ") || [entry.before, "___", entry.after].filter(Boolean).join("");
                    return <div className="teacher-live-question" key={entry.number ?? entryIndex}>
                      <label htmlFor={"teacher-answer-" + item.id + "-" + number}><span>{number}.</span> {prompt}</label>
                      {exercise.type === "matching" ? <select id={"teacher-answer-" + item.id + "-" + number} value={teacherAnswers[answerId] || ""} onChange={(e) => { setTeacherAnswers((current) => ({...current,[answerId]:e.target.value})); setTeacherGrades((current) => { const next={...current}; delete next[item.id]; return next; }); }}>
                        <option value="">Choose a meaning…</option>{exercise.options?.map((option) => <option key={option.id} value={option.id}>{option.id}. {option.text}</option>)}
                      </select> : exercise.type === "gap" && prompt.includes("___") ? <label className="teacher-inline-gap" htmlFor={"teacher-answer-" + item.id + "-" + number}><span>{number}.</span> {prompt.split("___")[0]}<input id={"teacher-answer-" + item.id + "-" + number} value={teacherAnswers[answerId] || ""} onChange={(e) => { setTeacherAnswers((current) => ({...current,[answerId]:e.target.value})); setTeacherGrades((current) => { const next={...current}; delete next[item.id]; return next; }); }} autoComplete="off" spellCheck={false} />{prompt.split("___").slice(1).join("___")}</label> : <input id={"teacher-answer-" + item.id + "-" + number} value={teacherAnswers[answerId] || ""} onChange={(e) => { setTeacherAnswers((current) => ({...current,[answerId]:e.target.value})); setTeacherGrades((current) => { const next={...current}; delete next[item.id]; return next; }); }} autoComplete="off" spellCheck={false} />}
                    </div>;
                  })}
                  {exercise.options?.length && exercise.type !== "matching" ? <div className="teacher-options"><strong>Options:</strong>{exercise.options.map((option) => <span key={option.id}>{option.id}. {option.text}</span>)}</div> : null}
                </section>;
              })}
              <div className="teacher-practice-footer">
                <button type="button" disabled={checkingHomework === item.id} onClick={async () => {
                  setCheckingHomework(item.id);
                  try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")}/functions/v1/teacher-dashboard`, {
                      method: "POST", headers: {"Content-Type":"application/json", apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""}`},
                      body: JSON.stringify({username:"k", code:teacherCode, action:"grade", homework_id:item.id, answers:Object.fromEntries(Object.entries(teacherAnswers).filter(([key])=>key.startsWith(item.id+"::")).map(([key,value])=>[key.slice(item.id.length+2),value]))})
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error || "Could not check this homework.");
                    setTeacherGrades((current)=>({...current,[item.id]:result}));
                  } catch (err) { window.alert(err instanceof Error ? err.message : "Could not check this homework."); }
                  finally { setCheckingHomework(null); }
                }}>{checkingHomework === item.id ? "Checking…" : "Check answers"}</button>
                <button type="button" className="teacher-clear-button" onClick={()=>{setTeacherAnswers((current)=>{const next={...current};Object.keys(next).forEach((key)=>{if(key.startsWith(item.id+"::"))delete next[key];});return next;});setTeacherGrades((current)=>{const next={...current};delete next[item.id];return next;});}}>Reset</button>
                <strong className="teacher-practice-score">{teacherGrades[item.id] ? `Score: ${teacherGrades[item.id].score} / ${teacherGrades[item.id].total}` : " "}</strong>
              </div>
            </div>}
          </article>;
        })}
        {visibleHomework.length === 0 && <p className="teacher-empty">No homework for this student yet.</p>}
      </section>
    </section>
    <footer className="footer"><span>ENGLISH WITH KSENIA</span><span>YOUR TEACHING SPACE</span></footer>
  </main>;
}
