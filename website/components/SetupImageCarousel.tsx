"use client";

import { useState } from "react";

export type SetupImageCarouselImage = {
  alt: string;
  src: string;
};

export function SetupImageCarousel({
  images,
  label
}: {
  images: SetupImageCarouselImage[];
  label: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  if (!activeImage) {
    return null;
  }

  function goToNextImage(direction: -1 | 1) {
    setActiveIndex((currentIndex) =>
      (currentIndex + direction + images.length) % images.length
    );
  }

  return (
    <div
      aria-label={label}
      aria-roledescription="carousel"
      className="stitch-detail-carousel"
    >
      <figure className="stitch-detail-carousel__slide">
        <img alt={activeImage.alt} src={activeImage.src} />
      </figure>
      {images.length > 1 ? (
        <>
          <button
            aria-label="Previous setup image"
            className="stitch-detail-carousel__control stitch-detail-carousel__control--prev"
            onClick={() => goToNextImage(-1)}
            type="button"
          >
            &lt;
          </button>
          <button
            aria-label="Next setup image"
            className="stitch-detail-carousel__control stitch-detail-carousel__control--next"
            onClick={() => goToNextImage(1)}
            type="button"
          >
            &gt;
          </button>
        </>
      ) : null}
    </div>
  );
}
