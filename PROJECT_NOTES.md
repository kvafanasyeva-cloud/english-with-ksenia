# Project Notes — English with Ksenia

_Last reviewed: 24 November 2026_

This file records the current product behaviour and the decisions that should guide future changes. It is intended to prevent regressions and repeated setup work.

## 1. Product purpose

English with Ksenia is one permanent homework website. Ksenia publishes assignments once; students use their own login to return to the same link and see the homework published for them.

- **Student site:** https://english-with-ksenia.vercel.app
- **Teacher area:** https://english-with-ksenia.vercel.app/teacher
- **GitHub repository:** `kvafanasyeva-cloud/english-with-ksenia`
- **Production hosting:** Vercel, deployed automatically from `main`

Adding a new assignment to Supabase should not require changing the website code or redeploying the site. Code changes to the application are deployed through the GitHub-to-Vercel connection.

## 2. Technology and application structure

- Next.js App Router
- React and TypeScript
- Supabase database, authentication, Edge Functions and grading RPC
- Vercel production hosting
- Inter for body text and Space Grotesk for headings

Key files:

| File | Responsibility |
| --- | --- |
| `app/page.tsx` | Student login, published homework list, student exercise rendering, answer saving, grading and Telegram link |
| `app/teacher/page.tsx` | Teacher login, student/homework overview, expandable homework preview and teacher-side controls |
| `app/globals.css` | Shared student and teacher layout, typography, exercise styling and responsive rules |
| `app/api/teacher/*` | Server routes used by the teacher area |
| `README.md` | Setup and deployment overview |
| `PROJECT_NOTES.md` | Product requirements and implementation decisions |

The student and teacher pages currently render their own exercise JSX. They share CSS classes and are designed to look alike, but they are not yet one shared React exercise component. When changing an exercise layout, check both pages.

## 3. Accounts and access

### Students

- Students enter their name and personal access code on the main page.
- Name and code matching should be case-insensitive.
- Student login is verified by the Supabase Edge Function `student-login`.
- On successful login, the browser establishes a Supabase session and loads homework published for that student.
- Student names and access codes belong in backend records, not in this documentation or hard-coded frontend lists.

### Teacher

- The teacher workspace is at `/teacher`.
- The username field is fixed to `k`; the entered code is sent to the Supabase Edge Function `teacher-dashboard` for verification and data retrieval.
- Keep the actual teacher access code out of source files and documentation.
- The student login page should not grow a visible teacher-login link unless Ksenia explicitly asks for one.

## 4. Supabase data and homework flow

The main data entities are:

- `students` — student records and account information.
- `homework` — assignment title, description, exercise data, student association and publication status.
- `submissions` — student submission records.

The student page queries homework where `published = true`. Homework content is stored as structured exercise data (including the exercise type, title, instructions and items).

The student login function is `student-login`. The teacher dashboard function is `teacher-dashboard`. Automatic student grading is performed through the Postgres RPC `grade_homework`, which returns a score, total item count and the numbers of wrong or empty answers.

### Important implementation notes

- Kate's 21 November B1 assignment currently has a fallback definition in both `app/page.tsx` and `app/teacher/page.tsx`. The two copies must stay in sync while this fallback exists. Prefer the Supabase homework record as the canonical source when maintaining that assignment.
- The student page filters out a legacy 18 November homework record that Ksenia asked to hide. Do not restore it unless requested.
- Do not include service-role credentials or other private keys in frontend code, Git history, Markdown files or `NEXT_PUBLIC_*` variables.
- Supabase access rules must be enforced in Supabase itself. A hidden frontend control is not security.

## 5. Student experience

1. A student opens the permanent site link and signs in with their name and code.
2. The student sees the published assignments for their account.
3. Selecting an assignment opens the homework card.
4. The student enters answers in the exercises. Word-bank words can be crossed out.
5. Answers and word-bank selections are automatically saved to local storage in the current browser.
6. **Check** calls the grading RPC and displays the score.
7. **Send to Ksenia in Telegram** opens a prefilled message addressed to `afanasyeva_x`.

The Telegram message format is:

```text
Homework - [date]
Score: [score] / [total]
Wrong or empty: [item numbers, or none]
```

The page should show the score, not a list of incorrect item numbers. The wrong/empty item numbers belong in the Telegram message for Ksenia.

### Saving limitation

Student drafts are stored in the browser's local storage. They remain available in that browser on that device; they do not synchronize across browsers or devices. The visible **Save** button also saves the current draft locally.

## 6. Teacher experience

- The teacher page shows students and their homework grouped by student.
- Clicking a homework entry opens the full assignment underneath the list and scrolls directly to it.
- The opened assignment should follow the student page's visual layout and use the same exercise font sizes, numbering, spacing and input styles.
- The teacher can type into the preview fields and save a teacher-side draft to local storage.
- The teacher **Check** button is a review marker only. It adds a simple tick to the homework title and changes the button label to `Checked ✓`. It must not try to grade teacher-entered answers or show an “invalid answers” popup.

### Teacher check-mark limitation

The checked state is stored under `teacher-homework-checks` in local storage. It is remembered in the current browser only. It is not persisted in Supabase and does not synchronize to another device.

## 7. Exercise types and content conventions

The exercise data supports prompts and answer items, optional word banks, matching options and word-snake content.

### Exercise behaviour

- **Gap fill / sentence completion:** students type into answer fields. When a word bank is present, its words can be crossed out; the answer field is visually an underline rather than a large boxed field.
- **Matching:** exactly five pairs/items when this type is used. Students choose a meaning from a dropdown.
- **Writing / rewriting / error correction:** students type the corrected or rewritten answer. These are not multiple-choice tasks.
- **Word snake:** students identify words or phrases by selecting the first and last letters, then complete the related sentence prompts in input fields.

### Authoring rules for new homework

- Use typed answers for productive tasks; do not turn writing tasks into multiple choice.
- Matching is the exception and uses the meaning dropdown.
- Use exactly five items for a matching exercise.
- Use exactly five items for a “Correct the mistakes” exercise.
- Keep word snakes to five to seven target words or phrases, shuffled in the letter chain.
- Do not display a separate list of snake answers above the snake. In particular, do not reintroduce a flattened “Words and phrases to find” heading/list.
- Keep a model example outside the scored question list. Do not repeat the example sentence as one of the exercise questions.
- Avoid ambiguous gap sentences and prompts with multiple equally plausible answers unless the answer key accepts all natural alternatives.
- Do not put hints, tips or explanations inside the task prompt unless Ksenia asks for them.
- Number every scored item in one continuous sequence from the first task through the final word-snake item.
- Keep the requested number of items. Do not silently add or remove questions.
- Do not add crossword exercises; the current preferred exercise set does not include a crossword.

## 8. Visual and interaction requirements

The design is intentionally restrained, monochrome and readable.

### Overall layout

- White background, black text and muted grey secondary text.
- Maximum content width: approximately 980px.
- Space Grotesk for headings; Inter for body text and controls.
- Homework cards have rounded corners.
- Word-bank containers have rounded corners and a dashed outline.
- Responsive layout: prompts and answer fields stack on narrow screens.

### Exercise typography

- All exercise body copy uses one consistent **17px** font size: instructions, question prompts, inline-gap sentences, word-bank labels/words, word-snake instructions/example, snake sentences, numbers and answer fields.
- Exercise titles remain larger to preserve hierarchy (currently 21px).
- Exercise prompt text should be regular weight rather than bold.
- Task numbers are muted grey and aligned on one shared left column. The word-snake numbers must line up with the numbers in the earlier exercises.
- Keep line spacing consistent across exercise prompts.

### Student page details

- Do not show a student directory.
- Do not show a teacher-login link on the student page.
- Avoid extra helper copy such as “Your draft answers are saved on this device” or “Your answer”.
- Keep the **Check**, **Save**, **Reset** and Telegram action area once, near the bottom of the homework card.
- Align the score to the right.
- Use a simple black checkmark where a checkmark is needed.
- Keep the homework title and its top separator comfortably spaced.

### Teacher page details

- No separate “students folder” interaction; use the student-name grouping and homework list.
- Do not add marketing slogans to the teacher area.
- Clicking a homework row should scroll to the expanded assignment.
- The expanded teacher assignment should look like the student assignment, including the exercise numbering and typography.

## 9. Published homework change policy

Published homework is frozen.

- Do not rewrite, reorder, restyle individual questions in, or otherwise alter an existing published lesson unless Ksenia explicitly requests it.
- Apply content updates to new homework only.
- If a technical change is needed to the shared renderer or styles, preserve the published assignment's text, order, numbering and answer key.
- If an assignment must be removed or hidden, confirm the specific assignment and change only its publication/visibility as requested.

## 10. Operational workflow

### Adding homework

1. Create the new homework record and exercise data in Supabase.
2. Associate it with the intended student.
3. Check the exercise order, item counts, continuous numbering and answer key.
4. Set `published = true` when it is ready.
5. Confirm that it appears in that student's account and in the teacher overview.

A database-only homework addition should not require a GitHub commit or Vercel redeployment.

### Changing application code

1. Fetch the latest version of the relevant files from `main`.
2. Make the smallest change that satisfies the request.
3. Preserve published homework data and unrelated behaviour.
4. Commit to `main`; Vercel automatically creates a production deployment.
5. Verify that the deployment is **READY** and that the student and teacher routes respond successfully before saying the change is live.

Useful checks:

- `https://english-with-ksenia.vercel.app/`
- `https://english-with-ksenia.vercel.app/teacher`

### Local setup

Required public environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Commands:

```bash
npm install
npm run dev
npm run build
```

Never paste or commit real environment values into project notes.

## 11. Known limitations to keep in mind

- Student answer drafts are local to the student's browser/device.
- Teacher preview drafts are local to the teacher's browser/device.
- Teacher checked markers are local to the teacher's browser/device.
- The student and teacher views currently have separate JSX renderers; keep their shared styling in sync.
- Kate's 21 November fallback homework is duplicated in the two page files.
- The old 18 November assignment is hidden in the student page through an ID-based filter.

Update this document when a product decision or implementation detail changes, so it remains the single useful reference for future maintenance.
