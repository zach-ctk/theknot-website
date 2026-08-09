# Ralph Iteration: The Knot Website - Astro + Keystatic Migration

You are migrating The Knot climbing gym website from Next.js to Astro + Keystatic. Each iteration, complete ONE user story from the PRD.

## ⚠️ CRITICAL RULES - READ FIRST

1. **NO GENERATED CONTENT** - Copy exact content from existing Next.js pages
2. **DO NOT invent, paraphrase, or generate text** - Copy verbatim only
3. **Use Astro components (.astro) for static content**
4. **Use React islands (.tsx) ONLY for interactive elements** (modals, forms)
5. **Test with `npm run dev`** - page must return 200

## Step 1: Read Reference Documents

Before doing anything, read these documents:

1. `HANDOFF.md` - Full project context and setup
2. `keystatic.config.ts` - All content schemas
3. `scripts/ralph/prd.json` - User stories with acceptance criteria
4. `../website/src/app/[page]/page.tsx` - Source content to copy

## Project Context

**What we're building:** The Knot climbing gym website using Astro + Keystatic
- Migrate pages from existing Next.js site at `../website/`
- Content is editable via Keystatic admin at `/keystatic`
- Brand colors are CSS variables from Keystatic

**Tech Stack:**
- Astro 4+ with TypeScript
- Keystatic for CMS
- React for interactive islands only
- Tailwind CSS + CSS variables
- Images at `/public/images/`

## Step 2: Find Your Story

Read `scripts/ralph/prd.json` and find the **first story** where `passes: false`.

This is your story for this iteration. Implement ONLY this story.

## Step 3: Implement the Story

Complete ALL acceptance criteria for your story.

### Common Patterns

**Astro Page Structure:**
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Accordion from '../components/Accordion.astro';
---

<BaseLayout title="Page Title">
  <section class="hero-section">
    <h1>HEADLINE</h1>
  </section>
</BaseLayout>

<style>
  .hero-section {
    background: var(--color-rust);
  }
</style>
```

**React Island (for interactivity):**
```astro
---
import Modal from '../components/Modal.tsx';
---

<Modal client:load title="Title">
  Content here
</Modal>
```

**Brand Colors (CSS Variables):**
```css
var(--color-rust)        /* #B94237 */
var(--color-teal)        /* #84BABF */
var(--color-limestone)   /* #D0D96F */
var(--color-coral)       /* #C97065 */
var(--color-graphite)    /* #39393B */
var(--color-sand)        /* #FAF9F5 */
```

**Font Weights:**
- Headlines: font-weight: 900 (Black)
- Nav/Buttons: font-weight: 700 (Bold)
- Body: font-weight: 400 (Regular)

## Step 4: Verify

```bash
cd c:\World\TheKnot\astro-site
npm run dev
# Open http://127.0.0.1:4321/[page] and verify
# Check for 200 status and no console errors
```

## Step 5: Commit Your Work

```bash
git add -A
git commit -m "feat: [KNOT-XXX] - Story title

Migrated from Next.js to Astro
Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Step 6: Update PRD

Edit `scripts/ralph/prd.json`:
- Find your story by ID
- Change `"passes": false` to `"passes": true`

## Step 7: Log Progress

Append to `scripts/ralph/progress.txt`:

```
## [DATE] - KNOT-XXX: Story Title
- What was implemented
- Files created/modified
- **Learnings:**
  - Any issues encountered
---
```

## Step 8: Check for Completion

If ALL stories have `passes: true`, output:
```
<promise>COMPLETE</promise>
```

Otherwise, end your response and the next iteration will continue.

---

## Quick Reference

### Pages to Migrate

| Page | Source (Next.js) | Target (Astro) |
|------|-----------------|----------------|
| About | ../website/src/app/about/page.tsx | src/pages/about.astro |
| Membership | ../website/src/app/membership/page.tsx | src/pages/membership.astro |
| New Climbers | ../website/src/app/new-climber/page.tsx | src/pages/new-climber.astro |
| Amenities | ../website/src/app/amenities/page.tsx | src/pages/amenities.astro |
| Events | ../website/src/app/events/page.tsx | src/pages/events/index.astro |
| Shop | ../website/src/app/shop/page.tsx | src/pages/shop.astro |
| Classes | ../website/src/app/classes/page.tsx | src/pages/classes.astro |

### Existing Components

- `BaseLayout.astro` - Page wrapper
- `Header.astro` / `HeaderMobile.tsx` - Navigation
- `Footer.astro` - Footer
- `Accordion.astro` - Expandable sections
- `ThreeCardSection.astro` - 3-up card layout

### Image Locations

- `/images/canva-final/` - Photos and videos
- `/images/logos/` - Logo files
- Team images: `/images/canva-final/team-*.jpg`
- Videos: `/images/canva-final/*.mp4`
