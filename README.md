# English with Ksenia

A reusable English homework portal for students and a private teaching workspace for Ksenia.

**Production site:** https://english-with-ksenia.vercel.app  
**Teacher area:** https://english-with-ksenia.vercel.app/teacher

## Product overview

Students sign in with their name and personal access code. They see only published homework assigned to their account, complete exercises in the browser, and can check their work and send the result to Ksenia through Telegram.

The teacher area groups homework by student. Selecting an assignment opens it below the list and scrolls to the full interactive preview.

## Student experience

- Name-and-code login. Name and code comparison is case-insensitive.
- A list of published assignments, with each assignment opening as a complete homework card.
- Typed answers for gap-fill, sentence completion, rewriting and error correction.
- Meaning selection for matching exercises.
- Clickable word-bank words that can be crossed out.
- A word-snake activity with selectable letter ranges and answer fields.
- Automatic grading through the Supabase `grade_homework` RPC.
- A score shown on the page and a Telegram message containing the homework date, score and wrong/empty item numbers.
- Answers and crossed-out word-bank choices are saved in the current browser's local storage.

The local save is browser-specific; it does not synchronize drafts between devices.

## Teacher experience

- Open `/teacher` and sign in to the teacher workspace.
- See students and their assignments grouped together.
- Select an assignment to scroll to its full-size interactive preview.
- Type into the same exercise types available on the student page.
- Use **Save** to keep a teacher preview draft in the current browser.
- Use **Check** to add a visual checked mark to an assignment. This teacher button is a review marker, not an answer-grading action. The marker is stored in local storage on that browser.

## Technical overview

- **Frontend:** Next.js App Router, React and TypeScript.
- **Styling:** shared stylesheet in `app/globals.css`; Space Grotesk for headings and Inter for body text.
- **Database and authentication:** Supabase.
- **Student sign-in:** Supabase Edge Function `student-login`.
- **Teacher data and sign-in:** Supabase Edge Function `teacher-dashboard`.
- **Homework grading:** Supabase Postgres RPC `grade_homework`.
- **Hosting:** Vercel, connected to the `main` branch of this repository.

Core data is managed in Supabase. The main application tables are `students`, `homework` and `submissions`. Homework content is stored as structured exercise data; the student page requests published homework.

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` in the project root:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Create a production build locally:

   ```bash
   npm run build
   ```

## Environment and security

- Configure the two public Supabase variables above in both local development and Vercel.
- Never commit `.env.local`, Supabase service-role keys, signing secrets, student access codes or other credentials.
- Never expose a service-role key through a `NEXT_PUBLIC_*` variable.
- Keep authorization and data access rules enforced by Supabase functions, database permissions and row-level security. Hiding a control in the frontend is not an access-control measure.
- Manage student names and access codes in the appropriate backend records; do not put them in this README or frontend source.

## Homework authoring rules

See [PROJECT_NOTES.md](./PROJECT_NOTES.md) for the fuller product specification and the content, layout and publishing conventions. The key rule is that published homework is treated as frozen: do not rewrite, reorder or otherwise change an existing published assignment unless Ksenia explicitly asks for that change.

## Project notes

- [PROJECT_NOTES.md](./PROJECT_NOTES.md) — product behaviour, UI requirements, exercise conventions, data flow and operational notes.
