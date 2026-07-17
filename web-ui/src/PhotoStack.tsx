import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./App.css";

export type PhotoStackImage = {
  src: string;
  caption?: string;
};

type PhotoStackProps = {
  images: PhotoStackImage[];
};

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

  const count = images.length;
  if (count === 0) return null;

  const current = images[index];
  const neighbors =
    count > 1
      ? [images[(index + 1) % count].src, images[(index - 1 + count) % count].src]
      : [];

  const showPrevious = () => setIndex((i) => (i - 1 + count) % count);
  const showNext = () => setIndex((i) => (i + 1) % count);

  return (
    <div className="photoStack">
      <div className="photoStackPile">
        <div className="photoStackCard photoStackCardBehindTwo" aria-hidden="true" />
        <div className="photoStackCard photoStackCardBehindOne" aria-hidden="true" />
        <figure className="photoStackCard photoStackCardTop" key={index}>
          <img
            src={current.src}
            alt={current.caption ?? ""}
            className="photoStackImage"
          />
        </figure>
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
