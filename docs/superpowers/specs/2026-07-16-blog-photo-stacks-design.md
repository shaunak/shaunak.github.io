# Blog photo stacks (keep Supabase) — design

Date: 2026-07-16
Status: approved

## Goal

Embed the photos sitting unused in the Supabase Storage `images` bucket
(`ubc_post/UBC_campus/`, `ubc_post/Vancouver/`) into the "What was UBC like?"
blog post, keeping Supabase as the blog backend.

## Constraints & findings

- Nearly all photos are HEIC, which Chrome/Firefox cannot render. They must be
  converted to JPEG. Per user request: **full resolution, maximum quality, no
  resizing/compression.**
- The `images` bucket is private. The protected post (slug `0`) embeds
  `images/gif.gif` via a long-lived signed URL, so `gif.gif` must NOT be
  deleted and `images` must stay private.
- The frontend already renders markdown via ReactMarkdown in
  `web-ui/src/BlogPostPage.tsx`.

## Design

1. **Storage:** new public bucket `blog-media`. Converted JPEGs are uploaded to
   `blog-media/ubc_post/UBC_campus/*.jpg` and `blog-media/ubc_post/Vancouver/*.jpg`.
   The `images` bucket is untouched (stays private, gif keeps working).
2. **Conversion:** one-time local `sips` HEIC→JPEG conversion at original
   resolution, `formatOptions best`.
3. **PhotoStack component** (`web-ui/src/PhotoStack.tsx`): renders a stack of
   "printouts" — current photo on top with white border/shadow, offset rotated
   cards peeking out behind, `<` `>` buttons below to shuffle through, caption
   and position indicator. Only the current/adjacent images are loaded.
4. **Markdown embedding:** a fenced code block with language `photostack`,
   one image per line: `url | caption`. `BlogPostPage`'s `code` renderer maps
   `language-photostack` to `<PhotoStack>`. Future posts can add stacks with
   no code changes.
5. **Content update:** in `posts` slug `1`, insert a photostack block
   immediately after `## UBC: The Campus` (14 campus photos) and immediately
   after `## Vancouver and the PNW` before the body text (5 Vancouver photos).
   Captions derived from filenames, editable in the dashboard.

## Out of scope

Deleting `gif.gif`, DenLoop, auth changes, migrating off Supabase.
