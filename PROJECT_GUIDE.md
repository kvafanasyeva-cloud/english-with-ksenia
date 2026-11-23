# English with Ksenia — Project Guide

Last reviewed: 23 November 2026

This document is the working specification for maintaining the student homework portal and creating new homework. Read it before changing the site.

## 1. What this project is

A simple, shared English-learning website where each student signs in with their name and personal access code and sees their own homework.

- **Site:** https://english-with-ksenia.vercel.app
- **GitHub repository:** https://github.com/kvafanasyeva-cloud/english-with-ksenia
- **Main branch:** `main`
- **Framework:** Next.js 15, React 19, TypeScript
- **Database / authentication:** Supabase
- **Hosting / automatic deployment:** Vercel

The branding is **ENGLISH WITH KSENIA**.

### Product decision: keep it simple

- There is **no teacher dashboard workflow**. Do not send Ksenia to a separate teacher page or ask her to use a teacher login.
- Ksenia sends lesson-board screenshots, vocabulary, or lesson notes in chat. The assistant prepares the homework and adds it to the existing student page.
- Students use the same website link and their own name + personal code.
- Homework is listed on the student's page and each assignment can be opened or collapsed.
- Keep existing published homework intact. Never rewrite, delete, or silently change an old assignment.

## 2. How the site is built

### Front end

- `app/page.tsx` contains the student login, dashboard, homework loading, homework rendering, answer inputs, and the current Kate-specific homework entry.
- `app/globals.css` contains the visual design and responsive styling.
- The site uses a single student-facing page. The assignment list is rendered on that page; clicking an assignment opens it, clicking it again collapses it.
- The assignment currently open is tracked in page state.

### Authentication and data

- The browser creates a Supabase client using:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Login is verified by the Supabase Edge Function `student-login`.
- On successful login, the returned Supabase session is set in the browser.
- Existing published assignments are loaded from the Supabase `homework` table, filtered to `published = true`, newest first.
- Student answers and crossed-out word-bank entries are currently saved in the student's browser using `localStorage`. They are not a cross-device submission system.
- The Telegram action prepares a message addressed to Ksenia. Do not claim that answers are stored centrally unless that functionality is actually implemented and tested.

### Important current implementation detail

Kate's assignment dated **21.11 — Everyday life & communication** is currently defined as a static object in `app/page.tsx` (`KATE_NOV_21_HOMEWORK`). The page adds it to the loaded homework list for a student whose name is Kate, without duplicating it if the same ID is already in the database.

Older published assignments, including **18.11 — Films, feelings & should have + V3**, are loaded from Supabase. The 18.11 Word Snake is a special component rendered for that assignment ID.

This is the current arrangement, not a general-purpose teacher publishing tool. When adding another static assignment, preserve the existing data-loading behaviour and use a unique ID. Do not replace the database assignments with a hardcoded list.

### Security

- Never commit `.env.local`.
- Never put a Supabase service-role key in client code, a `NEXT_PUBLIC_*` variable, GitHub, or a message.
- Keep the existing student-login and database access protections.
- Do not reintroduce a teacher dashboard or request extra secret keys as a shortcut.

## 3. Visual design — what the website should look like

The visual direction is clean, quiet, modern, and minimal: a learning workspace, not a noisy game or a generic school worksheet.

- White / light background, restrained neutral palette, dark readable text.
- Typography uses Inter and Space Grotesk.
- Clear hierarchy, generous but controlled spacing, softly rounded homework cards and word-bank chips.
- Do not show a separator line above **ALL HOMEWORK**; preserve the large vertical gap above the homework list.
- The word-bank container itself is white with a dashed outline around its edge.
- Brand header at the top: **e. ENGLISH WITH KSENIA**.
- Student login: simple name field, personal-code field, and one clear **Enter my space** action.
- Signed-in view: a short **Welcome, Kate.** greeting (capitalise the student's name), a sign-out action, then the homework list.
- Do not add a slogan or explanatory subtitle below Welcome. In particular, do not restore “Your homework, all in one place. Take it one task at a time.”
- Keep the large gap between Welcome and **ALL HOMEWORK**, including the extra top spacing above the homework list. The spacing is intentional; remove only the horizontal separator line between these areas.
- Homework titles show their date and topic, e.g. **21.11 · Everyday life & communication**.
- Clicking a homework row expands/collapses that assignment. The open/closed state is indicated with a plus/minus.
- Exercise text must be comfortably large and readable on desktop and mobile.
- Exercise corners and word-bank corners should be rounded. Keep the page responsive; on narrow screens, stack question text and answer fields cleanly.

Avoid adding decorative blank lines, unnecessary explanatory text, or extra interface controls without a clear learning purpose.

## 4. Homework creation workflow

When Ksenia sends a board screenshot, vocabulary list, or lesson notes:

1. Identify the lesson date, level, topic, target vocabulary, and grammar. Use only material supported by the lesson source; do not invent unrelated vocabulary.
2. Create **3–4 varied exercise types** for the new homework. Rotate formats between lessons so the work does not feel repetitive.
3. Choose formats appropriate to the student's level and lesson content.
4. Write natural, unambiguous instructions and sentences. Check grammar, spelling, collocations, and answer keys.
5. Number every question continuously from the first exercise to the final exercise. Do not restart numbering at 1 in each exercise.
6. Add the new assignment to the existing student page and make it openable/collapsible.
7. Preserve every older assignment and its content, styling, special interactions, and numbering.
8. Commit changes to the existing GitHub repository and allow Vercel to deploy.
9. Tell Ksenia exactly what changed and ask her to test after Vercel reports **Ready**. Do not claim deployment or testing succeeded until confirmed.

### Exercise formats to rotate

Use a suitable mix from this library:

- Gap fill / sentence completion
- Word formation
- Key word transformations
- Sentence rewriting
- Error correction
- Word order
- Matching
- Translation
- Word Snake
- Crossword (only when it genuinely suits the material)
- Short guided writing

Use 3–4 formats per ordinary homework unless Ksenia asks for a particular structure. Rotate the formats, not the lesson content. Avoid using two exercises that test exactly the same thing in slightly different wording.

### Exercise-writing rules

- **Gap fill:** the student types only the missing word or phrase directly into a visible blank inside the sentence. It should look like a fillable gap, not a separate full-width “Your answer” field below the sentence. A word bank may be provided where useful.
- **Word bank:** show selectable/cross-off-able word chips when the exercise needs a bank. Keep the bank visually distinct and rounded.
- **Matching:** use a clear dropdown for each item, with the options visible and easy to distinguish.
- **Sentence completion / rewriting:** do not reveal the target word or answer in a “Use:” placeholder or an explicit cue unless Ksenia specifically asks for hints. Do not add “Use:” tips to these exercise types by default.
- **Error correction:** each sentence should contain one clear, level-appropriate mistake. Ask the student to rewrite the full sentence correctly.
- **Instructions:** concise and student-facing. Do not repeat the same instruction unnecessarily.
- **Writing:** give a clear task and an appropriate target length only when useful.
- **Word Snake:** keep the interactive letter-selection behaviour, answer gaps, and whole-assignment numbering when included.
- Do not add a generic “Your answer” placeholder to answer fields.

### Continuous numbering

Question numbers must run through the entire homework, not restart at the beginning of each exercise. For example, if exercise 1 has 9 questions and exercise 2 has 5, exercise 2 begins at 10. Any final Word Snake or other special activity continues from the next number. The 18.11 homework is the reference for this behaviour.

## 5. Current homework examples and protected content

### 18.11 — Films, feelings & should have + V3

- This is an existing published assignment in Supabase.
- Its title should display with the date: **18.11 · Films, feelings & should have + V3**.
- It has a special Word Snake as a further numbered task.
- Preserve its existing exercises and Word Snake. Do not alter it unless Ksenia explicitly requests a change.
- Word Snake uses the existing word set and expressions in the code. Do not replace or remove it when editing another assignment.

### 21.11 — Everyday life & communication (Kate)

- Student: Kate (show her name as **Kate**, with a capital K).
- Level: B1.
- Current title: **21.11 · Everyday life & communication**.
- Content is based on the vocabulary supplied by Ksenia for the 21.11 lesson.
- Five exercises are currently included: gap fill, matching, sentence completion, rewriting, and error correction.
- The final **Correct the mistakes** exercise has one error per sentence and asks the student to rewrite each sentence correctly.
- The sentence-completion and rewriting tasks should not show “Use:” hints.
- Exercise 1 uses inline fillable gaps.
- Do not change this assignment unless Ksenia asks.

## 6. Controls and student experience

The assignment-level controls currently include:

- **Check** — triggers checking for the special Word Snake component. Do not imply every ordinary exercise is automatically graded unless that has been implemented.
- **Save** — saves the current answers in this browser.
- **Reset** — clears the current assignment's answers and resets its interactive activity.
- **Send to Ksenia in Telegram** — prepares a Telegram message with the assignment and entered answers.

Draft answers for ordinary questions are also persisted in local browser storage. This is device/browser-specific; students should not be told that drafts synchronise between devices.

Do not add separate Check/Reset buttons inside each exercise. Keep the assignment-level controls together.

## 7. Development and deployment workflow

Repository: `kvafanasyeva-cloud/english-with-ksenia`, branch `main`.

- Make changes directly in the existing repository.
- Before editing a file, fetch its latest version and current Git blob SHA.
- Make the smallest targeted change possible.
- Never overwrite the whole page or stylesheet with a simplified replacement.
- Keep existing homework IDs stable. New assignments need unique, descriptive IDs.
- Check TypeScript/JSX syntax and review the changed code before committing.
- GitHub commits to `main` trigger the connected Vercel deployment automatically.
- Wait for Vercel's deployment status to show **Ready** before asking Ksenia to test.
- If Vercel reports a build error, use the actual log to diagnose and fix it; do not ask Ksenia to guess at code changes.

Useful local commands, if a local checkout is being used:

```bash
npm install
npm run dev
npm run build
npm run lint
```

The project uses Next.js App Router. Main files:
- `app/page.tsx` — student experience and homework data/rendering
- `app/globals.css` — visual styling
- `package.json` — scripts and dependencies

## 8. Testing checklist before calling a homework update finished

- [ ] Existing assignments are still present and unchanged.
- [ ] The correct student sees the new assignment; other students do not see a student-specific static assignment.
- [ ] Student name is displayed with normal capitalisation (e.g. Kate).
- [ ] Assignment expands and collapses correctly.
- [ ] Date and topic are correct.
- [ ] Exercise instructions contain no unwanted hints or “Use:” cues.
- [ ] Gap-fill answers are entered in the sentence blanks.
- [ ] Every exercise has readable text and usable answer fields.
- [ ] Numbering continues across all exercises and special activities.
- [ ] Word Snake / crossword interactions still work when included.
- [ ] Save and Reset work for the whole assignment.
- [ ] Telegram handoff includes the entered answers.
- [ ] The large gap above ALL HOMEWORK remains, with no separator line above the list.
- [ ] The word bank has a white background and dashed outline.
- [ ] Mobile layout remains usable.
- [ ] Vercel deployment is **Ready**.

If browser testing is not available, say so clearly and ask Ksenia to verify the relevant part. Never claim that a feature has been tested when it has only been edited.

## 9. Communication style when working with Ksenia

- Be warm, direct, and practical.
- Give one clear next step at a time when she needs to interact with Vercel or the site.
- Make code and repository changes directly whenever the connected tools allow it; do not ask her to manually edit source code.
- Avoid long technical explanations unless she asks.
- Report exactly what changed, what commit was made, and whether deployment is confirmed or still pending.
- Do not ask her to repeat information already available in the project or conversation.
- Do not introduce extra infrastructure, dashboards, credentials, or complicated workflows when a small change to the existing page will do.

---

**Core rule:** keep the existing student portal stable, make new homework from Ksenia's actual lesson material, preserve all published work, and make the student experience clear, readable, and easy to use.
