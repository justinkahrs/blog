---
title: "RCS Tech Demo for Amastay AI"
description: "Where we're going, we won't need apps"
pubDate: "Apr 18 2025"
heroImage: "../../assets/amastay.png"
github: "https://github.com/justinkahrs/on-device-demo"
mainLink: "https://demo.amastay.ai"
---

# Amastay Demo Deep Dive

This post walks through the Amastay on-device conversation demo. The goal is to show how RCS-style messaging can guide a guest through their stay using messages, quick replies, rich cards, and a clean phone shell. The experience simulates a chat among a guest, a concierge bot, and the host, all within a browser.

## What The Demo Shows

- Scripted messaging sequences that feel natural
- Actionable UI with quick replies
- Rich cards that open deep links like Apple Maps or an in-app house rules page
- A simulated Apple Pay and Wallet flow for fast transactions
- A phone-like container that feels close to a verified business chat client

## How It Works

The demo is built with Next.js 15, React 19, and TypeScript. Messaging is assembled in `src/app/messages.tsx`, which contains nodes for text and custom components. Some messages pause until the user taps a button, while others auto play to build a smooth narrative.
In the flow, you can:

1. Receive a welcome message
2. Open directions
3. Read house rules
4. Complete upsells
5. Escalate to the owner
   Quick replies and typing indicators make the chat feel responsive. The demo keeps the pacing with configurable timing so you can adjust how it feels to your audience.

## UI Pieces

- **PhoneContainer** is a browser shell styled to look like a real chat client
- **RichLink** opens map links, calendar intents, and local pages
- **AppleButton** opens a temporary sheet for payments before returning to the chat
- CSS Modules and global styles define the layout
- Framer Motion adds button feedback
- MUI Icons add visual clarity
  The house rules page lives separately and renders Markdown from `public/HouseRules.md`. This keeps content in a simple place for non engineers to adjust.

## Changing The Story

You can edit `messages.tsx` to add or remove conversations. Extend the journey by inserting new scenarios, adding new components, and swapping out quick replies. You can also change metadata, such as names or addresses, through the message components or the `GuestName` component.
If you want to adjust pacing, open `src/context/ChatContext.tsx` and change timing values. You can also tweak when the flow restarts.

## Deploying

Deployment is simple. Build with `npm run build` and serve with `npm run start`. Because it pulls from static assets and client scripts, it can run on a full server or be embedded in marketing pages. Platforms like Vercel, Netlify, and Render are supported.

## Final Thoughts

This demo highlights how messaging can guide users through complex steps without a heavy app install. It blends plain text, rich components, and payment flows within a single guided chat. It is a great starting point if you want to build a branded, interactive messaging journey for travelers or guests.
