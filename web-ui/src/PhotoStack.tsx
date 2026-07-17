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
  width?: number;
  height?: number;
};

// Matches the animation-duration of photoStackFlyNext/Prev in App.css.
const SHUFFLE_MS = 620;
const MAX_PHOTO_HEIGHT_PX = 384;

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
  const topImageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // State updates lag same-tick clicks, so the in-flight guard lives in a ref.
  const inFlightRef = useRef(false);

  const count = images.length;

  useEffect(() => {
    if (!flying) return;
    const timer = window.setTimeout(() => {
      if (flying.dir === "prev") {
        setIndex((i) => (i - 1 + count) % count);
      }
      setFlying(null);
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

  // Fix the flying card to a known pixel size so it doesn't reflow when the
  // photo underneath it (which sizes the pile) has a different aspect ratio.
  const fitToSlot = (natWidth: number, natHeight: number) => {
    const maxWidth = containerRef.current?.clientWidth ?? Infinity;
    const scale = Math.min(
      MAX_PHOTO_HEIGHT_PX / natHeight,
      maxWidth / natWidth,
      1
    );
    return { width: natWidth * scale, height: natHeight * scale };
  };

  const showNext = () => {
    if (inFlightRef.current || count < 2) return;
    inFlightRef.current = true;
    const el = topImageRef.current;
    setFlying({
      dir: "next",
      src: current.src,
      width: el?.clientWidth,
      height: el?.clientHeight,
    });
    setIndex((i) => (i + 1) % count);
  };

  const showPrevious = () => {
    if (inFlightRef.current || count < 2) return;
    inFlightRef.current = true;
    const arriving = images[(index - 1 + count) % count];
    const probe = new Image();
    probe.src = arriving.src;
    const size =
      probe.complete && probe.naturalWidth > 0
        ? fitToSlot(probe.naturalWidth, probe.naturalHeight)
        : {};
    setFlying({ dir: "prev", src: arriving.src, ...size });
    // index is committed when the card lands, in the effect above.
  };

  return (
    <div className="photoStack" ref={containerRef}>
      <div
        className={`photoStackPile${flying ? " photoStackPileShuffling" : ""}`}
      >
        <div className="photoStackCard photoStackCardBehindTwo" aria-hidden="true" />
        <div className="photoStackCard photoStackCardBehindOne" aria-hidden="true" />
        <figure className="photoStackCard photoStackCardTop">
          <img
            ref={topImageRef}
            src={current.src}
            alt={current.caption ?? ""}
            className="photoStackImage"
          />
        </figure>
        {flying ? (
          <div
            className={`photoStackFly ${
              flying.dir === "next" ? "photoStackFlyNext" : "photoStackFlyPrev"
            }`}
            aria-hidden="true"
          >
            <figure className="photoStackCard photoStackFlyCard">
              <img
                src={flying.src}
                alt=""
                className="photoStackImage"
                style={
                  flying.width && flying.height
                    ? { width: flying.width, height: flying.height, maxWidth: "none" }
                    : undefined
                }
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
