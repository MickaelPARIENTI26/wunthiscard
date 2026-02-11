'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ImageGallery({ images, alt, className }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const allImages = images.length > 0 ? images : ['/images/placeholder.jpg'];
  const currentImage = allImages[selectedIndex] ?? allImages[0] ?? '/images/placeholder.jpg';

  const goToPrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  }, [allImages.length]);

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  }, [allImages.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;

      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, goToPrevious, goToNext]);

  // Touch swipe handling
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    const touch = e.targetTouches[0];
    if (touch) {
      setTouchStart(touch.clientX);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    if (touch) {
      setTouchEnd(touch.clientX);
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Main Image */}
      <div
        className="relative aspect-square overflow-hidden rounded-lg bg-muted"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Image
          src={currentImage}
          alt={`${alt} - Image ${selectedIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />

        {/* Zoom Button */}
        <button
          onClick={() => setIsLightboxOpen(true)}
          className="absolute bottom-3 right-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
          aria-label="View full size image"
        >
          <ZoomIn className="h-5 w-5" />
        </button>

        {/* Navigation Arrows (visible on desktop) */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/80 sm:flex"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/80 sm:flex"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Image Counter (mobile) */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur-sm sm:hidden">
            {selectedIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {allImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative h-16 w-16 flex-shrink-0 cursor-pointer overflow-hidden rounded-md transition-all',
                index === selectedIndex
                  ? 'ring-2 ring-primary ring-offset-2'
                  : 'opacity-60 hover:opacity-100'
              )}
              aria-label={`View image ${index + 1}`}
              aria-current={index === selectedIndex ? 'true' : 'false'}
            >
              <Image
                src={image}
                alt={`${alt} thumbnail ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[95vw] border-0 bg-black/95 p-0 sm:max-w-[90vw]">
          <DialogTitle className="sr-only">{alt} - Full size image</DialogTitle>
          <div
            className="relative flex h-[80vh] w-full items-center justify-center"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <Image
              src={currentImage}
              alt={`${alt} - Image ${selectedIndex + 1}`}
              fill
              sizes="90vw"
              className="object-contain"
              priority
            />

            {/* Close button */}
            <DialogClose className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/80">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DialogClose>

            {/* Navigation */}
            {allImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 hover:text-white"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 hover:text-white"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur-sm">
              {selectedIndex + 1} / {allImages.length}
            </div>
          </div>

          {/* Thumbnail strip in lightbox */}
          {allImages.length > 1 && (
            <div className="flex justify-center gap-2 bg-black/80 p-4">
              {allImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    'relative h-12 w-12 flex-shrink-0 cursor-pointer overflow-hidden rounded transition-all',
                    index === selectedIndex
                      ? 'ring-2 ring-white'
                      : 'opacity-50 hover:opacity-100'
                  )}
                  aria-label={`View image ${index + 1}`}
                >
                  <Image
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
