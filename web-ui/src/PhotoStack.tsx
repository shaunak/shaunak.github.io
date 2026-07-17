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

// How the in-flight card reconciles its size with the photo taking the front
// slot. Prototype switcher below; pick one and delete the rest before deploy.
export type ShuffleVariant = "shrink" | "fade" | "recede" | "flip";

export const SHUFFLE_VARIANTS: { id: ShuffleVariant; label: string }[] = [
  { id: "shrink", label: "Shrink to fit" },
  { id: "fade", label: "Fade away" },
  { id: "recede", label: "Scale recede" },
  { id: "flip", label: "3D tuck" },
];

const VARIANT_STORAGE_KEY = "photoStackVariant";
const VARIANT_EVENT = "photostack-variant-change";

export function getShuffleVariant(): ShuffleVariant {
  const stored = window.localStorage?.getItem(VARIANT_STORAGE_KEY);
  return SHUFFLE_VARIANTS.some((v) => v.id === stored)
    ? (stored as ShuffleVariant)
    : "shrink";
}

export function setShuffleVariant(variant: ShuffleVariant) {
  window.localStorage?.setItem(VARIANT_STORAGE_KEY, variant);
  window.dispatchEvent(new Event(VARIANT_EVENT));
}

type FlyingCard = {
  dir: "next" | "prev";
  src: string;
  fromWidth?: number;
  fromHeight?: number;
  toWidth?: number;
  toHeight?: number;
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
  const [variant, setVariant] = useState<ShuffleVariant>(getShuffleVariant);
  const topImageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // State updates lag same-tick clicks, so the in-flight guard lives in a ref.
  const inFlightRef = useRef(false);

  const count = images.length;

  useEffect(() => {
    const sync = () => setVariant(getShuffleVariant());
    window.addEventListener(VARIANT_EVENT, sync);
    return () => window.removeEventListener(VARIANT_EVENT, sync);
  }, []);

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

  // Slot size a photo will render at, if the browser has it cached.
  const probeSlotSize = (src: string) => {
    const probe = new Image();
    probe.src = src;
    return probe.complete && probe.naturalWidth > 0
      ? fitToSlot(probe.naturalWidth, probe.naturalHeight)
      : null;
  };

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
    // index is committed when the card lands, in the effect above.
  };

  const flyStyle = (card: FlyingCard): React.CSSProperties | undefined => {
    if (!card.fromWidth || !card.fromHeight || !card.toWidth || !card.toHeight) {
      return undefined;
    }
    // "recede" shrinks the whole card to the width of the card it hides
    // behind (next) or grows out from it (prev).
    const smaller = Math.min(
      card.toWidth / card.fromWidth,
      card.toHeight / card.fromHeight
    );
    return {
      "--flyFromW": `${card.fromWidth}px`,
      "--flyFromH": `${card.fromHeight}px`,
      "--flyToW": `${card.toWidth}px`,
      "--flyToH": `${card.toHeight}px`,
      "--tuckScale": Math.min(smaller, 1),
    } as React.CSSProperties;
  };

  const flyImageStyle = (card: FlyingCard): React.CSSProperties | undefined => {
    // The static size of the in-flight photo: the size it left the front at
    // (next), or the size it will land on the front at (prev). Variant
    // animations in App.css interpolate between the CSS vars above.
    const width = card.dir === "next" ? card.fromWidth : card.toWidth;
    const height = card.dir === "next" ? card.fromHeight : card.toHeight;
    if (!width || !height) return undefined;
    return { width, height, maxWidth: "none" };
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
            } photoStackVariant-${variant}`}
            style={flyStyle(flying)}
            aria-hidden="true"
          >
            <figure className="photoStackCard photoStackFlyCard">
              <img
                src={flying.src}
                alt=""
                className="photoStackImage"
                style={flyImageStyle(flying)}
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

// Prototype-only floating panel for comparing shuffle variants live.
// Remove (along with the variant plumbing above) once a winner is chosen.
export const PhotoStackLabSwitcher = () => {
  const [variant, setVariantState] = useState<ShuffleVariant>(getShuffleVariant);

  const choose = (v: ShuffleVariant) => {
    setShuffleVariant(v);
    setVariantState(v);
  };

  return (
    <div className="photoStackLab">
      <div className="photoStackLabTitle">Shuffle lab</div>
      {SHUFFLE_VARIANTS.map((v) => (
        <button
          key={v.id}
          type="button"
          className={`photoStackLabOption${
            v.id === variant ? " photoStackLabOptionActive" : ""
          }`}
          onClick={() => choose(v.id)}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
};

export default PhotoStack;
