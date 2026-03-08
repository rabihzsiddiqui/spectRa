# spectRa — Project Instructions

## Brand

- Name: **spectRa** (capital R is intentional, preserve it in copy and JSX)
- Wordmark pattern: `spectRa<span className="text-emerald-500">.</span>`
- Accent color: `#10b981` (emerald-500 / emerald-600 for buttons)
- Tagline: color accessibility, grounded in vision science

## Design System

### Stack
- Next.js 16 (App Router)
- TypeScript (strict)
- Tailwind CSS v4
- Geist font via `next/font/google`

### Colors
| Role            | Value                         |
|-----------------|-------------------------------|
| Background      | `bg-neutral-950` / `#0a0a0a` |
| Card bg         | `bg-neutral-800/50`           |
| Border          | `border-neutral-700/50`       |
| Primary text    | `text-white` / `#fafafa`      |
| Secondary text  | `text-neutral-400`            |
| Muted text      | `text-neutral-500`            |
| Accent          | `text-emerald-500` / `#10b981`|
| Accent button   | `bg-emerald-600 hover:bg-emerald-500` |

Dark mode is hard-coded via `<html class="dark">`. Do not use media queries for dark mode.

### Typography
| Role           | Classes                                          |
|----------------|--------------------------------------------------|
| Hero           | `text-5xl md:text-7xl font-bold leading-[1.1]`  |
| Section heading| `text-3xl md:text-4xl font-bold text-white`     |
| Card title     | `text-lg font-semibold text-white`               |
| Body           | `text-base text-neutral-400 leading-relaxed`     |
| Small label    | `text-xs font-medium text-neutral-400`           |

### Components

**Navbar**
- Fixed top, `bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80`
- Nav links: `text-sm text-neutral-400 hover:text-white transition-colors duration-200`

**Cards**
- `bg-neutral-800/50 border border-neutral-700/50 rounded-xl p-6`
- Hover: `hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300`

**Buttons — Primary**
- `px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 hover:scale-105 text-white font-medium text-sm transition-all duration-200`

**Buttons — Secondary**
- `px-6 py-3 rounded-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 text-sm font-medium transition-all duration-200`

## Brand Voice

- lowercase by default in all user-facing copy
- clear, concise, modern but not slang-heavy
- slightly conversational
- no emojis, no hype language, no exclamation spam, no em dashes
- no corporate jargon

## Coding Conventions

- TypeScript strict mode (no `any`, explicit types)
- Functional components only
- Named exports for all components (`export function Foo` or `export default function Foo`)
- No default export for non-page files — prefer named exports in `/components`
- File structure:
  - `/app` — routes and layouts (App Router)
  - `/components` — shared UI components
  - `/lib` — utilities, helpers, vision science calculations
  - `/types` — shared TypeScript types

## Core Features (planned)

1. Contrast checker (WCAG AA / AAA)
2. Color vision deficiency simulator (deuteranopia, protanopia, tritanopia, achromatopsia)
3. Palette builder with accessibility scoring
4. Named color lookup

All computation must be client-side. No server calls for color analysis. No file uploads. No tracking.

## Layout

- `<html class="dark">` always
- `bg-neutral-950 text-white min-h-screen flex flex-col` on `<body>`
- Header: fixed, 56px tall (`h-14`)
- Main: `flex-1`, padded top by `pt-14` on sections to clear fixed header
- Footer: `border-t border-neutral-800/80 py-6`
- Max content width: `max-w-5xl mx-auto px-6`
