# Voice — Lead Magnet Demo Builder

Clone of saleswingman.ai/lm/double-banger for the **life insurance** niche.

## Flow
1. Opt-in page — name + email pre-filled from URL query params, user only enters phone. Website URL also comes from the link.
2. On submit: validate the website, scrape it to detect what the lead sells, auto-build a demo.
3. Demo page: live SMS conversation UI + AI voice follow-up when replies stop.

## Gotchas
- Pre-fill reads from query params (`?name=&email=&website=`). Do not build a form that ignores them.
- Scraping is for *detecting the offer*, not generic teardown. Output must drive demo copy.
- Voice/SMS follow-up is life-insurance cold outreach — assume TCPA sensitivity; never hardcode real sends in dev.
- Screenshots in `ScreenShots/` are reference for *functionality only*, not visual style.

## Meta
Keep this file short. Grep beats reading CLAUDE.md for anything the code already answers. Only add entries here for mistakes that keep recurring.
