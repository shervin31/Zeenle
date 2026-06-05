# Zeenle Events — Frontend Redesign

A clean, modern frontend rebuild of [zeenle.com](https://zeenle.com) — a community events platform for the Iranian-Canadian community and beyond.

## 🚀 Live Preview (GitHub Pages)

Once pushed, your site will be live at:

```
https://<your-github-username>.github.io/Zeenle/
```

## 📁 Project Structure

```
Zeenle/
├── index.html          # Single-page app — all pages rendered here
├── css/
│   └── main.css        # Full design system & component styles
├── js/
│   └── main.js         # All UI logic, routing, data, interactions
└── README.md
```

## 🖥️ Pages Included

| Page | Description |
|------|-------------|
| **Home** | Hero banner, search, category filters, event cards grid |
| **Event Detail** | Poster, full info, RSVP/tickets button, carpool & photo panels |
| **Create Event** | Full event creation form with all original fields + controls |
| **My Account** | ZeePoints dashboard, My Tickets, My Events, Referrals |
| **Login Modal** | Overlay login/signup (auth-aware nav & drawer) |

## 🌿 Design Choices

- **Palette**: Deep forest green (`#1A3A2A`) + warm gold (`#B8963E`) on cream (`#F7F6F2`)
- **Typography**: Syne (display, headings) + DM Sans (body)
- **Approach**: Clean, minimal, professional — no vibe-coded candy colours
- **Mobile**: Fully responsive; hamburger drawer on small screens

## 🔧 Setup

### Local Development

Just open `index.html` in your browser — no build step required. Everything runs as plain HTML/CSS/JS.

```bash
# Optional: serve locally with Python
python3 -m http.server 8080
# Then visit http://localhost:8080
```

### Push to GitHub & Enable Pages

```bash
# 1. Clone your repo (or init if new)
git clone https://github.com/<username>/Zeenle.git
cd Zeenle

# 2. Copy these files into the repo root
# (replace existing files)

# 3. Push
git add .
git commit -m "feat: complete frontend redesign"
git push origin main

# 4. Enable GitHub Pages
# → Go to your repo on GitHub
# → Settings → Pages
# → Source: Deploy from a branch
# → Branch: main / root (/)
# → Save
```

Your site will be live in ~1 minute at `https://<username>.github.io/Zeenle/`

## 🔌 Backend Integration (To Do)

The frontend is built with backend integration in mind. All data flows through a single `EVENTS` array in `js/main.js` — replace with API calls when ready.

Planned integration points:
- `GET /api/events` → replace `EVENTS` array in `main.js`
- `POST /api/events` → wire up the Create Event form `submitEvent()`
- `POST /api/auth/login` → replace `doLogin()` with real auth
- `GET /api/users/me` → populate account page
- `GET /api/tickets` → populate My Tickets tab
- `POST /api/rsvp` → wire up the RSVP/Register button on detail page
- ZeePoints → `GET /api/users/me/points`
- Referrals → `GET /api/users/me/referrals`

## ✅ Bugs Fixed from Original

- Login/Logout state is now consistent — logout only shows when authenticated
- Navigation highlights the active page
- All pages are accessible without being logged in (with appropriate locked-state messaging)
- Carpool sections only show on events where `carpool: true`
- Mobile menu is a proper slide-out drawer (not a broken cropped menu)

---

Built with ❤️ by Claude — ready for your backend.
