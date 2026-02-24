'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HowItWorksPreviewProps {
  className?: string;
}

// Step data with specific colors for each step
const steps = [
  {
    number: 1,
    emoji: '🔍',
    title: 'Browse',
    description: 'Explore our live competitions and choose the graded card you want to win.',
    bgGradient: 'linear-gradient(135deg, #FFF8E7, #FFF0CC)',
    borderColor: 'rgba(232, 160, 0, 0.12)',
    numberBg: '#E8A000',
    shadowColor: 'rgba(232, 160, 0, 0.25)',
    hoverShadow: 'rgba(232, 160, 0, 0.12)',
  },
  {
    number: 2,
    emoji: '🧠',
    title: 'Answer',
    description: 'Answer a simple skill-based question to qualify for entry.',
    bgGradient: 'linear-gradient(135deg, #EFF4FF, #DBEAFE)',
    borderColor: 'rgba(37, 99, 235, 0.12)',
    numberBg: '#2563EB',
    shadowColor: 'rgba(37, 99, 235, 0.25)',
    hoverShadow: 'rgba(37, 99, 235, 0.12)',
  },
  {
    number: 3,
    emoji: '🎟️',
    title: 'Enter',
    description: 'Purchase your tickets securely. Starting from just £14.99 each.',
    bgGradient: 'linear-gradient(135deg, #EEFFF4, #DCFCE7)',
    borderColor: 'rgba(22, 163, 74, 0.12)',
    numberBg: '#16A34A',
    shadowColor: 'rgba(22, 163, 74, 0.25)',
    hoverShadow: 'rgba(22, 163, 74, 0.12)',
  },
  {
    number: 4,
    emoji: '🎬',
    title: 'Win',
    description: 'Watch the live draw streamed on TikTok. Fully transparent, every time.',
    bgGradient: 'linear-gradient(135deg, #FFF5F5, #FEE2E2)',
    borderColor: 'rgba(239, 68, 68, 0.12)',
    numberBg: '#EF4444',
    shadowColor: 'rgba(239, 68, 68, 0.25)',
    hoverShadow: 'rgba(239, 68, 68, 0.12)',
  },
];

// Trust badges data
const trustBadges = [
  { emoji: '🔒', text: 'Secure Payments' },
  { emoji: '🎬', text: 'Live Draws' },
  { emoji: '📦', text: 'Free Delivery' },
  { emoji: '✉️', text: 'Free Postal Entry' },
  { emoji: '⭐', text: 'PSA 10 Authenticated' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

export function HowItWorksPreview({ className }: HowItWorksPreviewProps) {
  return (
    <>
      {/* How It Works Section */}
      <section
        className={cn('relative', className)}
        style={{
          background: 'linear-gradient(180deg, #ffffff, #FDFCF9)',
          padding: '80px 40px',
        }}
      >
        <div className="container mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2
              className="font-[family-name:var(--font-outfit)] mb-3"
              style={{
                fontSize: '34px',
                fontWeight: 700,
                color: '#1a1a2e',
              }}
            >
              How It Works
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
              Enter any competition in four simple steps.
            </p>
          </motion.div>

          {/* Steps Grid - 4 columns */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {steps.map((step) => (
              <motion.div
                key={step.number}
                variants={itemVariants}
                className="group"
              >
                <div
                  className="h-full text-center transition-all duration-[350ms] ease-out"
                  style={{
                    background: step.bgGradient,
                    border: `1.5px solid ${step.borderColor}`,
                    borderRadius: '22px',
                    padding: '32px 18px',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.transform = 'translateY(-6px)';
                    el.style.boxShadow = `0 16px 40px ${step.hoverShadow}`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.transform = 'translateY(0)';
                    el.style.boxShadow = 'none';
                  }}
                >
                  {/* Emoji Icon */}
                  <div style={{ fontSize: '40px', lineHeight: 1, marginBottom: '16px' }}>
                    {step.emoji}
                  </div>

                  {/* Step Number */}
                  <div
                    className="mx-auto flex items-center justify-center mb-4"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: step.numberBg,
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 800,
                      boxShadow: `0 4px 12px ${step.shadowColor}`,
                    }}
                  >
                    {step.number}
                  </div>

                  {/* Title */}
                  <h3
                    className="font-[family-name:var(--font-outfit)] mb-3"
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#1a1a2e',
                    }}
                  >
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      lineHeight: 1.6,
                    }}
                  >
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <div
        className="flex flex-wrap justify-center items-center"
        style={{
          background: '#F0F0F4',
          padding: '24px 40px',
          gap: '40px',
        }}
      >
        {trustBadges.map((badge) => (
          <div
            key={badge.text}
            className="flex items-center"
            style={{ gap: '8px' }}
          >
            <span style={{ fontSize: '16px' }}>{badge.emoji}</span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#555',
              }}
            >
              {badge.text}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
