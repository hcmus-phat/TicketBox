"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

interface ConcertItem {
  id: string;
  slug: string;
  title: string;
  artist: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  image: string;
  price: number;
  status: string;
  soldOut: boolean;
}

interface FeaturedCarouselProps {
  concerts: ConcertItem[];
}

export function FeaturedCarousel({ concerts }: FeaturedCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // We feature the top 5 concerts
  const featuredConcerts = concerts.slice(0, 5);

  const handleNext = () => {
    if (featuredConcerts.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % featuredConcerts.length);
  };

  const handlePrev = () => {
    if (featuredConcerts.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + featuredConcerts.length) % featuredConcerts.length);
  };

  // Autoplay
  useEffect(() => {
    if (isHovered || featuredConcerts.length <= 1) return;
    const interval = setInterval(handleNext, 5000);
    return () => clearInterval(interval);
  }, [isHovered, featuredConcerts.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    const swipeThreshold = 50;

    if (diff > swipeThreshold) {
      handleNext();
    } else if (diff < -swipeThreshold) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (featuredConcerts.length === 0) return null;

  const activeConcert = featuredConcerts[activeIndex];

  return (
    <div
      className="relative group w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slider Image Container */}
      <div 
        className="hero-card-float relative overflow-hidden rounded-[2rem] border border-border bg-foreground shadow-2xl shadow-foreground/10 aspect-[16/11]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="flex h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {featuredConcerts.map((concert) => (
            <Link 
              key={concert.id}
              href={`/concert/${concert.slug}`}
              className="relative w-full h-full shrink-0 block focus:outline-none"
            >
              <Image
                src={concert.image}
                alt={concert.title}
                fill
                priority
                loading="eager"
                sizes="(min-width: 1024px) 56vw, 100vw"
                className="object-cover transition-transform duration-700 hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              
              {/* Concert Title & Artist Text: constrained on desktop so it doesn't overlap the popup on the right */}
              <div className="absolute bottom-5 left-5 right-5 md:left-8 md:bottom-8 md:right-auto md:max-w-[calc(100%-360px)] text-white">
                <p className="text-sm font-bold text-white/70">{concert.artist}</p>
                <h2 className="mt-1 text-2xl md:text-3xl font-black tracking-tight line-clamp-2 leading-tight">
                  {concert.title}
                </h2>
              </div>
            </Link>
          ))}
        </div>

        {/* Navigation Dots */}
        {featuredConcerts.length > 1 && (
          <div className="absolute top-5 right-5 z-10 flex gap-1.5 bg-black/35 px-3 py-1.5 rounded-full backdrop-blur border border-white/10">
            {featuredConcerts.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`size-2 rounded-full transition-all duration-300 ${
                  i === activeIndex ? 'bg-primary w-4' : 'bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Navigation Buttons (only on screens with hover or always on mobile) */}
        {featuredConcerts.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur border border-white/10 flex items-center justify-center transition-all duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur border border-white/10 flex items-center justify-center transition-all duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {/* Floating Info Popup - positioned outside the aspect box to avoid clipping */}
      <Link 
        key={activeIndex} // Resetting key triggers the CSS entry animation automatically on change
        href={`/concert/${activeConcert.slug}`}
        className="block relative mt-6 left-0 right-0 rounded-3xl border border-border bg-card/95 p-5 shadow-xl shadow-foreground/10 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 md:absolute md:-bottom-[148px] md:left-auto md:right-8 md:w-80 md:mt-0 animate-slide-in cursor-pointer z-20"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Featured ticket</p>
            <p className="mt-1 text-lg font-black text-foreground">{activeConcert.price.toLocaleString('vi-VN')}đ</p>
          </div>
          <span className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
            {activeConcert.status}
          </span>
        </div>
        <div className="grid gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            {new Date(activeConcert.date).toLocaleDateString('vi-VN')} · {activeConcert.time}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            {activeConcert.venue}, {activeConcert.city}
          </div>
        </div>
      </Link>
    </div>
  );
}
