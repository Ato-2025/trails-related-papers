# TRAILS Trust Framework — Interactive Reflection Tool

An interactive diagram of the **TRAILS trust framework** that helps AI researchers
reflect on their own projects. Each part of the framework is a clickable box, and
each relationship between parts is a clickable arrow. Clicking one opens **reflection
questions** to ask about your own AI system, along with **real TRAILS publications**
on that topic.

The goal: turn a static framework diagram into something you can actually *use* — to
ask better questions and to point people to the research behind each idea.

---

## What it does

- Shows the eight components of the trust framework (AI system, Trust Proxies, TAI
  Research Team, Trusted Infrastructure, Trust Public, Trust Intermediaries, Trust
  Representatives, Trust Institution) and the relationships between them.
- Lets you **click any box or arrow** to open a panel with:
  - reflection questions about your own project, and
  - curated TRAILS publications relevant to that component.
- Pulls its publication list from the team's **public TRAILS Zotero library**, so the
  papers can be refreshed whenever the library changes.

---

## How it works (the pipeline)

The papers shown in the tool come from a small data pipeline:

```
Zotero library  ->  fetch_papers.py  ->  resources.json  ->  the diagram (website)
 205 TRAILS         reads via the       papers sorted        reads the file and
 publications       public API          by component         shows them on click
```

- **Zotero library** — the source. All papers live in the team's Zotero group,
  specifically the *TRAILS Publications* collection.
- **`fetch_papers.py`** — a Python script that reads the library through Zotero's
  public API, keeps the title, authors, year, and link for each paper, sorts them
  into framework components, and writes the result.
- **`resources.json`** — the finished data file the website reads. (Once this exists,
  the site runs without the script; the script is only re-run to refresh the data.)
- **The diagram** — a React component that draws the boxes and arrows and displays the
  questions and papers when something is clicked.

---

## Tech stack

| Piece | Built with |
|-------|------------|
| Interactive diagram | **React** (JavaScript / JSX) |
| Dev server & build | **Vite** |
| Styling | **CSS** (incl. an `index.css` reset for full-screen layout) |
| Publications pipeline | **Python** (standard library only) |
| Data format | **JSON** |
| Icons | lucide-react |

---

## Project structure

```
trails-framework-scratch/
├─ TrustNetworkDiagram.jsx   # the interactive diagram (React component)
├─ resources.json            # papers grouped by framework component (data the site reads)
├─ fetch_papers.py           # pulls papers from Zotero and rebuilds resources.json
├─ index.html                # original static version (kept for reference; not used by the app)
└─ viewer/                   # the Vite app that runs the diagram in the browser
   └─ src/
      ├─ TrustNetworkDiagram.jsx
      ├─ resources.json
      └─ index.css
```

> Note: the diagram component and `resources.json` exist both at the repo root (the
> tracked copies) and inside `viewer/src/` (the copies the running app actually uses).
> When you change one, copy it into `viewer/src/` so the site updates.

---

## Getting started

You'll need [Node.js](https://nodejs.org) (which includes npm) and Python 3.

**1. Clone the repo**

```bash
git clone https://github.com/scsitara/trails-framework-scratch.git
cd trails-framework-scratch
```

**2. Install and run the app**

The app lives in the folder that contains a `package.json` (here, `viewer/`):

```bash
cd viewer
npm install
npm run dev
```

**3. Open it**

The terminal will print a local address like `http://localhost:5173/`. Open it in your
browser. Click any box or arrow to try it.

To stop the server, press **Ctrl + C** in the terminal.

---

## Updating the publications

You only need this when the papers change (new publications added, or you want to
re-map which paper goes under which component).

**1. Run the script** (from the repo root):

```bash
python3 fetch_papers.py
```

This reads the Zotero library and rewrites `resources.json`. It also writes
`trails_publications.txt`, a plain list of every title in the collection.

**2. Copy the new data into the app:**

```bash
cp resources.json viewer/src/resources.json
```

Refresh the browser and the papers update.

**To change which papers appear under each component**, edit the `CURATED` mapping at
the top of `fetch_papers.py` (it matches paper titles to components), then re-run the
two steps above.

---

## Data source & acknowledgment

Publications are drawn from the public **TRAILS** (Trustworthy AI in Law & Society)
Zotero group library. The trust framework and the publications are the work of the
TRAILS research community; this tool is a way to explore them interactively.

---

## Notes

- This is a learning project — built step by step, including learning the tooling
  (React, Vite, the Zotero API) along the way.
- The mapping of papers to components is a curated, human judgment applied by the
  script; it is not decided automatically at runtime. The live site simply reads the
  finished `resources.json`.
