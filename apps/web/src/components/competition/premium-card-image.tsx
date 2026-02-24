'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface PremiumCardImageProps {
  src: string | null;
  alt: string;
  categoryColor: string;
  categoryEmoji: string;
}

export function PremiumCardImage({ src, alt, categoryColor, categoryEmoji }: PremiumCardImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate tilt (max ±5 degrees)
    const tiltX = ((y - centerY) / centerY) * -5;
    const tiltY = ((x - centerX) / centerX) * 5;

    // Calculate shine position
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

  return (
    <div
      ref={containerRef}
      className="premium-card-container"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        aspectRatio: '3/4',
        borderRadius: '20px',
        overflow: 'hidden',
        cursor: 'pointer',
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

      {/* Card container with 3D tilt */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transform: isHovering
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

        {/* Image */}
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 45vw"
            priority
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <span style={{ fontSize: '80px' }}>{categoryEmoji}</span>
          </div>
        )}

        {/* Holographic shine overlay */}
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
            transition: 'opacity 0.2s ease-out',
            opacity: isHovering ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
}
