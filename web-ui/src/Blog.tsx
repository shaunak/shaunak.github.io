import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { blogSupabase } from "./blogSupabaseClient";
import "./App.css";

type PostListRow = {
  title: string | null;
  slug: string | null;
  is_protected: boolean | null;
};

const BLOG_AUTH_EMAIL = "shaunakrules+blogposts@gmail.com";

const Blog = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string>("");

  const [posts, setPosts] = useState<PostListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const isAuthed = useMemo(() => !!session?.user, [session]);

  useEffect(() => {
    let mounted = true;

    blogSupabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setAuthLoading(false);
    });

    const { data: sub } = blogSupabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data, error: fetchError } = await blogSupabase
          .from("posts")
          .select("title,slug,is_protected")
          .order("title", { ascending: true });

        if (cancelled) return;

        if (fetchError) {
          setError(fetchError.message);
          setPosts([]);
          return;
        }

        setPosts(((data as PostListRow[]) ?? []).filter((p) => !!p.slug));
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load posts.");
        setPosts([]);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [isAuthed]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    try {
      const { error } = await blogSupabase.auth.signInWithPassword({
        email: BLOG_AUTH_EMAIL,
        password,
      });
      if (error) throw error;
      setPassword("");
    } catch (e: any) {
      setAuthError(e?.message ?? "Failed to unlock.");
    } finally {
      setAuthBusy(false);
    }
  };

  const signOut = async () => {
    setAuthBusy(true);
    setAuthError("");
    try {
      const { error } = await blogSupabase.auth.signOut();
      if (error) throw error;
    } catch (e: any) {
      setAuthError(e?.message ?? "Failed to sign out.");
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <div className="App">
      <main className="MainContent">
        <h1 className="BlogTypewriter">Blog</h1>

        <div className="buttonContainer" style={{ gridRow: 2 }}>
          <Link to="/" className="iconButton" style={{ padding: "0.25rem 0.5rem" }}>
            Home
          </Link>
        </div>

        <div className="throughLine">
          <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Posts</div>

          {!authLoading ? (
            <div style={{ marginBottom: "1rem" }}>
              {session?.user ? (
                <>
                  <div style={{ marginBottom: "0.5rem", opacity: 0.9 }}>
                    Unlocked (signed in).
                  </div>
                  <button
                    type="button"
                    className="iconButton"
                    onClick={signOut}
                    disabled={authBusy}
                    style={{ padding: "0.25rem 0.5rem", cursor: "pointer" }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: "0.5rem", opacity: 0.9 }}>
                    Enter the password to unlock protected posts.
                  </div>
                  <form
                    onSubmit={signIn}
                    style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                  >
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      style={{
                        padding: "0.5rem 0.75rem",
                        borderRadius: "0.5rem",
                        border: "1px solid rgba(0,0,0,0.25)",
                        minWidth: "16rem",
                        fontFamily: "inherit",
                        fontSize: "inherit",
                      }}
                    />
                    <button
                      type="submit"
                      className="iconButton"
                      disabled={!password || authBusy}
                      style={{ padding: "0.25rem 0.75rem", cursor: "pointer" }}
                    >
                      Unlock
                    </button>
                  </form>
                </>
              )}
              {authError ? (
                <div style={{ marginTop: "0.5rem", color: "#b00020" }}>
                  {authError}
                </div>
              ) : null}
            </div>
          ) : null}

          {loading ? <div>Loading…</div> : null}
          {error ? <div style={{ color: "#b00020" }}>{error}</div> : null}

          {!loading && !error ? (
            <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
              {posts.map((p) => (
                <li key={p.slug as string} style={{ marginBottom: "0.25rem" }}>
                  <Link
                    to={`/blog/${p.slug}`}
                    className="iconButton"
                    style={{
                      display: "inline-block",
                      padding: "0.25rem 0.5rem",
                      textAlign: "left",
                      fontFamily: "inherit",
                      fontSize: "inherit",
                      textDecoration: "none",
                      color: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    {p.title ?? p.slug}
                    {p.is_protected ? (
                      <span style={{ opacity: 0.8 }}> (Protected)</span>
                    ) : null}
                  </Link>
                </li>
              ))}
              {posts.length === 0 ? <li>No posts yet.</li> : null}
            </ul>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default Blog;