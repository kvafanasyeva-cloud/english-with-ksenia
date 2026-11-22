"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("The website is not connected to Supabase yet.");
  }

  if (!supabase) {
    supabase = createClient(url, anonKey);
  }

  return supabase;
}

export default function Home() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!projectUrl || !anonKey) {
        throw new Error("The website is not connected to Supabase yet.");
      }

      const response = await fetch(
        `${projectUrl}/functions/v1/student-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: anonKey,
          },
          body: JSON.stringify({ name: name.trim(), code }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "We couldn't log you in. Please check your details.");
      }

      const { error: sessionError } = await getSupabase().auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      });

      if (sessionError) {
        throw new Error("Your login was verified, but we couldn't start your session. Please try again.");
      }

      setSignedIn(true);
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="English with Ksenia home">
          <span className="wordmark-mark">e.</span>
          <span>ENGLISH WITH KSENIA</span>
        </Link>
        <span className="topbar-note">YOUR LEARNING SPACE</span>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">A LITTLE SPACE FOR BIG PROGRESS</p>
          <h1>English, one<br /><em>step at a time.</em></h1>
          <p className="intro">
            Your lessons, homework and progress — all in one place.
            Come in and pick up where you left off.
          </p>
        </div>

        <div className="login-card">
          {signedIn ? (
            <div className="success-state">
              <div className="success-icon">✓</div>
              <p className="eyebrow">YOU’RE SIGNED IN</p>
              <h2>Welcome{ name.trim() ? `, ${name.trim()}` : ""}.</h2>
              <p className="card-copy">
                Your account is connected. Your personal homework list will appear here once the student access rules are configured.
              </p>
              <button className="secondary-button" onClick={async () => {
                await getSupabase().auth.signOut();
                setSignedIn(false);
              }}>
                Sign out
              </button>
            </div>
          ) : (
            <>
              <p className="eyebrow">STUDENT ACCESS</p>
              <h2>Good to see you.</h2>
              <p className="card-copy">Enter your name and personal code to open your learning space.</p>

              <form onSubmit={handleLogin}>
                <label htmlFor="student-name">Your name</label>
                <input
                  id="student-name"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Kate"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={100}
                />

                <label htmlFor="student-code">Personal code</label>
                <input
                  id="student-code"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  required
                  maxLength={100}
                />

                {error && <p className="error-message" role="alert">{error}</p>}

                <button className="primary-button" type="submit" disabled={loading}>
                  {loading ? "Checking…" : "Enter my space"}
                  {!loading && <span aria-hidden="true">↗</span>}
                </button>
              </form>
              <p className="privacy-note">Your personal code is private. Keep it to yourself.</p>
            </>
          )}
        </div>
      </section>

      <footer className="footer">
        <span>ENGLISH WITH KSENIA</span>
        <span>LEARN WITH CURIOSITY.</span>
      </footer>
    </main>
  );
}
