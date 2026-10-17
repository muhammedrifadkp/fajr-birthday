# fajr-birthday

Birthday invitation website for Fajr's 4th birthday — Monday, 19 October 2026, 4:00 PM.

Plain HTML, CSS and JavaScript (GSAP, Lenis and canvas-confetti from CDNs). No build step.

## Run locally

```bash
python -m http.server 5317
```

Then open http://localhost:5317.

## Edit party details

Venue, Google Maps link and RSVP WhatsApp number live in the `CONFIG` object at the top of `js/main.js`. Buttons for directions and RSVP appear automatically once those are filled in.

## Deploy

Hosted on Vercel as a static site (`vercel.json` sets caching headers). Every push to `main` redeploys.

The WhatsApp / social link preview uses absolute URLs in the `<head>` of `index.html` (`https://fajr-birthday.vercel.app/...`). If the Vercel domain is different, update those URLs.
