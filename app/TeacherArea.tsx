"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Student = { id: string; name: string; created_at: string };
type HomeworkItem = { number?: number; prompt?: string; cue?: string; words?: string[]; before?: string; after?: string };
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
type GradeResult = { score: number; total: number; wrong_or_empty: number[] };

const KATE_NOV_21_HOMEWORK: Omit<Homework, "student_id"> = {
  "id": "kate-2026-11-21-b1-vocabulary",
  "title": "21.11 · Everyday life & communication",
  "description": "21 November · Vocabulary practice",
  "published": true,
  "created_at": "2026-11-21T09:00:00.000Z",
  "due_at": null,
  "exercises": [
    {
      "id": "nov21-gap-fill",
      "type": "gap",
      "title": "Complete the sentences",
      "instructions": "Complete each sentence with one word or phrase from the word bank. Use each item once.",
      "word_bank": [
        "cancel",
        "add up",
        "consider",
        "celebrate",
        "defend",
        "comprehend",
        "opinion"
      ],
      "items": [
        {
          "number": 1,
          "prompt": "We had to ___ the meeting because the teacher was ill."
        },
        {
          "number": 2,
          "prompt": "These numbers don't ___ . Can you check them again?"
        },
        {
          "number": 3,
          "prompt": "Have you ever ___ moving to another country?"
        },
        {
          "number": 4,
          "prompt": "We're going to ___ my sister's birthday this weekend."
        },
        {
          "number": 5,
          "prompt": "It's important to ___ your point of view with clear reasons."
        },
        {
          "number": 6,
          "prompt": "I didn't ___ what he was trying to explain."
        },
        {
          "number": 7,
          "prompt": "In my ___, this is the best solution."
        }
      ]
    },
    {
      "id": "nov21-matching",
      "type": "matching",
      "title": "Match the phrases and meanings",
      "instructions": "Choose the correct meaning for each phrase.",
      "options": [
        {
          "id": "a",
          "text": "to understand something"
        },
        {
          "id": "b",
          "text": "to agree with someone"
        },
        {
          "id": "c",
          "text": "to be busy doing your job"
        },
        {
          "id": "d",
          "text": "to tell someone something"
        },
        {
          "id": "e",
          "text": "to understand or hear something with difficulty"
        }
      ],
      "items": [
        {
          "number": 8,
          "prompt": "quite get / catch it"
        },
        {
          "number": 9,
          "prompt": "agree"
        },
        {
          "number": 10,
          "prompt": "at work"
        },
        {
          "number": 11,
          "prompt": "say something to you"
        },
        {
          "number": 12,
          "prompt": "comprehend"
        }
      ]
    },
    {
      "id": "nov21-complete",
      "type": "write",
      "title": "Complete the sentences",
      "items": [
        {
          "number": 13,
          "prompt": "The way you see yourself is called your ___."
        },
        {
          "number": 14,
          "prompt": "The plural of 'child' is ___."
        },
        {
          "number": 15,
          "prompt": "___ it was raining, we went for a walk."
        },
        {
          "number": 16,
          "prompt": "We should listen to ___, even when their opinions differ from ours."
        },
        {
          "number": 17,
          "prompt": "Please don't ___ me for something I didn't do."
        }
      ]
    },
    {
      "id": "nov21-rewrite",
      "type": "rewrite",
      "title": "Rewrite the sentences",
      "items": [
        {
          "number": 18,
          "prompt": "I don't understand what you mean. (quite get)"
        },
        {
          "number": 19,
          "prompt": "I agree with your opinion. (share)"
        },
        {
          "number": 20,
          "prompt": "Although she was tired, she finished the task. (even though)"
        },
        {
          "number": 21,
          "prompt": "I will tell you my decision tomorrow. (say)"
        }
      ]
    },
    {
      "id": "nov21-error-correction",
      "type": "error-correction",
      "title": "Correct the mistakes",
      "instructions": "Each sentence contains one mistake. Rewrite the sentence correctly.",
      "items": [
        {
          "number": 22,
          "prompt": "I don't can understand what he is saying."
        },
        {
          "number": 23,
          "prompt": "Even though it was late, but we kept talking."
        },
        {
          "number": 24,
          "prompt": "She explained me her opinion."
        },
        {
          "number": 25,
          "prompt": "We have celebrated her birthday last weekend."
        },
        {
          "number": 26,
          "prompt": "These figures don't adds up."
        }
      ]
    }
  ]
};


const KATE_NOV_21_ANSWER_KEY: Record<string, string | string[]> = {
  "1": "cancel",
  "2": "add up",
  "3": "consider",
  "4": "celebrate",
  "5": "defend",
  "6": "comprehend",
  "7": "opinion",
  "8": "e",
  "9": "b",
  "10": "c",
  "11": "d",
  "12": "a",
  "13": "self-perception",
  "14": "children",
  "15": ["although", "even though"],
  "16": ["others", "other people"],
  "17": "blame",
  "18": "I don't quite get what you mean.",
  "19": "I share your opinion.",
  "20": "Even though she was tired, she finished the task.",
  "21": "I will say to you what my decision is tomorrow.",
  "22": "I can't understand what he is saying.",
  "23": "Although it was late, we kept talking.",
  "24": "She explained her opinion to me.",
  "25": "We celebrated her birthday last weekend.",
  "26": "These figures don't add up."
};

function TeacherWordSnake({
  homeworkId,
  section,
  startNumber,
  answers,
  onAnswer,
  resetTrigger,
  grade
}: {
  homeworkId: string;
  section: HomeworkExercise;
  startNumber: number;
  answers: Record<string, string>;
  onAnswer: (number: number, value: string) => void;
  resetTrigger: number;
  grade?: GradeResult;
}) {
  const [rings, setRings] = useState<Array<[number, number]>>([]);
  const [start, setStart] = useState<number | null>(null);
  const [snakeLoaded, setSnakeLoaded] = useState(false);
  const letters = (section.snake_words || []).join("").replace(/\s/g, "").split("");
  const storageKey = "teacher-word-snake|" + homeworkId + "|" + section.id;

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
        {section.items.map((entry, index) => {
          const displayNumber = startNumber + index;
          const value = answers[homeworkId + "::" + displayNumber] || "";
          const wrong = grade?.wrong_or_empty.includes(displayNumber) || false;
          const mark = grade ? (wrong ? "no" : "ok") : "";
          return (
            <div className="word-snake-question" key={displayNumber}>
              <span className="word-snake-number">{displayNumber}.</span>
              <p>
                {entry.before}
                <input
                  aria-label={"Answer " + displayNumber}
                  className={"word-snake-gap" + (grade && !wrong ? " is-correct" : "") + (grade && wrong && value.trim() ? " is-wrong" : "")}
                  value={value}
                  autoComplete="off"
                  spellCheck={false}
                  autoCorrect="off"
                  onChange={(event) => onAnswer(displayNumber, event.target.value)}
                />
                {entry.after}
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
export default function TeacherArea({ initialCode, onExit }: { initialCode?: string; onExit?: () => void }) {
  const [code, setCode] = useState("");
  const [teacherCode, setTeacherCode] = useState("");
  const [teacherAnswers, setTeacherAnswers] = useState<Record<string, string>>({});
  const [teacherSaveNotice, setTeacherSaveNotice] = useState("");
  const [teacherGrades, setTeacherGrades] = useState<Record<string, GradeResult>>({});
  const [teacherGradingHomeworkId, setTeacherGradingHomeworkId] = useState<string | null>(null);
  const [teacherGradeError, setTeacherGradeError] = useState("");
  const [teacherResetTrigger, setTeacherResetTrigger] = useState(0);
  const [teacherCrossedWords, setTeacherCrossedWords] = useState<Record<string, boolean>>({});
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [expandedHomework, setExpandedHomework] = useState<string | null>(null);
  const [checkedHomework, setCheckedHomework] = useState<Record<string, boolean>>({});
  const [checksLoaded, setChecksLoaded] = useState(false);
  const [teacherAnswerKeys, setTeacherAnswerKeys] = useState<Record<string, Record<string, string | string[]>>>({});
  const [answerVisibility, setAnswerVisibility] = useState<Record<string, boolean>>({});
  const [answerLoadingId, setAnswerLoadingId] = useState<string | null>(null);
  const [answerErrors, setAnswerErrors] = useState<Record<string, string>>({});
  const expandedHomeworkRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("teacher-homework-checks");
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === "object" && !Array.isArray(saved)) {
          setCheckedHomework(Object.fromEntries(
            Object.entries(saved).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean" && entry[1])
          ));
        }
      }
    } catch { /* Ignore unavailable or invalid local storage. */ }
    setChecksLoaded(true);
  }, []);

  useEffect(() => {
    if (!checksLoaded) return;
    try {
      localStorage.setItem("teacher-homework-checks", JSON.stringify(checkedHomework));
    } catch { /* The checked marker remains visible for this session. */ }
  }, [checkedHomework, checksLoaded]);

  async function toggleHomeworkAnswers(item: Homework) {
    const willShow = !answerVisibility[item.id];
    setAnswerVisibility((current) => ({ ...current, [item.id]: willShow }));
    if (!willShow) return;

    setExpandedHomework(item.id);
    setAnswerErrors((current) => ({ ...current, [item.id]: "" }));
    if (teacherAnswerKeys[item.id]) return;

    if (item.id === KATE_NOV_21_HOMEWORK.id) {
      setTeacherAnswerKeys((current) => ({ ...current, [item.id]: KATE_NOV_21_ANSWER_KEY }));
      return;
    }

    setAnswerLoadingId(item.id);
    try {
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
        body: JSON.stringify({
          username: "k",
          code: teacherCode,
          action: "answers",
          homework_id: item.id
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "The answer key is not available for this homework.");
      if (!data.answer_key || typeof data.answer_key !== "object" || Array.isArray(data.answer_key)) {
        throw new Error("The answer key returned an unexpected result.");
      }
      setTeacherAnswerKeys((current) => ({ ...current, [item.id]: data.answer_key }));
    } catch (err) {
      setAnswerErrors((current) => ({
        ...current,
        [item.id]: err instanceof Error ? err.message : "Could not load the answer key."
      }));
    } finally {
      setAnswerLoadingId(null);
    }
  }

  function updateTeacherAnswer(homeworkId: string, number: number, value: string) {
    setTeacherAnswers((current) => ({ ...current, [homeworkId + "::" + number]: value }));
    setTeacherGrades((current) => {
      if (!current[homeworkId]) return current;
      const next = { ...current };
      delete next[homeworkId];
      return next;
    });
    setTeacherGradeError("");
  }

  async function checkTeacherHomework(item: Homework) {
    setTeacherGradeError("");
    setTeacherGrades((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
    setTeacherGradingHomeworkId(item.id);

    const taskAnswers: Record<string, string> = {};
    const prefix = item.id + "::";
    Object.entries(teacherAnswers).forEach(([key, value]) => {
      if (key.startsWith(prefix)) taskAnswers[key.slice(prefix.length)] = value;
    });

    try {
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
        body: JSON.stringify({
          username: "k",
          code: teacherCode,
          action: "grade",
          homework_id: item.id,
          answers: taskAnswers
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Automatic checking is not available for this homework yet.");
      const result = data as GradeResult;
      if (typeof result.score !== "number" || typeof result.total !== "number" || !Array.isArray(result.wrong_or_empty)) {
        throw new Error("The grading service returned an unexpected result.");
      }
      setTeacherGrades((current) => ({ ...current, [item.id]: result }));
      setCheckedHomework((current) => ({ ...current, [item.id]: true }));
    } catch (err) {
      setTeacherGradeError(err instanceof Error ? err.message : "Automatic checking is not available for this homework yet.");
    } finally {
      setTeacherGradingHomeworkId(null);
    }
  }

  useEffect(() => {
    if (!expandedHomework || !expandedHomeworkRef.current) return;
    expandedHomeworkRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [expandedHomework]);


  function resetTeacherHomework(item: Homework) {
    const prefix = item.id + "::";

    setTeacherAnswers((current) => {
      const next = { ...current };
      Object.keys(next).forEach((key) => {
        if (key.startsWith(prefix)) delete next[key];
      });
      return next;
    });

    setTeacherCrossedWords((current) => {
      const next = { ...current };
      Object.keys(next).forEach((key) => {
        if (key.startsWith(prefix)) delete next[key];
      });
      return next;
    });

    setTeacherGrades((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
    setCheckedHomework((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
    setTeacherGradeError("");
    setTeacherSaveNotice("");
    setAnswerVisibility((current) => ({ ...current, [item.id]: false }));
    setAnswerErrors((current) => ({ ...current, [item.id]: "" }));

    try {
      localStorage.removeItem("teacher-preview|" + item.id);
      item.exercises?.forEach((exercise) => {
        if (exercise.type === "snake") {
          localStorage.removeItem("teacher-word-snake|" + item.id + "|" + exercise.id);
        }
      });
    } catch { /* Storage may be unavailable. */ }

    setTeacherResetTrigger((value) => value + 1);
  }

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
    setTeacherAnswerKeys({ [KATE_NOV_21_HOMEWORK.id]: KATE_NOV_21_ANSWER_KEY });
    setAnswerVisibility({});
    setAnswerErrors({});
    setAnswerLoadingId(null);
    setTeacherGradeError("");
    setLoggedIn(true);
    setExpandedHomework(null);
  }

  useEffect(() => {
    if (!initialCode) return;
    let active = true;
    setLoading(true);
    setError("");
    loadData(initialCode)
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Something went wrong.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [initialCode]);

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
    setTeacherGradeError("");
    setError("");
    onExit?.();
  }

  if (!loggedIn && initialCode) return (
    <main className="page-shell">
      <header className="topbar">
        <Link className="wordmark" href="/"><span className="wordmark-mark">e.</span><span>ENGLISH WITH KSENIA</span></Link>
        <span className="topbar-note">TEACHER ACCESS</span>
      </header>
      <section className="dashboard">
        <p className="card-copy">{loading ? "Opening your teaching space…" : error}</p>
      </section>
    </main>
  );

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
                  const hasBeenChecked = !!checkedHomework[item.id];
                  const answersVisible = !!answerVisibility[item.id];
                  return (
                    <div className="teacher-homework-entry" key={item.id}>
                      <button type="button" className={"teacher-homework-link" + (isActive ? " is-active" : "")} aria-expanded={isActive} onClick={() => { setExpandedHomework(isActive ? null : item.id); setTeacherSaveNotice(""); setTeacherGradeError(""); }}>
                        <span className="teacher-homework-date">{dateLabel}</span>
                        <span className="teacher-homework-title">
                          <span>{cleanTitle}</span>
                          {hasBeenChecked && <span className="teacher-homework-checkmark" title="Checked" aria-label="Checked">✓</span>}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="teacher-homework-answers-button"
                        aria-pressed={answersVisible}
                        disabled={answerLoadingId === item.id}
                        onClick={() => void toggleHomeworkAnswers(item)}
                      >
                        {answerLoadingId === item.id ? "Loading…" : answersVisible ? "Hide answers" : "Answers"}
                      </button>
                    </div>
                  );
                })}
                {studentHomework.length === 0 && <p className="teacher-empty">No homework yet.</p>}
              </div>
            </section>
          );
        })}
      </section>

      {homework.filter((item) => item.id === expandedHomework).map((item) => {
        return (
          <article className="homework-card teacher-homework-card" key={item.id} ref={(node) => { expandedHomeworkRef.current = node; }}>
            <h2>
              {item.title}
              {checkedHomework[item.id] && <span className="teacher-card-checkmark" title="Checked" aria-label="Checked"> ✓</span>}
            </h2>
            {answerVisibility[item.id] && (
              <section className="teacher-answer-panel" aria-label="Homework answer key">
                <div className="teacher-answer-panel-heading">
                  <h3>Answer key</h3>
                  <button type="button" onClick={() => setAnswerVisibility((current) => ({ ...current, [item.id]: false }))}>Hide</button>
                </div>
                {answerErrors[item.id] ? (
                  <p className="teacher-answer-error" role="alert">{answerErrors[item.id]}</p>
                ) : answerLoadingId === item.id ? (
                  <p className="teacher-answer-loading">Loading answers…</p>
                ) : teacherAnswerKeys[item.id] ? (
                  item.exercises?.map((exercise, index) => {
                    const offset = item.exercises.slice(0, index).reduce((total, previous) => total + (previous.items?.length || 0), 0);
                    return (
                      <div className="teacher-answer-exercise" key={exercise.id || index}>
                        <h4>{exercise.title}</h4>
                        <ol>
                          {exercise.items?.map((entry, entryIndex) => {
                            const number = offset + entryIndex + 1;
                            const stored = teacherAnswerKeys[item.id][String(number)];
                            const accepted = stored === undefined ? [] : Array.isArray(stored) ? stored : [stored];
                            const displayAnswers = accepted.map((value) => {
                              const answer = String(value);
                              if (exercise.type === "matching") {
                                const option = exercise.options?.find((candidate) => candidate.id === answer);
                                return option ? answer.toUpperCase() + " — " + option.text : answer;
                              }
                              return answer;
                            });
                            return (
                              <li key={number}>
                                <span className="teacher-answer-number">{number}.</span>
                                <span>{displayAnswers.length ? displayAnswers.join(" / ") : "—"}</span>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    );
                  })
                ) : (
                  <p className="teacher-answer-loading">No answer key is available for this homework yet.</p>
                )}
              </section>
            )}
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

                  {exercise.type !== "snake" && exercise.word_bank?.length ? (
                    <div className="word-bank">
                      <strong>Word bank</strong>
                      {exercise.word_bank.map((word) => {
                        const wordKey = item.id + "::" + exercise.id + "::" + word;
                        return <button type="button" className={teacherCrossedWords[wordKey] ? "word-bank-word is-crossed" : "word-bank-word"} aria-pressed={!!teacherCrossedWords[wordKey]} onClick={() => setTeacherCrossedWords((current) => ({ ...current, [wordKey]: !current[wordKey] }))} key={word}>{word}</button>;
                      })}
                    </div>
                  ) : null}

                  {exercise.type === "snake" ? (
                    <TeacherWordSnake
                      key={item.id + "::" + exercise.id + "::" + teacherResetTrigger}
                      homeworkId={item.id}
                      section={exercise}
                      startNumber={offset + 1}
                      answers={teacherAnswers}
                      onAnswer={(number, value) => updateTeacherAnswer(item.id, number, value)}
                      resetTrigger={teacherResetTrigger}
                      grade={teacherGrades[item.id]}
                    />
                  ) : (
                    exercise.items?.map((entry, entryIndex) => {
                      const number = offset + entryIndex + 1;
                      const answerId = item.id + "::" + number;
                      const prompt = entry.prompt || (entry.words || []).join(" / ") || "";
                      const updateAnswer = (value: string) => updateTeacherAnswer(item.id, number, value);

                      return (
                        <div className={"question" + (exercise.type === "matching" ? "" : " answers-under")} key={entry.number ?? entryIndex}>
                          {exercise.type === "gap" ? (
                            <label className="inline-gap-label" htmlFor={"teacher-answer-" + item.id + "-" + number}>
                              <span className="question-number">{number}.</span> {(entry.prompt || "").split("___")[0]}
                              <input className="inline-gap-input" id={"teacher-answer-" + item.id + "-" + number} value={teacherAnswers[answerId] || ""} autoComplete="off" spellCheck={false} autoCorrect="off" onChange={(event) => updateAnswer(event.target.value)} />
                              {(entry.prompt || "").split("___").slice(1).join("___")}
                            </label>
                          ) : (
                            <>
                              <label className={entry.cue ? "rewrite-question-label" : undefined} htmlFor={"teacher-answer-" + item.id + "-" + number}><span className="question-number">{number}.</span> {entry.cue ? <span className="rewrite-prompt-card"><span className="rewrite-cue">{entry.cue}</span><span className="rewrite-source">{prompt}</span></span> : prompt}</label>
                              {exercise.type === "matching" ? (
                                <select id={"teacher-answer-" + item.id + "-" + number} value={teacherAnswers[answerId] || ""} onChange={(event) => updateAnswer(event.target.value)}>
                                  <option value="">Choose a meaning…</option>
                                  {exercise.options?.map((option) => <option key={option.id} value={option.id}>{option.text}</option>)}
                                </select>
                              ) : (
                                <input id={"teacher-answer-" + item.id + "-" + number} value={teacherAnswers[answerId] || ""} autoComplete="off" spellCheck={false} autoCorrect="off" onChange={(event) => updateAnswer(event.target.value)} />
                              )}
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </section>
              );
            })}
            {teacherGrades[item.id] && (
              <div className="homework-score">
                <p className="grade-summary">Score: {teacherGrades[item.id].score} / {teacherGrades[item.id].total}</p>
              </div>
            )}
            <div className="whole-homework-controls teacher-homework-controls">
              <button type="button" disabled={teacherGradingHomeworkId === item.id} onClick={() => checkTeacherHomework(item)}>
                {teacherGradingHomeworkId === item.id ? "Checking…" : "Check"}
              </button>
              <button type="button" onClick={() => {
                const savedAnswers = Object.fromEntries(Object.entries(teacherAnswers).filter(([key]) => key.startsWith(item.id + "::")));
                try {
                  localStorage.setItem("teacher-preview|" + item.id, JSON.stringify(savedAnswers));
                  setTeacherSaveNotice("Saved on this device");
                } catch {
                  setTeacherSaveNotice("Could not save on this device");
                }
              }}>Save</button>
              <button type="button" className="reset-button" onClick={() => resetTeacherHomework(item)}>Reset</button>
              {teacherSaveNotice && <span className="save-notice" role="status">{teacherSaveNotice}</span>}
              {teacherGradeError && <span className="grade-error" role="alert">{teacherGradeError}</span>}
            </div>
          </article>
        );
      })}
    </section>
    <footer className="footer"><span>ENGLISH WITH KSENIA</span><span>YOUR TEACHING SPACE</span></footer>
  </main>;
}
