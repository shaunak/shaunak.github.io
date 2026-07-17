import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { blogSupabase } from "./blogSupabaseClient";
import PhotoStack, { parsePhotoStackBlock } from "./PhotoStack";
import "./App.css";

type PostRow = {
  title: string | null;
  subheading: string | null;
  tags: string | null;
  created_at: string | null;
  slug: string | null;
  content: string | null;
  is_protected: boolean | null;
};

const BLOG_AUTH_EMAIL = "shaunakrules+blogposts@gmail.com";

function BlogPostPage() {
  const { slug } = useParams();

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string>("");

  const [post, setPost] = useState<PostRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [hasAttemptedUnlock, setHasAttemptedUnlock] = useState(false);

  const isAuthed = useMemo(() => !!session?.user, [session]);
  const showContentOnly = !loading && !error && !!post;

  const getOrdinalSuffix = (day: number): string => {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const formatHumanDate = (createdAt: string | null): string => {
    if (!createdAt) return "";
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return "";
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}${getOrdinalSuffix(day)}, ${year}`;
  };

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
    if (!slug) {
      setLoading(false);
      setPost(null);
      setError("Missing post slug.");
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data, error: fetchError } = await blogSupabase
          .from("posts")
          .select("title,subheading,tags,created_at,slug,content,is_protected")
          .eq("slug", slug)
          .maybeSingle();

        if (cancelled) return;

        if (fetchError) {
          setError(fetchError.message);
          setPost(null);
          return;
        }

        setPost((data as PostRow) ?? null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load post.");
        setPost(null);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [slug, isAuthed]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    setHasAttemptedUnlock(true);
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

  const renderAuthPanel = () => {
    if (authLoading) return null;

    if (session?.user) {
      return (
        <div style={{ marginBottom: "1rem" }}>
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
          {authError ? (
            <div style={{ marginTop: "0.5rem", color: "#b00020" }}>{authError}</div>
          ) : null}
        </div>
      );
    }

    return (
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ marginBottom: "0.5rem", opacity: 0.9 }}>
          Password?
        </div>
        <form onSubmit={signIn} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder=""
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
            style={{
              padding: "0.5rem 1rem",
              cursor: !password || authBusy ? "not-allowed" : "pointer",
              borderRadius: "0.75rem",
              border: "1px solid rgba(0,0,0,0.2)",
              background: !password || authBusy ? "rgba(0,0,0,0.08)" : "#b5e5f6",
              color: "rgba(0,0,0,0.85)",
              fontWeight: 700,
              boxShadow: !password || authBusy ? "none" : "0 2px 0 rgba(0,0,0,0.15)",
            }}
          >
            Unlock
          </button>
        </form>
        {authError ? (
          <div style={{ marginTop: "0.5rem", color: "#b00020" }}>{authError}</div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="App">
      <main className="MainContent BlogPostMainContent">
        {post?.title ? <h1 className="BlogTypewriter">{post?.title}</h1> : null}
        {post?.subheading ? (
          <div className="blogPostPageSubheading">{post.subheading}</div>
        ) : null}
        {post?.tags ? (
          <div className="blogPostTags">
            {post.tags
              .split(";")
              .map((tag) => tag.trim())
              .filter(Boolean)
              .map((tag) => (
                <span key={`post-page-${tag}`} className="blogPostTag">
                  {tag}
                </span>
              ))}
          </div>
        ) : null}


        <div className="throughLine">
          {post?.created_at ? (
            <div className="blogPostPageDate">{formatHumanDate(post.created_at)}</div>
          ) : null}
          {showContentOnly ? (
            <div className="blogMarkdown" style={{ lineHeight: "1.85rem" }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ children, ...props }) => (
                    <a {...props} target="_blank" rel="noreferrer">
                      {children}
                    </a>
                  ),
                  img: ({ alt, ...props }) => (
                    <img {...props} alt={alt ?? ""} className="blogMarkdownImage" />
                  ),
                  pre: ({ children, ...props }) => {
                    const onlyChild: any = Array.isArray(children)
                      ? children[0]
                      : children;
                    const childClassName: string =
                      onlyChild?.props?.className ?? "";
                    if (childClassName.includes("language-photostack")) {
                      return <>{children}</>;
                    }
                    return <pre {...props}>{children}</pre>;
                  },
                  code: ({ children, className, ...props }) => {
                    const match = /language-(\w+)/.exec(className || "");
                    if (match?.[1] === "photostack") {
                      return (
                        <PhotoStack images={parsePhotoStackBlock(String(children))} />
                      );
                    }
                    const isBlock = !!match;
                    if (!isBlock) {
                      return (
                        <code
                          {...props}
                          style={{
                            padding: "0.1rem 0.35rem",
                            borderRadius: "0.35rem",
                            background: "rgba(0,0,0,0.08)",
                            fontSize: "0.95em",
                          }}
                        >
                          {children}
                        </code>
                      );
                    }
                    return (
                      <pre
                        style={{
                          padding: "0.75rem 1rem",
                          borderRadius: "0.75rem",
                          background: "rgba(0,0,0,0.08)",
                          overflowX: "auto",
                        }}
                      >
                        <code {...props} className={className}>
                          {children}
                        </code>
                      </pre>
                    );
                  },
                }}
              >
                {post?.content ?? ""}
              </ReactMarkdown>
            </div>
          ) : (
            <>
              {renderAuthPanel()}

              {loading ? <div>Loading…</div> : null}
              {error ? <div style={{ color: "#b00020" }}>{error}</div> : null}

              {!loading && !error && !post && (session?.user || hasAttemptedUnlock) ? (
                <div>Post not found.</div>
              ) : null}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default BlogPostPage;


