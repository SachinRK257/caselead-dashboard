# CaseLead Dashboard

A React + Vite dashboard for tracking case leads: allocation status, action
timelines, bank visits and pending documents.

## Getting started

```bash
npm install
npm run dev
```

| Script            | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR       |
| `npm run build`   | Produce a production build in `dist/`    |
| `npm run preview` | Serve the production build locally       |
| `npm run lint`    | Run ESLint over the project              |

## Project structure

```
src/
├── main.jsx              # React entry point
├── App.jsx               # Renders the dashboard
├── index.css             # All application styling
├── components/           # Presentational + panel components
│   ├── BankCases.jsx         # "Where Your Cases Are" - bank + property
│   ├── BankVisitCases.jsx    # "Bank Visits" table
│   ├── TodayFocus.jsx        # Plain-language "start here" strip
│   ├── EmptyState.jsx        # Shared "nothing to show" placeholder
│   ├── Header.jsx            # Top bar: search, notifications, profile
│   ├── HighLiabilityCases.jsx# Priority cases table + amount filter
│   ├── Notifications.jsx     # Notification feed
│   ├── PendingDocuments.jsx  # Missing document tracker
│   ├── RecentActivities.jsx  # Activity feed
│   ├── SalesTeam.jsx         # Case load per salesperson, by city
│   ├── Sidebar.jsx           # Navigation drawer
│   ├── StatCard.jsx          # Summary tile
│   ├── StatusBadge.jsx       # Shared timeline status pill
│   └── TimelineCases.jsx     # Due soon / overdue overview
├── data/mockData.js      # Sample cases, salespeople, notifications, activities
├── pages/Dashboard.jsx   # Composes the dashboard, owns shared state
└── utils/
    ├── cases.js          # Case enrichment, team lookup, status enums, filtering
    └── format.js         # Currency, date and duration formatting
```

## Navigation

Every sidebar item is a real page, addressed by hash (`#/deadlines`), so the
back button, refresh and a pasted link all work. Routing is ~70 lines in
`src/router.js` rather than a dependency - the whole requirement is "one of
seven views, addressable, with a working back button", which the hash already
provides, and a hash URL needs no server rewrite rule to host.

| Route | Page |
| ----- | ---- |
| `#/dashboard` | The overview |
| `#/cases` | Every case, with bank / deadline / visit filters and sorting |
| `#/deadlines` | Cases grouped past-due → due soon → on track |
| `#/bank-visits` | The visit tracker, full width |
| `#/documents` | The document queue plus the cases held up by it |
| `#/assign` | Hand an unowned case to a salesperson |
| `#/settings` | The two thresholds that decide what is urgent |

`App.jsx` owns the shell and the shared state (search, read notifications,
session assignments), so moving between pages keeps them rather than resetting.
**Sidebar badges are counted from the case list**, so they cannot drift the way
the previous hardcoded 5 / 8 / 6 had.

Two things are session- or device-scoped, and the UI says so rather than
implying a server:

- **Assignments** made on `#/assign` last while the page is open.
- **Settings** persist to `localStorage` - they survive a refresh but do not
  follow you to another device.
- **Sign out** clears the session state; there is no auth behind this build, so
  it does not pretend to end a server session.

## Writing for the reader

The dashboard is read by salespeople in the field, so the on-screen wording is
deliberately plain: "Not Assigned" rather than "Pending Allocation", "Amount
Due" rather than "Liability Amount", "Deadlines" rather than "Timeline
Overview".

Two things are **not** simplified, on purpose:

- **Demand notice, possession notice, required action date** stay as they are.
  These are the legal terms of the recovery process and the people using this
  know them better than any paraphrase.
- **No number is rounded away.** Amounts show as `₹4.1 Cr` because
  `₹4,10,00,000` has to be counted digit by digit, but the exact figure is on
  the element's `title` and in every table view.

`TodayFocus` answers "what do I do first" in one sentence and names a single
case, so there is nothing to compare before acting. `Extra Charts` is collapsed
by default - the analysis charts are useful to a manager but were pushing the
working panels down the page for everyone else.

## Charts

Charts are hand-built SVG/flex primitives in `src/components/charts/` - no
charting dependency. Each form was picked from the data's job:

| Chart | Form | Why |
| ----- | ---- | --- |
| Cases by bank, property, city, liability | horizontal bars | magnitude across nominal categories |
| Timeline status, bank-visit status | stacked bar | part-to-whole, few classes |
| Documents complete | meter | a single ratio - not a two-slice pie |
| Demand notices by month | area + crosshair | trend over time, one series |
| Sales-team case load | stacked mini-bar | magnitude *and* risk composition |

The seven stat tiles stay tiles. A single current value is a stat tile, not a
one-bar bar chart.

### Colour

`charts/chartTokens.js` holds the palettes, and they were **validated, not
eyeballed**. The UI badge colours could not be reused as chart fills: badge
orange `#c2410c` and badge red `#b91c1c` measure only dE 6.1 apart in normal
vision, so "Due Soon" and "Overdue" were indistinguishable as touching
segments. The chart fills are re-stepped in the same hue families and clear the
gates (worst adjacent CVD dE 9.1). Badges keep their darker text colours, which
are governed by text contrast rather than that gate.

Nominal categories (banks, cities, property types) all use **one** hue. Shading
each bar darker-where-bigger would double-encode the bar length and spend the
only free channel restating what the chart already shows.

Because several validated fills sit below 3:1 against the white panel, no value
is reachable by colour or hover alone: bars carry their value at the tip,
stacked segments are itemised in the legend, and each analytics chart has a
Table toggle.

### Filters

The timeline and bank-visit stacked bars **are** their panel's filter - click a
segment to scope the table below. That avoids a chart sitting next to a second,
competing control for the same dimension.

## Data model

`src/data/mockData.js` holds the sample dataset. Each case carries a
`requiredActionDate`; `remainingDays` and `timelineStatus` are **derived at
runtime** in `src/utils/cases.js` rather than read from the file, so the
dashboard does not go stale as time passes.

Timeline thresholds (`src/utils/format.js`):

- **Overdue** — the required action date has passed
- **Due Soon** — due within `DUE_SOON_THRESHOLD_DAYS` (7) days
- **On Track** — anything further out

### Sales team

`salespeople` is the team roster. **Each salesperson owns exactly one city**,
and a case is assigned to whoever owns the city its branch sits in — so
`assignedTo` always resolves through `getOwnerForCity()` in
`src/utils/cases.js`:

| Salesperson      | City      | Region             |
| ---------------- | --------- | ------------------ |
| Sachin Kulkarni  | Belagavi  | North Karnataka    |
| Rahul Deshpande  | Bengaluru | South Karnataka    |
| Priya Nair       | Mangaluru | Coastal Karnataka  |
| Vikram Hegde     | Dharwad   | North Karnataka    |
| Anita Rao        | Hubballi  | North Karnataka    |
| Kiran Shetty     | Mysuru    | South Karnataka    |

Cases carry `assignedTo: null` while they are `NOT_ALLOCATED`. Those still show
the city's owner in the UI, marked as a suggestion rather than a fact, so the
"Pending Allocation" count stays honest.

`currentUserId` picks the signed-in salesperson; the header, sidebar and
greeting all read from it instead of a hardcoded name.

To connect a real backend, replace the exports in `src/data/mockData.js` with
fetched data and keep the shape the same.
