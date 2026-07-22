// Generates static preview pages for blog posts so link crawlers (iMessage,
// Twitter, Slack...) see real Open Graph tags and a per-post image. Hash
// routes (/#/blog/N) all serve the same index.html to crawlers, so each post
// gets a real path (/blog/N/) that carries the meta tags and immediately
// redirects humans to the SPA route.
//
// Runs against build/ after `npm run build`; wired into predeploy.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = path.join(__dirname, "..", "build");
const SITE = "https://shaunak.github.io";
const GREEN = "#F3FFE3";

// Public by design: this key ships in the site's JS bundle. RLS means only
// public posts come back, so protected posts never get preview pages.
const SUPABASE_URL = "https://vbnpoblsackuihwncsur.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibnBvYmxzYWNrdWlod25jc3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MTAxODksImV4cCI6MjA3OTQ4NjE4OX0.FQYNAVQ91qCPsxFtBiToVDv_ph201nFj4TcjTH5mTTA";

const fonts = [
  {
    name: "Space Mono",
    data: await readFile(path.join(__dirname, "fonts", "SpaceMono-Regular.ttf")),
    weight: 400,
    style: "normal",
  },
  {
    name: "Space Mono",
    data: await readFile(path.join(__dirname, "fonts", "SpaceMono-Bold.ttf")),
    weight: 700,
    style: "normal",
  },
];

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function renderCard({ title, subtitle }) {
  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          backgroundColor: GREEN,
          padding: "80px 90px",
          fontFamily: "Space Mono",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                fontSize: title.length > 40 ? 64 : 78,
                fontWeight: 700,
                color: "#000000",
                lineHeight: 1.15,
              },
              children: title,
            },
          },
          subtitle
            ? {
                type: "div",
                props: {
                  style: {
                    marginTop: 28,
                    fontSize: 32,
                    color: "rgba(0,0,0,0.65)",
                  },
                  children: subtitle,
                },
              }
            : null,
          {
            type: "div",
            props: {
              style: {
                marginTop: 56,
                fontSize: 26,
                color: "rgba(0,0,0,0.5)",
              },
              children: "shaunak.github.io",
            },
          },
        ].filter(Boolean),
      },
    },
    { width: 1200, height: 630, fonts }
  );
  return new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
}

function stubHtml({ title, description, ogPath, redirectTo, canonical }) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${t}</title>
<meta name="description" content="${d}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Shaunak's Website">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}${ogPath}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${SITE}${ogPath}">
<meta http-equiv="refresh" content="0;url=${redirectTo}">
<style>html{background:${GREEN}}</style>
<script>location.replace(${JSON.stringify(redirectTo)})</script>
</head>
<body></body>
</html>
`;
}

const res = await fetch(
  `${SUPABASE_URL}/rest/v1/posts?select=slug,title,subheading,created_at&order=created_at.desc`,
  { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
);
if (!res.ok) throw new Error(`posts fetch failed: ${res.status}`);
const posts = (await res.json()).filter((p) => p.slug && p.title);

for (const post of posts) {
  const dir = path.join(BUILD_DIR, "blog", String(post.slug));
  await mkdir(dir, { recursive: true });
  const subtitle = post.subheading || "";
  await writeFile(path.join(dir, "og.png"), await renderCard({ title: post.title, subtitle }));
  await writeFile(
    path.join(dir, "index.html"),
    stubHtml({
      title: post.title,
      description: subtitle || `A post from Shaunak's blog`,
      ogPath: `/blog/${post.slug}/og.png`,
      redirectTo: `/#/blog/${post.slug}`,
      canonical: `${SITE}/blog/${post.slug}/`,
    })
  );
  console.log(`generated /blog/${post.slug}/ (${post.title})`);
}

// A generic card for the site root, referenced from public/index.html.
await writeFile(
  path.join(BUILD_DIR, "og.png"),
  await renderCard({ title: "Shaunak's Website", subtitle: "blog, projects, and other ramblings" })
);
console.log(`generated /og.png (site default) — ${posts.length} post page(s) total`);
