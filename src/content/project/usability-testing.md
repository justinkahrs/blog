---
title: "Usability Testing: Sessions, Markdown Tasks, Real Feedback"
description: "A web app I built for my UX-designer wife to run structured tests with Markdown tasks, live results, and quick analysis"
pubDate: "March 3 2025"
heroImage: "../../assets/usability-testing.png"
github: "https://github.com/justinkahrs/usability-testing"
mainLink: "https://usability-testing-six.vercel.app/sessions"
---

I built this app for my wife, who is a UX designer. She needed a fast way to set up usability sessions, hand testers a clear set of tasks, and capture results without juggling spreadsheets and scattered notes. The goal was simple. Make testing feel lightweight for the facilitator and focused for the tester.
This is the story of what it does, why I chose this design, and how it works in practice.

## Why I built it

Most sessions start the same way. You have a scenario, a few tasks, and a short window to observe behavior. The process is repeatable but the tooling often gets in the way. I wanted a single place where we could load Markdown tasks, run sessions, capture pass or fail, add comments, and walk away with something we could act on.

## What it does

The app is a small but opinionated companion for moderated or unmoderated tests.

- Create and manage sessions
- Define tasks with Markdown files or write them inline
- Parse tasks into clean scenarios, steps, and success criteria
- Track each tester with pass or fail and comments
- Edit results in real time during a session
- View quick summaries to spot patterns
  The interface offers two ways to present tasks. A list for quick scanning and a carousel for focused, one-at-a-time guidance. The goal is to match the energy of the room and keep attention on the work, not the tool.

## Getting started

You only need Node.js. Then clone, install, and run.

```bash
git clone https://github.com/justinkahrs/usability-testing
cd usability-testing
npm install
npm run dev
```

Open http://localhost:3000 and you can create a session, attach tasks, and begin.

## How tasks work

Tasks start as Markdown. You write a brief scenario, list a few steps, and spell out success criteria. The app parses that content into structured records that are easy to navigate during a session. This makes prep simple. It also keeps the live view uncluttered for the tester.

Under the hood there is a task parser that extracts sections from Markdown and normalizes them for the UI. That means you can store your tasks in version control and reuse them later.

## Running a session

A typical flow looks like this.

1. Create a session and add tasks
2. Invite a tester or start a moderated run
3. Step through tasks in list or carousel view
4. Mark outcomes and add comments
5. Review results and identify issues

Outcomes are deliberately binary at the task level. Pass or fail. The comments carry the nuance so the data stays readable.

## Real time editing

Sessions evolve. Maybe a step needs clearer wording. Maybe a task should be split in two. You can update tasks and results during the run. Those changes show up immediately. This tight loop keeps the facilitator calm and the conversation moving.

## Interface choices

The UI aims to be calm and practical.

- Next.js gives a straightforward app structure and server routed APIs
- Material UI provides consistent components and a11y-friendly patterns
- React with TypeScript keeps data flows explicit and predictable

Two presentation modes help different testing styles. The list view is for prep and quick jumps. The carousel is for a clean, single-task focus when you are screen sharing or guiding a participant.

## Data at a glance

After a session, you want a fast sense of where people struggled. The app surfaces per-task outcomes and comments so you can scan for patterns. You can refine the notes, copy them into your report, and move on to fixes.

## Project structure

The code is split into a few simple areas.

```
/src/app        Pages and API routes
/src/components Reusable parts like Task Carousel and User Test Cards
/src/context    Providers for sessions and loading states
/src/utils      Markdown parsing and helpers
/public         Static assets and icons
```

Each part is small and easy to navigate. That was important because busy teams need tools that are quick to learn.

## Tech stack

The stack is light on purpose.

- Next.js for the application shell
- Material UI for components
- React and TypeScript for predictability
- UUID for stable identifiers

There is no database requirement for the basics. You can run it locally, try a few sessions, and decide how far you want to take it.

## Notes on facilitation

A tool cannot run a session for you. It can make the mechanics disappear so you can listen. A few things that helped us.

- Keep each task short and actionable
- State success in plain language
- Capture exact quotes in comments
- Mark outcomes as you go
- Review immediately after the session while memory is fresh

## Closing

I built this for one person and then realized it might help many teams. If you run usability tests, this app gives you a clear flow. Load Markdown, run a session, capture outcomes, and review patterns. It is not meant to be everything. It is meant to be a solid base that gets out of the way so you can watch people use your product and learn fast.
