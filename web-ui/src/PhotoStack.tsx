import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./App.css";

export type PhotoStackImage = {
  src: string;
  caption?: string;
};

type PhotoStackProps = {
  images: PhotoStackImage[];
};

type FlyingCard = {
  dir: "next" | "prev";
  src: string;
  fromWidth?: number;
  fromHeight?: number;
  toWidth?: number;
  toHeight?: number;
};

// Size animation for the front-slot photo during a shuffle, so the pile never
// snaps between differently-shaped photos. "reveal": the incoming front photo
// grows from the outgoing card's box into its own (next). "presqueeze": the
// outgoing front photo shrinks to the arriving card's box while covered (prev).
type TopAnim = {
  mode: "reveal" | "presqueeze";
  fromWidth: number;
  fromHeight: number;
  toWidth: number;
  toHeight: number;
};

// Matches the animation-duration of photoStackFlyNext/Prev in App.css.
const SHUFFLE_MS = 620;
const MAX_PORTRAIT_HEIGHT_PX = 384;

export function parsePhotoStackBlock(block: string): PhotoStackImage[] {
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [src, ...captionParts] = line.split("|");
      const caption = captionParts.join("|").trim();
      return { src: src.trim(), caption: caption || undefined };
    })
    .filter((image) => !!image.src);
}

const PhotoStack = ({ images }: PhotoStackProps) => {
  const [index, setIndex] = useState(0);
  const [flying, setFlying] = useState<FlyingCard | null>(null);
  const [topAnim, setTopAnim] = useState<TopAnim | null>(null);
  // Bumped when a photo loads, the container mounts, or the window resizes —
  // anything that can change the computed slot sizes below.
  const [, setLayoutTick] = useState(0);
  const topImageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // State updates lag same-tick clicks, so the in-flight guard lives in a ref.
  const inFlightRef = useRef(false);

  const count = images.length;

  useEffect(() => {
    const bump = () => setLayoutTick((t) => t + 1);
    bump(); // container ref is attached now; recompute slot sizes
    window.addEventListener("resize", bump);
    return () => window.removeEventListener("resize", bump);
  }, []);

  useEffect(() => {
    if (!flying) return;
    const timer = window.setTimeout(() => {
      if (flying.dir === "prev") {
        setIndex((i) => (i - 1 + count) % count);
      }
      setFlying(null);
      setTopAnim(null);
      inFlightRef.current = false;
    }, SHUFFLE_MS);
    return () => window.clearTimeout(timer);
  }, [flying, count]);

  if (count === 0) return null;

  const current = images[index];
  const neighbors =
    count > 1
      ? [images[(index + 1) % count].src, images[(index - 1 + count) % count].src]
      : [];

  // The size a photo renders at in the front slot: landscape photos span the
  // full text-column width (card frame included); portrait photos are capped
  // in height instead.
  const fitToSlot = (natWidth: number, natHeight: number) => {
    const container = containerRef.current?.clientWidth;
    if (!container) return null;
    const frame = (() => {
      const card = containerRef.current?.querySelector(".photoStackCardTop");
      if (!card) return 0;
      const cs = getComputedStyle(card);
      return (
        parseFloat(cs.paddingLeft) +
        parseFloat(cs.paddingRight) +
        parseFloat(cs.borderLeftWidth) +
        parseFloat(cs.borderRightWidth)
      );
    })();
    const maxWidth = container - frame;
    const landscape = natWidth >= natHeight;
    const scale = landscape
      ? Math.min(maxWidth / natWidth, 1)
      : Math.min(MAX_PORTRAIT_HEIGHT_PX / natHeight, maxWidth / natWidth, 1);
    return { width: natWidth * scale, height: natHeight * scale };
  };

  // Slot size for a photo, if the browser has it cached.
  const probeSlotSize = (src: string) => {
    const probe = new Image();
    probe.src = src;
    return probe.complete && probe.naturalWidth > 0
      ? fitToSlot(probe.naturalWidth, probe.naturalHeight)
      : null;
  };

  const sizesDiffer = (
    a: { width: number; height: number },
    b: { width: number; height: number }
  ) => Math.abs(a.width - b.width) > 2 || Math.abs(a.height - b.height) > 2;

  const showNext = () => {
    if (inFlightRef.current || count < 2) return;
    inFlightRef.current = true;
    const el = topImageRef.current;
    const from = el ? { width: el.clientWidth, height: el.clientHeight } : null;
    // The card in flight morphs toward the size of the photo replacing it.
    const to = probeSlotSize(images[(index + 1) % count].src) ?? from;
    setFlying({
      dir: "next",
      src: current.src,
      fromWidth: from?.width,
      fromHeight: from?.height,
      toWidth: to?.width,
      toHeight: to?.height,
    });
    // The incoming front photo grows out of the outgoing card's box instead
    // of popping in at full size.
    setTopAnim(
      from && to && sizesDiffer(from, to)
        ? {
            mode: "reveal",
            fromWidth: from.width,
            fromHeight: from.height,
            toWidth: to.width,
            toHeight: to.height,
          }
        : null
    );
    setIndex((i) => (i + 1) % count);
  };

  const showPrevious = () => {
    if (inFlightRef.current || count < 2) return;
    inFlightRef.current = true;
    const arriving = images[(index - 1 + count) % count];
    const el = topImageRef.current;
    const from = el ? { width: el.clientWidth, height: el.clientHeight } : null;
    const to = probeSlotSize(arriving.src) ?? from;
    setFlying({
      dir: "prev",
      src: arriving.src,
      fromWidth: from?.width,
      fromHeight: from?.height,
      toWidth: to?.width,
      toHeight: to?.height,
    });
    // Squeeze the pile toward the arriving card's box while it's covered so
    // nothing snaps when the card lands and the index commits.
    setTopAnim(
      from && to && sizesDiffer(from, to)
        ? {
            mode: "presqueeze",
            fromWidth: from.width,
            fromHeight: from.height,
            toWidth: to.width,
            toHeight: to.height,
          }
        : null
    );
    // index is committed when the card lands, in the effect above.
  };

  const sizeVars = (anim: TopAnim | FlyingCard): React.CSSProperties | undefined => {
    const { fromWidth, fromHeight, toWidth, toHeight } = anim as TopAnim;
    if (!fromWidth || !fromHeight || !toWidth || !toHeight) return undefined;
    return {
      "--flyFromW": `${fromWidth}px`,
      "--flyFromH": `${fromHeight}px`,
      "--flyToW": `${toWidth}px`,
      "--flyToH": `${toHeight}px`,
    } as React.CSSProperties;
  };

  const exactSize = (
    size: { width: number; height: number } | null
  ): React.CSSProperties | undefined =>
    size
      ? {
          width: size.width,
          height: size.height,
          maxWidth: "none",
          maxHeight: "none",
        }
      : undefined;

  const topSlot = probeSlotSize(current.src);
  const flyingSize =
    flying && flying.fromWidth && flying.fromHeight
      ? flying.dir === "next"
        ? { width: flying.fromWidth, height: flying.fromHeight }
        : flying.toWidth && flying.toHeight
        ? { width: flying.toWidth, height: flying.toHeight }
        : null
      : null;

  return (
    <div className="photoStack" ref={containerRef}>
      <div
        className={`photoStackPile${flying ? " photoStackPileShuffling" : ""}`}
      >
        <div className="photoStackCard photoStackCardBehindTwo" aria-hidden="true" />
        <div className="photoStackCard photoStackCardBehindOne" aria-hidden="true" />
        <figure
          className={`photoStackCard photoStackCardTop${
            topAnim
              ? topAnim.mode === "reveal"
                ? " photoStackTopReveal"
                : " photoStackTopPresqueeze"
              : ""
          }`}
          style={topAnim ? sizeVars(topAnim) : undefined}
        >
          <img
            ref={topImageRef}
            src={current.src}
            alt={current.caption ?? ""}
            className="photoStackImage"
            style={exactSize(topSlot)}
            onLoad={() => setLayoutTick((t) => t + 1)}
          />
        </figure>
        {flying ? (
          <div
            className={`photoStackFly ${
              flying.dir === "next" ? "photoStackFlyNext" : "photoStackFlyPrev"
            }`}
            style={sizeVars(flying)}
            aria-hidden="true"
          >
            <figure className="photoStackCard photoStackFlyCard">
              <img
                src={flying.src}
                alt=""
                className="photoStackImage"
                style={exactSize(flyingSize)}
              />
            </figure>
          </div>
        ) : null}
      </div>

      <div className="photoStackControls">
        <button
          type="button"
          className="photoStackButton"
          onClick={showPrevious}
          disabled={count < 2}
          aria-label="Previous photo"
        >
          <ChevronLeft size={18} strokeWidth={2.2} />
        </button>
        <span className="photoStackCounter">
          {index + 1} / {count}
        </span>
        <button
          type="button"
          className="photoStackButton"
          onClick={showNext}
          disabled={count < 2}
          aria-label="Next photo"
        >
          <ChevronRight size={18} strokeWidth={2.2} />
        </button>
      </div>

      {current.caption ? (
        <div className="photoStackCaption">{current.caption}</div>
      ) : null}

      <div className="photoStackPreload" aria-hidden="true">
        {neighbors.map((src) => (
          <img key={src} src={src} alt="" />
        ))}
      </div>
    </div>
  );
};

export default PhotoStack;
