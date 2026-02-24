'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

export interface MediaItem {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  thumbnail?: string; // For videos
}

interface MediaGalleryProps {
  media: MediaItem[];
  fallbackImage?: string | null;
  fallbackAlt?: string;
  categoryColor: string;
  categoryEmoji: string;
}

export function MediaGallery({
  media,
  fallbackImage,
  fallbackAlt = 'Competition image',
  categoryColor,
  categoryEmoji,
}: MediaGalleryProps) {
  // Use media array or fallback to single image
  const items: MediaItem[] = media.length > 0
    ? media
    : fallbackImage
      ? [{ type: 'image', src: fallbackImage, alt: fallbackAlt }]
      : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const activeItem = items[activeIndex];
  const hasMultiple = items.length > 1;

  // 3D tilt effect handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || activeItem?.type === 'video') return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = ((y - centerY) / centerY) * -5;
    const tiltY = ((x - centerX) / centerX) * 5;
    const shineX = (x / rect.width) * 100;
    const shineY = (y / rect.height) * 100;

    setTilt({ x: tiltX, y: tiltY });
    setShine({ x: shineX, y: shineY });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setTilt({ x: 0, y: 0 });
    setShine({ x: 50, y: 50 });
  };

  const goToPrevious = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const goToNext = () => {
    if (activeIndex < items.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };

  if (items.length === 0) {
    // No media - show placeholder
    return (
      <div
        style={{
          aspectRatio: '3/4',
          borderRadius: '20px',
          background: `linear-gradient(135deg, ${categoryColor}15 0%, ${categoryColor}05 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: '80px' }}>{categoryEmoji}</span>
      </div>
    );
  }

  return (
    <div className="media-gallery">
      {/* CSS for transitions */}
      <style>{`
        .media-gallery-main {
          transition: opacity 0.3s ease;
        }
        .media-gallery-arrow {
          opacity: 0;
          transition: all 0.2s ease;
        }
        .media-gallery:hover .media-gallery-arrow {
          opacity: 1;
        }
        .media-gallery-arrow:hover {
          background: rgba(255, 255, 255, 0.95) !important;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }
        .thumbnail-item {
          transition: all 0.2s ease;
        }
        .thumbnail-item:hover:not(.active) {
          opacity: 1 !important;
          border-color: rgba(0, 0, 0, 0.1) !important;
        }
        .thumbnail-play:hover {
          background: rgba(0, 0, 0, 0.7) !important;
        }
        /* Hide scrollbar but allow scroll */
        .thumbnails-container {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .thumbnails-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Main Image/Video Container */}
      <div
        ref={containerRef}
        className="media-gallery-main"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'relative',
          aspectRatio: '3/4',
          borderRadius: '20px',
          overflow: 'hidden',
          cursor: activeItem?.type === 'video' ? 'default' : 'pointer',
        }}
      >
        {/* Glow background */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${categoryColor}18 0%, transparent 70%)`,
            filter: 'blur(60px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Content container with 3D tilt (only for images) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transform: isHovering && activeItem?.type === 'image'
              ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
              : 'perspective(800px) rotateX(0deg) rotateY(0deg)',
            transition: isHovering ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Card background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '20px',
              background: `linear-gradient(135deg, ${categoryColor}15 0%, ${categoryColor}05 100%)`,
              boxShadow: isHovering
                ? `0 20px 60px ${categoryColor}33`
                : '0 12px 40px rgba(0, 0, 0, 0.12)',
              transition: 'box-shadow 0.3s ease-out',
            }}
          />

          {/* Image or Video */}
          {activeItem?.type === 'image' ? (
            <Image
              key={activeItem.src}
              src={activeItem.src}
              alt={activeItem.alt || 'Competition image'}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 45vw"
              priority
            />
          ) : activeItem?.type === 'video' ? (
            <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
              {activeItem.src.includes('youtube.com') || activeItem.src.includes('youtu.be') ? (
                <iframe
                  src={activeItem.src.replace('watch?v=', 'embed/')}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '20px',
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : activeItem.src.includes('tiktok.com') ? (
                <iframe
                  src={activeItem.src}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '20px',
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={activeItem.src}
                  controls
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: '20px',
                  }}
                />
              )}
            </div>
          ) : null}

          {/* Holographic shine overlay (only for images) */}
          {activeItem?.type === 'image' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '20px',
                backgroundImage: isHovering
                  ? `linear-gradient(
                      ${45 + (shine.x - 50) * 0.5}deg,
                      transparent 30%,
                      rgba(255, 255, 255, 0.12) 45%,
                      rgba(255, 255, 255, 0.18) 50%,
                      rgba(255, 255, 255, 0.12) 55%,
                      transparent 70%
                    )`
                  : 'none',
                backgroundPosition: `${shine.x}% ${shine.y}%`,
                pointerEvents: 'none',
                zIndex: 2,
                opacity: isHovering ? 1 : 0,
                transition: 'opacity 0.2s ease-out',
              }}
            />
          )}
        </div>

        {/* Navigation Arrows (only if multiple items) */}
        {hasMultiple && (
          <>
            {/* Left Arrow */}
            {activeIndex > 0 && (
              <button
                onClick={goToPrevious}
                className="media-gallery-arrow"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                }}
              >
                <ChevronLeft style={{ width: '18px', height: '18px', color: '#1a1a2e' }} />
              </button>
            )}

            {/* Right Arrow */}
            {activeIndex < items.length - 1 && (
              <button
                onClick={goToNext}
                className="media-gallery-arrow"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                }}
              >
                <ChevronRight style={{ width: '18px', height: '18px', color: '#1a1a2e' }} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Thumbnails (only if multiple items) */}
      {hasMultiple && (
        <div
          className="thumbnails-container"
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '12px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            const thumbnailSrc = item.type === 'video'
              ? item.thumbnail || '/images/video-placeholder.webp'
              : item.src;

            return (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`thumbnail-item ${isActive ? 'active' : ''}`}
                style={{
                  position: 'relative',
                  width: '64px',
                  height: '64px',
                  flexShrink: 0,
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: isActive
                    ? `2px solid ${categoryColor}`
                    : '2px solid transparent',
                  boxShadow: isActive
                    ? `0 2px 10px ${categoryColor}33`
                    : 'none',
                  opacity: isActive ? 1 : 0.6,
                  cursor: 'pointer',
                  padding: 0,
                  background: 'none',
                }}
              >
                <Image
                  src={thumbnailSrc}
                  alt={item.alt || `Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />

                {/* Play icon for videos */}
                {item.type === 'video' && (
                  <div
                    className="thumbnail-play"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Play
                      style={{
                        width: '12px',
                        height: '12px',
                        color: '#ffffff',
                        marginLeft: '2px',
                      }}
                      fill="#ffffff"
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          .thumbnail-item {
            width: 56px !important;
            height: 56px !important;
          }
        }
        @media (max-width: 640px) {
          .thumbnail-item {
            width: 48px !important;
            height: 48px !important;
          }
          .thumbnail-play {
            width: 20px !important;
            height: 20px !important;
          }
          .thumbnail-play svg {
            width: 10px !important;
            height: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
