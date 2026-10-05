import { useEffect, useRef } from "react";
import { Menu, Search, X } from "lucide-react";

import UserMenu from "./UserMenu";

export default function Header({
  user,
  users = [],
  onSignIn,
  title = "Case Dashboard",
  subtitle = "",
  onOpenSidebar,
  searchQuery = "",
  onSearchChange,
}) {
  const searchRef = useRef(null);

  // Cmd/Ctrl+K focuses search, matching the hint shown in the field.
  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      <div className="header-right">
        <div className="search-box">
          <Search size={18} aria-hidden="true" />
          <input
            ref={searchRef}
            type="search"
            value={searchQuery}
            placeholder="Search cases..."
            aria-label="Search cases"
            onChange={(event) => onSearchChange?.(event.target.value)}
          />

          {searchQuery ? (
            <button
              type="button"
              className="search-clear"
              onClick={() => onSearchChange?.("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          ) : (
            <span aria-hidden="true">⌘ K</span>
          )}
        </div>

        <UserMenu user={user} users={users} onSignIn={onSignIn} />
      </div>
    </header>
  );
}
