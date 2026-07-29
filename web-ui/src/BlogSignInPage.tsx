import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { blogSupabase } from "./blogSupabaseClient";
import "./App.css";

const BLOG_AUTH_EMAIL = "shaunakrules+blogposts@gmail.com";

function BlogSignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const next = params.get("next");
    if (!next || !next.startsWith("/blog")) {
      return "/blog";
    }
    return next;
  }, [location.search]);

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
    if (!authLoading && session?.user) {
      navigate(nextPath, { replace: true });
    }
  }, [authLoading, session, navigate, nextPath]);

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
      navigate(nextPath, { replace: true });
    } catch (err: any) {
      setAuthError(err?.message ?? "Failed to sign in.");
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <div className="App">
      <main className="MainContent">

        <div className="buttonContainer">
          <Link to="/blog" className="link socialLink">
            Back to blog
          </Link>
        </div>

        <div className="throughLine blogThroughLine">
          <div className="blogStatusText">Enter password to unlock protected posts.</div>
          <form onSubmit={signIn} className="blogAuthForm">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="blogPasswordInput"
              autoFocus
            />
            <button
              type="submit"
              className="blogActionButton"
              disabled={!password || authBusy}
            >
              Unlock
            </button>
          </form>
          {authError ? <div className="blogErrorText">{authError}</div> : null}
        </div>
      </main>
    </div>
  );
}

export default BlogSignInPage;
