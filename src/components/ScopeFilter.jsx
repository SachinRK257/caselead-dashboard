import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

const ALL = "__ALL__";

/**
 * Scope picker: a text input you can type into, backed by a filtered list.
 *
 * A native <select> cannot show placeholder text, and its first option would
 * have to double as the "no filter" state - which reads as a real choice. A
 * combobox gets a true placeholder and scales past the handful of options in
 * the sample data without turning into a long scroll.
 *
 * `noun` is the singular thing being picked ("bank", "city"). `allLabel` is
 * the reset row, spelled out by the caller rather than pluralised here because
 * English will not do that reliably.
 */
export default function ScopeFilter({
  options: source = [],
  value,
  onChange,
  total = 0,
  noun = "option",
  allLabel = "All",
  icon: Icon,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef(null);
  const inputRef = useRef(null);
  // The page renders this control more than once, so the listbox id has to
  // be per-instance or aria-controls would point at the wrong list.
  const listId = useId();

  const selectedLabel =
    source.find((option) => option.key === value)?.label ?? value ?? "";

  // The selection can change from outside this instance - a click on a chart
  // bar, or the twin of this control further down the page. Adopting it during
  // render keeps the text in the box honest about what is actually filtered,
  // instead of leaving a stale placeholder next to an active filter.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setQuery(selectedLabel);
  }

  const options = useMemo(() => {
    const all = [{ key: ALL, label: allLabel, count: total }];
    const rest = source.map((o) => ({
      key: o.key,
      label: o.label,
      count: o.value,
    }));

    const term = query.trim().toLowerCase();
    // A query equal to the current selection means the field was merely
    // focused, not retyped - show everything rather than a list of one.
    if (!term || term === selectedLabel.toLowerCase()) return [...all, ...rest];

    return [...all, ...rest].filter((o) =>
      o.label.toLowerCase().includes(term)
    );
  }, [allLabel, source, query, selectedLabel, total]);

  // Leaving the field abandons any half-typed text and shows the live
  // selection again, so the input never disagrees with what is filtered.
  const close = useCallback(() => {
    setOpen(false);
    setQuery(selectedLabel);
  }, [selectedLabel]);

  // Close on an outside click or Escape, the two ways out of a popover.
  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) close();
    }
    function onKeyDown(event) {
      if (event.key === "Escape") {
        close();
        inputRef.current?.blur();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  function pick(option) {
    onChange?.(option.key === ALL ? null : option.key);
    setQuery(option.key === ALL ? "" : option.label);
    setOpen(false);
  }

  function handleKeyDown(event) {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (options[activeIndex]) pick(options[activeIndex]);
    }
  }

  return (
    <div className="scope-filter" ref={rootRef}>
      <div className={`scope-filter-control ${open ? "is-open" : ""}`}>
        {Icon && (
          <Icon size={16} aria-hidden="true" className="scope-filter-icon" />
        )}

        <input
          ref={inputRef}
          type="text"
          className="scope-filter-input"
          placeholder={`${noun} name...`}
          value={query}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={`Filter by ${noun} name`}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
        />

        {value ? (
          <button
            type="button"
            className="scope-filter-clear"
            aria-label={`Clear ${noun} filter`}
            onClick={() => {
              onChange?.(null);
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <X size={14} />
          </button>
        ) : (
          <ChevronDown
            size={16}
            aria-hidden="true"
            className="scope-filter-caret"
            style={{ transform: open ? "rotate(180deg)" : "none" }}
          />
        )}
      </div>

      {open && (
        <ul className="scope-filter-list" id={listId} role="listbox">
          {options.length === 0 ? (
            <li className="scope-filter-empty">
              <Search size={14} aria-hidden="true" />
              No {noun} matches that
            </li>
          ) : (
            options.map((option, i) => {
              const isSelected =
                option.key === ALL ? value == null : option.key === value;

              return (
                <li key={option.key}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`scope-filter-option ${
                      i === activeIndex ? "is-active" : ""
                    } ${isSelected ? "is-selected" : ""}`}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => pick(option)}
                  >
                    <span className="scope-filter-check" aria-hidden="true">
                      {isSelected && <Check size={14} />}
                    </span>

                    <span className="scope-filter-name">{option.label}</span>
                    <span
                      className={`scope-filter-count ${
                        option.count === 0 ? "is-zero" : ""
                      }`}
                    >
                      {option.count}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
