'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FinalCTAProps {
  className?: string;
}

export function FinalCTA({ className }: FinalCTAProps) {
  return (
    <section
      className={cn('relative overflow-hidden text-center', className)}
      style={{
        background: 'linear-gradient(135deg, #FFF8E7, #FFF0CC, #FFECB3, #FFF3D6)',
        padding: '72px 40px',
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(240, 185, 11, 0.12)',
          filter: 'blur(40px)',
          top: '-100px',
          left: '-50px',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'rgba(240, 185, 11, 0.12)',
          filter: 'blur(40px)',
          bottom: '-80px',
          right: '-30px',
        }}
      />

      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          {/* Title */}
          <h2
            className="font-[family-name:var(--font-outfit)] mb-4"
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: '#1a1a2e',
            }}
          >
            Ready to Enter?
          </h2>

          {/* Subtitle */}
          <p
            className="mb-8"
            style={{
              color: '#7a6830',
              fontSize: '15px',
            }}
          >
            Create your free account and browse our live competitions.
          </p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {/* Primary Button - Sign Up Free */}
            <Link
              href="/register"
              className="inline-flex items-center justify-center transition-all duration-300"
              style={{
                background: '#1a1a2e',
                color: '#ffffff',
                padding: '15px 40px',
                borderRadius: '14px',
                fontWeight: 600,
                fontSize: '15px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2a2a3e';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(26, 26, 46, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1a1a2e';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Sign Up Free
            </Link>

            {/* Secondary Button - View Competitions */}
            <Link
              href="/competitions"
              className="inline-flex items-center justify-center transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(184, 134, 11, 0.2)',
                color: '#8B6914',
                padding: '15px 40px',
                borderRadius: '14px',
                fontWeight: 600,
                fontSize: '15px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.borderColor = 'rgba(184, 134, 11, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                e.currentTarget.style.borderColor = 'rgba(184, 134, 11, 0.2)';
              }}
            >
              View Competitions
            </Link>
          </motion.div>

          {/* Legal Text */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            style={{
              color: '#B8A060',
              fontSize: '12px',
              marginTop: '24px',
            }}
          >
            18+ Only. Free postal entry available on all competitions. Terms apply.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
