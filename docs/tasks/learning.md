# Learning: students, questions, rewards, Nova, content, children

See README.md for priorities, statuses and how Ess works with Claude Code.

## E. Student pages and states

Items E5–E11 come from docs/ux-audit.md ("Still open").

| ID  | Task                                                                                                                                                                                                                     | Who  | Pri | Status | Needs  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- | --- | ------ | ------ |
| E1  | Teacher pages polish: «مسوداتي», draft preview, notes panel, consent screen                                                                                                                                              | Ess  | P0  | Todo   | —      |
| E2  | Home dashboard: continue card, today's goal, streak, my courses                                                                                                                                                          | Both | P1  | Todo   | R1, R2 |
| E3  | Loading states: library, course and lesson skeletons; lesson and board loading; Nova connecting                                                                                                                          | Ess  | P1  | Todo   | —      |
| E4  | Error, offline and 404 states with a retry; empty states on every list (retry and empty states on the library; offline and 404 later)                                                                                    | Ess  | P1  | Doing  | —      |
| E5  | Library cards: art per subject, remove filler label, real counts                                                                                                                                                         | Ess  | P1  | Todo   | —      |
| E6  | Curriculum page: hero repeats the first item, long card list, double «قريبًا»                                                                                                                                            | Ess  | P1  | Todo   | —      |
| E7  | Classroom header: misleading «الدروس»/«المكتبة» labels, dead «مساحة الدرس» pill                                                                                                                                          | Ess  | P1  | Todo   | —      |
| E8  | One digit system across the app (Western suggested, suits maths)                                                                                                                                                         | Ess  | P1  | Todo   | —      |
| E9  | Review wording students should not see («نسخة للمراجعة»)                                                                                                                                                                 | Ess  | P1  | Todo   | —      |
| E10 | Lesson completion screen: goals reached, next lesson, Nova practice, a small celebration                                                                                                                                 | Ess  | P1  | Todo   | —      |
| E11 | Recorded-lesson start state (blank board, small Play)                                                                                                                                                                    | Ess  | P2  | Todo   | —      |
| E12 | Recorded-lesson progress: Ess designs steps/numbers, Owner builds it in the runtime                                                                                                                                      | Both | P2  | Todo   | K3     |
| E13 | Profile and settings: name, password, language, Nova wake word, reminders (`?settings` has name, password, lesson and Nova settings) (name, password, lesson and Nova settings; language, wake word and reminders later) | Both | P1  | Done   | —      |
| E14 | First-time onboarding: grade, subjects, language, then a short tour                                                                                                                                                      | Both | P2  | Todo   | —      |
| E15 | Accessibility: contrast, focus rings, keyboard, screen reader labels                                                                                                                                                     | Ess  | P2  | Todo   | —      |
| E16 | English interface for the whole app                                                                                                                                                                                      | Both | P2  | Todo   | —      |
| E17 | Real-phone tests: iPhone Safari and Android, Nova voice, hands-free; report with videos                                                                                                                                  | Ess  | P1  | Todo   | —      |
| E18 | Installable app: icon, splash, offline page                                                                                                                                                                              | Both | P2  | Todo   | B2, D7 |
| E19 | Explore page: search and filter courses by grade, subject and language                                                                                                                                                   | Both | P2  | Todo   | M2     |
| E20 | Dark mode                                                                                                                                                                                                                | Ess  | P3  | Idea   | B2     |
| E21 | Design system: tokens, shared parts, `?preview=ui`; screens and questions built from them (docs/design-system.md)                                                                                                        | Both | P1  | Done   | —      |

## Q. Questions and exams

Reading lessons today have choice, written, choice-and-written and board questions.

| ID  | Task                                                                                                        | Who   | Pri | Status | Needs   |
| --- | ----------------------------------------------------------------------------------------------------------- | ----- | --- | ------ | ------- |
| Q1  | More question types: multi-select, true/false, number with unit and tolerance, order, match, fill blank     | Owner | P2  | Todo   | —       |
| Q2  | Screens for each new type (Ess designs; built in the runtime)                                               | Both  | P2  | Todo   | Q1      |
| Q3  | Maths answer input: fractions, powers, roots                                                                | Both  | P2  | Todo   | Q1      |
| Q4  | Hints and worked solutions per question                                                                     | Both  | P2  | Todo   | —       |
| Q5  | Question bank per course, each question tied to lesson goals; MCP tools to add and edit questions           | Owner | P2  | Todo   | A5      |
| Q6  | Exams from the bank: per goal, optional timer, attempts, shuffled; MCP tool so the teacher's AI writes them | Owner | P2  | Todo   | Q5      |
| Q7  | Exam player screens: start, question, review, submit                                                        | Both  | P2  | Todo   | Q6      |
| Q8  | Result page: mastery per goal, answers reviewed, what to study next                                         | Both  | P2  | Todo   | Q6      |
| Q12 | One look for questions on the tokens; choice answers graded by our code; number keys pick a choice          | Owner | P1  | Done   | —       |
| Q9  | Written answers: self-check against a model answer, or AI grading (D4)                                      | Owner | P2  | Todo   | D4      |
| Q10 | Teacher view of results per student and class                                                               | Both  | P3  | Todo   | Q6, T3  |
| Q11 | Daily review of missed questions (spaced repetition)                                                        | Both  | P3  | Todo   | Q5      |
| Q12 | Nova practice drawn from the question bank instead of generated (lower cost)                                | Owner | P3  | Todo   | Q5      |
| Q13 | Course certificate after passing its exam                                                                   | Both  | P3  | Todo   | Q6, R10 |

## R. Streaks and rewards

docs/design-system.md: no reward or progress counter is shown until it is saved for real.

| ID  | Task                                                                              | Who   | Pri | Status | Needs       |
| --- | --------------------------------------------------------------------------------- | ----- | --- | ------ | ----------- |
| R1  | Streak: what counts as a study day, time zones, a freeze; saved on the server     | Owner | P1  | Todo   | —           |
| R2  | Daily goal: steps or minutes a day, chosen by the student                         | Both  | P1  | Todo   | R1          |
| R3  | Points for steps, answers and finished lessons                                    | Both  | P2  | Idea   | D3          |
| R4  | Badges and achievements                                                           | Both  | P3  | Idea   | D3          |
| R5  | Mastery rings per course and goal                                                 | Both  | P2  | Todo   | —           |
| R6  | Reminders by email and push ("keep your streak")                                  | Owner | P2  | Todo   | R1, B6, E18 |
| R7  | Weekly summary email for students and parents                                     | Owner | P2  | Todo   | B6          |
| R8  | Class leaderboard only (never public)                                             | Both  | P3  | Idea   | D3, T3      |
| R9  | Streak, goal and celebration designs (animations, empty and broken-streak states) | Ess   | P1  | Todo   | R1          |
| R10 | Certificates: page and share image                                                | Both  | P3  | Todo   | —           |

## N. Nova

| ID  | Task                                                                              | Who   | Pri | Status | Needs |
| --- | --------------------------------------------------------------------------------- | ----- | --- | ------ | ----- |
| N1  | Nova moves the board's values while explaining (G1)                               | Owner | P2  | Todo   | —     |
| N2  | Nova points at and highlights parts of the board                                  | Owner | P3  | Idea   | N1    |
| N3  | Nova remembers what a student found hard across lessons (privacy rules first)     | Owner | P3  | Idea   | L1    |
| N4  | Voice and language choice per learner                                             | Both  | P3  | Todo   | E13   |
| N5  | Explain-it-back: the student explains by voice, Nova responds                     | Owner | P3  | Idea   | —     |
| N6  | Nova's speaking, listening and thinking states, designed for voice and hands-free | Ess   | P2  | Todo   | —     |

## K. Content

| ID  | Task                                                                                        | Who   | Pri | Status | Needs |
| --- | ------------------------------------------------------------------------------------------- | ----- | --- | ------ | ----- |
| K1  | Launch more curricula with docs/launch-curriculum.md (maths, chemistry, physics, AI course) | Owner | P1  | Doing  | A6    |
| K2  | Subject art and course covers for every live curriculum                                     | Ess   | P1  | Todo   | B2    |
| K3  | Audio for lessons: recorded lessons import, progress and resume, cues mapped to steps       | Owner | P2  | Todo   | —     |
| K4  | "Follow my source": lessons from the user's own notes (book-guided later)                   | Owner | P3  | Idea   | S6    |

## P. Parents and children

| ID  | Task                                                               | Who   | Pri | Status | Needs  |
| --- | ------------------------------------------------------------------ | ----- | --- | ------ | ------ |
| P1  | Parent account linked to child accounts                            | Owner | P3  | Todo   | D8     |
| P2  | Child theme: backgrounds, large rounded buttons                    | Ess   | P3  | Todo   | B2     |
| P3  | Path view of a curriculum, driven by saved progress                | Both  | P3  | Todo   | P2     |
| P4  | Original character that reacts to teach, ask, attempt and feedback | Ess   | P3  | Todo   | P2     |
| P5  | Stricter Nova instructions for children                            | Owner | P3  | Todo   | P1     |
| P6  | Parent dashboard and weekly report                                 | Both  | P3  | Todo   | P1, R7 |
| P7  | Review before any course appears in child mode                     | Owner | P3  | Todo   | X2     |
