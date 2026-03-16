"use client";

import { Search, X } from "lucide-react";
import { Avatar } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Local types (no external import required)
// ---------------------------------------------------------------------------

interface SearchUser {
  id: string;
  username: string;
  pseudo: string;
  image: string | null;
}

interface SearchTweet {
  id: string;
  content: string;
  createdAt: string;
  user: SearchUser;
  likes: Array<{ userId: string }>;
  _count: { likes: number; comments: number };
}

interface SearchResults {
  tweets: SearchTweet[];
  users: SearchUser[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(text: string, max = 60): string {
  return text.length <= max ? text : text.slice(0, max).trimEnd() + "…";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SearchBar() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------------------
  // Fetch
  // -------------------------------------------------------------------------

  const fetchResults = useCallback(async (q: string) => {
    if (q.length === 0) {
      setResults(null);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("Search failed");
      const data: SearchResults = await res.json();
      setResults(data);
    } catch {
      setResults({ tweets: [], users: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Debounce — fire 300 ms after the user stops typing
  // -------------------------------------------------------------------------

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length === 0) {
      setResults(null);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    // Show loading immediately so the UI reacts before the network call
    setIsLoading(true);
    setIsOpen(true);

    debounceRef.current = setTimeout(() => {
      fetchResults(value);
    }, 300);
  };

  // -------------------------------------------------------------------------
  // Re-open on focus when a previous query exists
  // -------------------------------------------------------------------------

  const handleFocus = () => {
    if (query.length > 0 && results !== null) {
      setIsOpen(true);
    }
  };

  // -------------------------------------------------------------------------
  // Clear button
  // -------------------------------------------------------------------------

  const handleClear = () => {
    setQuery("");
    setResults(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // -------------------------------------------------------------------------
  // Close on outside click (mousedown) or Escape
  // -------------------------------------------------------------------------

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Cleanup debounce on unmount
  // -------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Navigation helpers
  // -------------------------------------------------------------------------

  const navigateToUser = (username: string) => {
    setIsOpen(false);
    router.push(`/profil/${username}`);
  };

  const navigateToTweet = (tweet: SearchTweet) => {
    setIsOpen(false);
    router.push(`/profil/${tweet.user.username}`);
  };

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const hasUsers = (results?.users.length ?? 0) > 0;
  const hasTweets = (results?.tweets.length ?? 0) > 0;
  const isEmpty = results !== null && !hasUsers && !hasTweets && !isLoading;

  const showDropdown = isOpen && query.length > 0;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      ref={wrapperRef}
      className="relative self-center w-80 mt-6 mb-4"
    >
      {/* ── Input bar ── */}
      <div className="flex items-center bg-gray-800 rounded-full gap-2 px-1 py-1">
        {/* Search icon button */}
        <button
          type="button"
          aria-label="Rechercher"
          className="bg-gray-700 self-stretch rounded-full px-3 flex items-center cursor-pointer hover:bg-gray-600 transition-colors"
          onClick={() => inputRef.current?.focus()}
        >
          <Search className="w-4 h-4 text-gray-300" />
        </button>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          placeholder="Rechercher…"
          aria-label="Champ de recherche"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          className="flex-1 bg-transparent outline-none text-white placeholder:text-gray-400 text-sm py-1"
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
        />

        {/* Clear button — visible only when query is non-empty */}
        {query.length > 0 && (
          <button
            type="button"
            aria-label="Effacer la recherche"
            className="mr-2 text-gray-400 hover:text-white transition-colors"
            onClick={handleClear}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Dropdown ── */}
      {showDropdown && (
        <div
          role="listbox"
          aria-label="Résultats de recherche"
          className="absolute top-full mt-2 left-0 right-0 z-50 bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Loading spinner */}
          {isLoading && (
            <div className="flex justify-center items-center py-6">
              <span className="inline-block w-5 h-5 border-2 border-gray-500 border-t-blue-400 rounded-full animate-spin" />
            </div>
          )}

          {/* Empty state */}
          {isEmpty && (
            <p className="text-gray-400 text-sm text-center px-4 py-5">
              Aucun résultat pour&nbsp;
              <span className="text-white font-medium">&ldquo;{query}&rdquo;</span>
            </p>
          )}

          {/* Users section */}
          {!isLoading && hasUsers && (
            <section>
              <p className="text-gray-400 text-xs font-semibold px-3 pt-3 pb-1 uppercase tracking-wide">
                Utilisateurs
              </p>
              {results!.users.map((user) => (
                <div
                  key={user.id}
                  role="option"
                  aria-selected="false"
                  tabIndex={0}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700/60 cursor-pointer transition-colors"
                  onClick={() => navigateToUser(user.username)}
                  onKeyDown={(e) => e.key === "Enter" && navigateToUser(user.username)}
                >
                  <Avatar
                    src={user.image ?? undefined}
                    name={user.pseudo}
                    size="sm"
                    className="flex-shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-white text-sm font-semibold truncate">
                      {user.pseudo}
                    </span>
                    <span className="text-gray-400 text-xs truncate">
                      @{user.username}
                    </span>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Divider between sections */}
          {!isLoading && hasUsers && hasTweets && (
            <div className="border-t border-gray-700 mx-3" />
          )}

          {/* Tweets section */}
          {!isLoading && hasTweets && (
            <section>
              <p className="text-gray-400 text-xs font-semibold px-3 pt-3 pb-1 uppercase tracking-wide">
                Tweets
              </p>
              {results!.tweets.map((tweet) => (
                <div
                  key={tweet.id}
                  role="option"
                  aria-selected="false"
                  tabIndex={0}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700/60 cursor-pointer transition-colors"
                  onClick={() => navigateToTweet(tweet)}
                  onKeyDown={(e) => e.key === "Enter" && navigateToTweet(tweet)}
                >
                  <Avatar
                    src={tweet.user.image ?? undefined}
                    name={tweet.user.pseudo}
                    size="sm"
                    className="flex-shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-white text-xs font-semibold truncate">
                      {tweet.user.pseudo}&nbsp;
                      <span className="text-gray-400 font-normal">
                        @{tweet.user.username}
                      </span>
                    </span>
                    <span className="text-gray-300 text-xs truncate">
                      {truncate(tweet.content)}
                    </span>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Bottom padding */}
          {!isLoading && (hasUsers || hasTweets) && <div className="pb-2" />}
        </div>
      )}
    </div>
  );
}
