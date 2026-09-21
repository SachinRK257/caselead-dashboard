import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";

import { DEFAULT_SETTINGS, useSettings } from "../context/settingsCore";
import { isHighLiability, parseAmount } from "../utils/cases";
import { formatMoneyFull, formatMoneyShort } from "../utils/format";

/**
 * The two numbers that decide what the dashboard shouts about.
 *
 * Each field shows what the current value does to the real case list, so the
 * effect of a change is visible before it is saved rather than discovered
 * later on another page.
 */
export default function SettingsPage({ allCases = [] }) {
  const settings = useSettings();

  const [amountInput, setAmountInput] = useState(
    String(settings.highLiabilityThreshold)
  );
  const [daysInput, setDaysInput] = useState(String(settings.dueSoonDays));

  const bigCount = useMemo(
    () =>
      allCases.filter((c) =>
        isHighLiability(c, settings.highLiabilityThreshold)
      ).length,
    [allCases, settings.highLiabilityThreshold]
  );

  const dueSoonCount = allCases.filter(
    (c) => c.timelineStatus === "DUE_SOON"
  ).length;

  function saveAmount(event) {
    event.preventDefault();
    const parsed = parseAmount(amountInput);
    if (parsed !== null && parsed > 0) {
      settings.update({ highLiabilityThreshold: parsed });
    }
  }

  function saveDays(event) {
    event.preventDefault();
    const days = Number(daysInput);
    if (Number.isFinite(days) && days >= 1 && days <= 90) {
      settings.update({ dueSoonDays: Math.round(days) });
    }
  }

  const changed =
    settings.highLiabilityThreshold !== DEFAULT_SETTINGS.highLiabilityThreshold ||
    settings.dueSoonDays !== DEFAULT_SETTINGS.dueSoonDays;

  return (
    <div className="panel full-panel">
      <div className="panel-header">
        <div>
          <h2>Settings</h2>
          <p>These change what counts as urgent across the whole dashboard</p>
        </div>

        {changed && (
          <button
            type="button"
            className="disclosure"
            onClick={() => {
              settings.reset();
              setAmountInput(String(DEFAULT_SETTINGS.highLiabilityThreshold));
              setDaysInput(String(DEFAULT_SETTINGS.dueSoonDays));
            }}
          >
            <RotateCcw size={14} aria-hidden="true" />
            Back to defaults
          </button>
        )}
      </div>

      <div className="settings-list">
        <form className="setting-row" onSubmit={saveAmount}>
          <div className="setting-text">
            <strong>What counts as a big amount</strong>
            <p>
              Cases at or above this show under &ldquo;Big Amount&rdquo;. Right
              now that is <strong>{bigCount}</strong> of {allCases.length}{" "}
              cases, at {formatMoneyShort(settings.highLiabilityThreshold)}.
            </p>
          </div>

          <div className="setting-control">
            <input
              type="text"
              inputMode="numeric"
              value={amountInput}
              aria-label="Big amount threshold in rupees"
              onChange={(e) => setAmountInput(e.target.value)}
            />
            <button type="submit" className="filter-button">
              Save
            </button>
          </div>
        </form>

        <form className="setting-row" onSubmit={saveDays}>
          <div className="setting-text">
            <strong>How early to warn about a deadline</strong>
            <p>
              A case is &ldquo;Due Soon&rdquo; this many days before its
              required action date. Right now that is{" "}
              <strong>{dueSoonCount}</strong> cases, at {settings.dueSoonDays}{" "}
              days.
            </p>
          </div>

          <div className="setting-control">
            <input
              type="number"
              min="1"
              max="90"
              value={daysInput}
              aria-label="Days of warning before a deadline"
              onChange={(e) => setDaysInput(e.target.value)}
            />
            <button type="submit" className="filter-button">
              Save
            </button>
          </div>
        </form>

        <div className="setting-row is-static">
          <div className="setting-text">
            <strong>Where these are kept</strong>
            <p>
              Saved in this browser only, so they survive a refresh but do not
              follow you to another device. Current big-amount value:{" "}
              {formatMoneyFull(settings.highLiabilityThreshold)}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
