# Presentation Screenshots: 0.2 Adoption Deck

This document maps each slide in the adoption deck to a screenshot and specifies which visuals need to be captured or updated before presenting.

## Screenshot gathering strategy

The current baseline screenshots in [tmp/screens](/Users/rafa/Desktop/plural-unit/tmp/screens) are presentation-safe but not presentation-strong. After the UI polish work described in [presentation-ui-handoff-0.2.md](/Users/rafa/Desktop/plural-unit/docs/presentation-ui-handoff-0.2.md), new screenshots will need to be captured.

**Timing:**
- Baseline screenshots exist now (use for reference and comparison)
- After UI polish is complete, re-capture using the same naming convention
- Store updated screenshots in [tmp/screens](/Users/rafa/Desktop/plural-unit/tmp/screens)

## Slide-to-screenshot mapping

### Slide 1: Cover

**Slide headline:**  
Plural Unit  
A simple coordination platform  
for organized communities

**Screenshot needed:**  
Home screen (desktop, dark mode preferred for presentations)

**Current baseline:**  
[home-volunteers-desktop.png](/Users/rafa/Desktop/plural-unit/tmp/screens/home-volunteers-desktop.png)

**What to improve in new capture:**
- The top fold should feel more intentionally composed
- The layout should look balanced, not just spacious
- The overall visual hierarchy should guide the eye to a clear focal point
- Consider whether a mobile version might work better for this cover slide (more self-contained, less empty space)

**Recommendation:**  
After UI polish, use either the desktop home screen (if composition improves significantly) or the mobile home screen (which reads better self-contained). Test both and pick the one that looks stronger in the deck.

---

### Slide 2: The Reality Today

**Slide headline:**  
Too many tools.  
Too much friction.  
Too much follow-up.

**Screenshot needed:**  
This is a text-heavy problem slide. A screenshot is optional here.

**Recommended approach:**
- Consider using no screenshot, or
- Use a subtle background or icon treatment instead of a literal product screenshot

**If you want a product screenshot:**  
Show the home screen with multiple sections visible to reinforce "too many places to look."

---

### Slide 3: The Gap

**Slide headline:**  
Community work is relational.  
The software usually isn't.

**Screenshot needed:**  
Optional. This is a positioning slide about the problem, not the product.

**Recommended approach:**
- Use no screenshot, or
- Use a conceptual visual rather than a literal product screen

---

### Slide 4: Our Approach

**Slide headline:**  
One friendly hub  
for the workflows communities use most

**Screenshot needed:**  
Home screen or hub overview

**Current baseline:**  
[home-volunteers-desktop.png](/Users/rafa/Desktop/plural-unit/tmp/screens/home-volunteers-desktop.png) or [home-volunteers-mobile.png](/Users/rafa/Desktop/plural-unit/tmp/screens/home-volunteers-mobile.png)

**What to improve in new capture:**
- The screen should clearly show multiple workflow sections (broadcasts, events, volunteers, etc.) in one place
- Should reinforce the "one hub" positioning
- Should feel friendly and easy to understand at a glance

**Recommendation:**  
After UI polish, use whichever version (desktop or mobile) has the strongest composition and best shows the breadth of features in one view.

---

### Slide 5: What the MVP Covers

**Slide headline:**  
Messages  
Events  
Volunteers  
Engagement

**Screenshot needed:**  
Home screen or hub overview showing all four workflow areas

**Current baseline:**  
[home-volunteers-desktop.png](/Users/rafa/Desktop/plural-unit/tmp/screens/home-volunteers-desktop.png)

**What to improve in new capture:**
- Should clearly show messages, events, volunteers, and engagement/activity sections
- Should feel balanced and intentional, not cluttered
- Icons or visual treatments for each section should be clearly visible

**Recommendation:**  
Use the same screen as Slide 4, or a slightly different scroll position if that shows the content more clearly. Consistency matters; try to use 1–2 hero screenshots repeated where they serve different narrative points.

---

### Slide 6: What Makes It Useful

**Slide headline:**  
Clear communication  
Better coordination  
Less admin overhead

**Screenshot needed:**  
One or more of: broadcasts view, events view, or volunteer coordinator dashboard

**Current baselines:**  
- [volunteers-desktop.png](/Users/rafa/Desktop/plural-unit/tmp/screens/volunteers-desktop.png) — coordinator dashboard
- [home-volunteers-desktop.png](/Users/rafa/Desktop/plural-unit/tmp/screens/home-volunteers-desktop.png) — home with all sections

**What to improve in new capture:**
- This slide should emphasize the operational clarity the product provides
- Consider showing the volunteer coordinator dashboard, which best demonstrates "better coordination"
- The dashboard should feel like a real operational tool, not just a list

**Recommendation:**  
Capture or re-capture the volunteer coordinator dashboard after UI polish. This is one of the strongest visual moments in the product and deserves a dedicated slide.

---

### Slide 7: Why We're Sharing It Now

**Slide headline:**  
We want real use.  
Real feedback.  
Real community partners.

**Screenshot needed:**  
Optional. This is a transition to the call-to-action and does not strictly need a product screenshot.

**Recommended approach:**
- Use no screenshot, or
- Use a subtle background treatment
- Keep focus on the message, not the visual

---

### Slide 8: How You Can Help

**Slide headline:**  
Try it  
Share it  
Shape it

**Screenshot needed:**  
Signup screen or onboarding flow (demonstrates ease of trying the product)

**Current baselines:**  
- [signup-desktop.png](/Users/rafa/Desktop/plural-unit/tmp/screens/signup-desktop.png) — public signup flow
- [signup-mobile.png](/Users/rafa/Desktop/plural-unit/tmp/screens/signup-mobile.png) — public signup on mobile

**What to improve in new capture:**
- The signup screen should look inviting and low-friction
- Should feel easy to get started
- Should reinforce that trying the product is simple and approachable

**Recommendation:**  
After UI polish, the signup screen should still feel welcoming. If the CTA and primary action hierarchy is strengthened, re-capture it. The mobile version may actually read better in a presentation than desktop.

---

## Screenshot checklist for final presentation prep

### To gather after UI polish is complete

- [ ] Home screen (desktop, dark mode)
- [ ] Home screen (mobile, dark mode) — optional backup
- [ ] Volunteer coordinator dashboard (desktop, dark mode)
- [ ] Signup flow (desktop or mobile, light mode for variety if it looks good)
- [ ] Check-in screen (desktop, dark mode) — optional additional context
- [ ] Activity feed or broadcasts section — optional

### Naming convention for new captures

After re-capturing, use the same filenames:
- `tmp/screens/home-volunteers-desktop.png`
- `tmp/screens/home-volunteers-mobile.png`
- `tmp/screens/volunteers-desktop.png`
- `tmp/screens/volunteers-mobile.png`
- `tmp/screens/signup-desktop.png`
- `tmp/screens/signup-mobile.png`
- `tmp/screens/signup-success-desktop.png`
- `tmp/screens/signup-success-mobile.png`
- `tmp/screens/checkin-desktop.png`
- `tmp/screens/checkin-mobile.png`

This preserves history and makes it easy to compare before and after.

## Comparison workflow

To validate improvements:

1. Keep a copy of the current baseline screenshots in a separate folder (e.g., `tmp/screens-baseline/`)
2. After UI polish, place new captures in `tmp/screens/` using the same filenames
3. Use your presentation software or image viewer to flip between old and new
4. Verify that the visual hierarchy, composition, and overall impact have improved

## Recommended core slides with visuals

If gathering all new screenshots takes time, prioritize these three:

1. **Slide 1 (Cover)** — home screen, improved composition
2. **Slide 4 or 5 (What the MVP Covers)** — home screen, same improved version
3. **Slide 6 (What Makes It Useful)** — volunteer coordinator dashboard

Those three alone will anchor the presentation visually and demonstrate the product's range.

## Notes for the presentation crew

- Avoid screenshots that include placeholder content or obviously generic fixture data.
- Prefer consistency: use the same 2–3 key screens repeated on different slides rather than many different screens.
- Test all screenshots in both light and dark mode within your presentation software to see which reads better.
- Consider whether to show mobile or desktop for each slide based on composition, not just habit. Mobile often works better for focused moments; desktop works better for showing breadth.
- Add subtle visual callouts or arrows in your presentation software if you need to highlight specific features within a screenshot.
