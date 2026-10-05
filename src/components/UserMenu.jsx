import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ShieldCheck, UserRound } from "lucide-react";

import { initialsOf, ROLE } from "../utils/cases";

/** What each role is called, and the icon that stands for it in the list. */
const ROLE_META = {
  ADMIN: { label: "Admin", icon: ShieldCheck },
  SALESPERSON: { label: "Salesperson", icon: UserRound },
};

/** "Admin · all regions" / "Salesperson · Belagavi" */
function describeUser(user) {
  if (!user) return "Not signed in";

  const role = ROLE_META[user.role]?.label ?? "User";
  return `${role} · ${user.city ?? user.region ?? "all regions"}`;
}

/**
 * Who is signed in, and a way to sign in as someone else.
 *
 * There is no authentication behind this - the app has no backend - so the menu
 * switches the active user rather than logging anybody in. It is the one place
 * the difference between the admin's whole-book view and a salesperson's own
 * patch is chosen, so it says which role each name carries rather than listing
 * bare names.
 */
export default function UserMenu({ user, users = [], onSignIn }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  // Close on an outside click or Escape, the two ways out of a popover.
  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) close();
    }
    function onKeyDown(event) {
      if (event.key === "Escape") close();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        type="button"
        className="header-profile"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="avatar" aria-hidden="true">
          {initialsOf(user?.name)}
        </span>

        <span className="header-profile-text">
          <strong>{user?.name ?? "Guest"}</strong>
          <small>{describeUser(user)}</small>
        </span>

        <ChevronDown
          size={16}
          aria-hidden="true"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <div className="user-menu-list" role="menu">
          <p className="user-menu-label">Signed in as</p>

          {users.map((option) => {
            const Icon = ROLE_META[option.role]?.icon ?? UserRound;
            const isCurrent = option.id === user?.id;

            return (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={isCurrent}
                className={`user-menu-item ${isCurrent ? "is-current" : ""}`}
                onClick={() => {
                  onSignIn?.(option.id);
                  close();
                }}
              >
                <span className="user-menu-icon" aria-hidden="true">
                  <Icon size={15} />
                </span>

                <span className="user-menu-text">
                  <strong>{option.name}</strong>
                  <small>{describeUser(option)}</small>
                </span>

                <span className="user-menu-check" aria-hidden="true">
                  {isCurrent && <Check size={15} />}
                </span>
              </button>
            );
          })}

          {/* Said plainly: this picks a point of view, it does not authenticate
              anyone, and nothing here is a security boundary. */}
          <p className="user-menu-foot">
            Switches the view only — {ROLE_META[ROLE.ADMIN].label} sees every
            case, a salesperson sees their own.
          </p>
        </div>
      )}
    </div>
  );
}
