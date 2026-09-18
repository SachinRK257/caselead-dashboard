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
│   ├── BankCases.jsx         # Case distribution per bank
│   ├── BankVisitCases.jsx    # Bank visit tracker table
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
