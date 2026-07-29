import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { Ampersands, Lock, LockOpen } from "lucide-react";
import { blogSupabase } from "./blogSupabaseClient";
import "./App.css";

type PostListRow = {
  title: string | null;
  subheading: string | null;
  tags: string | null;
  slug: string | null;
  is_protected: boolean | null;
  created_at: string | null;
};

const BLOG_AUTH_EMAIL = "shaunakrules+blogposts@gmail.com";
const BLOG_TITLE_TEXT = "Blog";
const BLOG_HOME_LABEL = "Home";
const BLOG_POSTS_LABEL = "Posts";

const Blog = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);

  const [posts, setPosts] = useState<PostListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [headerStep, setHeaderStep] = useState(0);
  const [streamStep, setStreamStep] = useState(0);

  const isAuthed = useMemo(() => !!session?.user, [session]);
  const visiblePosts = useMemo(
    () => (isAuthed ? posts : posts.filter((post) => !post.is_protected)),
    [isAuthed, posts]
  );
  const firstProtectedSlug = useMemo(
    () => posts.find((post) => post.is_protected && post.slug)?.slug ?? null,
    [posts]
  );

  const formatPostDate = (createdAt: string | null): string => {
    if (!createdAt) return "";
    return new Date(createdAt).toISOString().slice(0, 10);
  };

  const streamHeaderText = (text: string): string =>
    text.slice(0, Math.min(headerStep, text.length));
  const streamText = (text: string): string => text.slice(0, Math.min(streamStep, text.length));

  const streamCharGoal = useMemo(() => {
    const lengths = [BLOG_POSTS_LABEL.length];
    visiblePosts.forEach((post) => {
      lengths.push(
        formatPostDate(post.created_at).length,
        (post.title ?? post.slug ?? "").length,
        (post.subheading ?? "").length
      );
    });

    return Math.max(0, ...lengths);
  }, [visiblePosts]);

  useEffect(() => {
    const headerGoal = Math.max(BLOG_TITLE_TEXT.length, BLOG_HOME_LABEL.length);
    setHeaderStep(0);

    const intervalId = window.setInterval(() => {
      setHeaderStep((previousStep) => {
        if (previousStep >= headerGoal) {
          window.clearInterval(intervalId);
          return previousStep;
        }
        return previousStep + 1;
      });
    }, 70);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (streamCharGoal === 0 || streamStep >= streamCharGoal) return;

    const intervalId = window.setInterval(() => {
      setStreamStep((previousStep) => {
        if (previousStep >= streamCharGoal) {
          window.clearInterval(intervalId);
          return previousStep;
        }
        return previousStep + 1;
      });
    }, 14);

    return () => window.clearInterval(intervalId);
  }, [streamCharGoal, streamStep]);

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
          .select("title,subheading,tags,slug,is_protected,created_at")
          .eq("is_archived", false)
          .order("created_at", { ascending: false });

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

  const signOut = async () => {
    setAuthBusy(true);
    try {
      const { error } = await blogSupabase.auth.signOut({ scope: "local" });
      if (error && !/auth session missing/i.test(error.message)) {
        throw error;
      }
      if (typeof window !== "undefined" && window.localStorage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i += 1) {
          const key = window.localStorage.key(i);
          if (key && key.includes("sb-blog-auth")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => window.localStorage.removeItem(key));
      }
      setSession(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to sign out.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleHeaderLockClick = async () => {
    if (isAuthed) {
      await signOut();
      return;
    }

    const nextPath = firstProtectedSlug ? `/blog/${firstProtectedSlug}` : "/blog";
    navigate(`/blog/signin?next=${encodeURIComponent(nextPath)}`);
  };

  return (
    <div className="App">
      <main className="MainContent">
        <h1 className="typewriter">{streamHeaderText(BLOG_TITLE_TEXT)}</h1>

        <div className="buttonContainer">
          {headerStep > 0 ? (
            <Link to="/" className="link socialLink streamInIcon">
              {streamHeaderText(BLOG_HOME_LABEL)}
            </Link>
          ) : null}
        </div>

        <div className="throughLine blogThroughLine">
          <div className="blogSectionHeaderRow">
            <div className="blogSectionTitle">{streamText(BLOG_POSTS_LABEL)}</div>
            <span className="blogHeaderActionCell">
              <button
                type="button"
                className="blogLockButton"
                onClick={handleHeaderLockClick}
                disabled={authBusy}
                title={
                  isAuthed
                    ? "Sign out and lock protected posts"
                    : "Go to sign-in page"
                }
                aria-label={
                  isAuthed
                    ? "Sign out and lock protected posts"
                    : "Go to sign-in page"
                }
              >
                <span className="blogPostLockIndicator">
                  {isAuthed ? (
                    <LockOpen size={16} strokeWidth={2} />
                  ) : (
                    <Lock size={16} strokeWidth={2} />
                  )}
                </span>
              </button>
            </span>
          </div>

          {loading ? <div>Loading…</div> : null}
          {error ? <div className="blogErrorText">{error}</div> : null}

          {!loading && !error ? (
            <ul className="blogPostsList">
              {visiblePosts.map((p) => (
                <li key={p.slug as string} className="blogPostsListItem">
                  <div className="blogPostDate">
                    {streamText(formatPostDate(p.created_at))}
                  </div>
                  <div className="blogPostTitleRow">
                    <Link to={`/blog/${p.slug}`} className="blogPostTextLink">
                      <span className="blogPostLink">
                        {streamText(p.title ?? p.slug ?? "")}
                      </span>
                      {p.subheading ? (
                        <span className="blogPostSubheading">
                          {streamText(p.subheading)}
                        </span>
                      ) : null}
                    </Link>
                    <span className="blogPostActionCell">
                      <span className="blogPostAmpersand" aria-hidden="true">
                        <Ampersands size={18} strokeWidth={2.1} />
                      </span>
                    </span>
                  </div>
                  {p.tags ? (
                    <div className="blogPostTags">
                      {p.tags
                        .split(";")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                        .map((tag) => (
                          <span key={`${p.slug}-${tag}`} className="blogPostTag">
                            {tag}
                          </span>
                        ))}
                    </div>
                  ) : null}
                </li>
              ))}
              {visiblePosts.length === 0 ? <li>No posts yet.</li> : null}
            </ul>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default Blog;