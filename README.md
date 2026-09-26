# CaseLead Dashboard

A React + Vite dashboard for tracking case leads: allocation status, action
timelines, bank visits and pending documents.

## Current state

**Case Lead dashboard** - a single page, no routing. A bank filter at the top
drives everything below it; type a bank name, pick from the list, or click a
bar in the chart. All three stay in sync.

`BankFilter` is a combobox rather than a `<select>`: a native select has no
placeholder, and its first option would have to double as the "no filter"
state, which reads as a real choice. The combobox gets a true `Bank name...`
placeholder, per-bank counts in the list, type-to-filter, arrow-key navigation
and a clear button.

### The summary strip

Every figure in the toolbar describes the same population. When a bank is
picked, the lender count drops to 1 rather than staying at the book-wide 29 -
otherwise "Cases 22" would sit beside "Lenders 29" and invite reading the two
together.

### The bank filter appears twice

The same control is rendered in the **Cases by Bank** header and again in
**Notices Served**, so a long page can be narrowed from wherever you are. Both
read and write one piece of state, so they can never disagree - picking a bank
in either, or clicking a bar in the chart, updates all three.

Two things that follow from rendering it twice: the listbox id comes from
`useId` rather than a constant, and the text shown in the box is adopted from
the `value` prop during render, so a selection made elsewhere is never left
looking like an empty filter.

### The lender panel

`banks` in the mock data is the master list of all 32 lenders. The filter offers
every one of them, so a lender can always be looked up even in a month where it
has no live case - those show a dimmed `0`. The bank chart only plots lenders
that do have cases, and every chart shows its top 5 with the rest behind its own
Show all toggle - 32 bars is more than anyone scans. The two notice charts each
carry their own toggle, because the stages reach different numbers of lenders
(24 and 27) and one shared control would have had to misreport at least one.

A chart's Table view lists exactly the rows the chart is drawing, expanded or
not. Letting the table quietly run to 29 rows while the chart said "top 5" made
the two disagree about what was being shown.

- **A toolbar** carrying the bank filter and a four-figure summary of the
  current scope
- **Cases by Bank** and **Cases by Property Type**, side by side
- **Notices Served** - two side-by-side bar charts, demand notice and
  possession notice, each counted per bank

Each notice stage gets its own chart and its own baseline rather than sharing a
stacked bar, so comparing banks within a stage is a straight length read. They
are sorted independently, which is what shows that Union Bank leads on demand
notices while SBI leads on possession notices.

Every chart has a Table toggle, so values are reachable without colour or hover.

A **SARFAESI dashboard** is planned next, on this same page.

### Notice stage

A case is at **demand notice** until a possession notice is served, and under
s.13(4) that only follows once the 60-day s.13(2) window has run. The mock data
respects that order: no notice is dated in the future, no possession notice is
served less than 60 days after its demand notice, and the required action date
always falls after the latest notice. 17 of the 48 cases are still inside their
demand-notice window.

### A note on the numbers

`bankData` in the mock file still holds a 400-case portfolio figure. The charts
deliberately do **not** use it - they count the 48 loaded cases, so every chart
total agrees with every other one.


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
src/App.jsx
src/index.css
src/main.jsx
src/assets/hero.png
src/assets/react.svg
src/assets/vite.svg
src/components/EmptyState.jsx
src/components/Header.jsx
src/components/Sidebar.jsx
src/components/StatCard.jsx
src/components/StatusBadge.jsx
src/components/charts/AreaChart.jsx
src/components/charts/BarChart.jsx
src/components/charts/ChartShell.jsx
src/components/charts/Meter.jsx
src/components/charts/StackedBar.jsx
src/components/charts/chartTokens.js
src/components/charts/useHover.js
src/data/mockData.js
src/pages/Dashboard.jsx
src/utils/cases.js
src/utils/format.js
```


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
