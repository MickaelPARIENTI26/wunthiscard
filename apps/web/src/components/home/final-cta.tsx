'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FinalCTAProps {
  className?: string;
}

export function FinalCTA({ className }: FinalCTAProps) {
  return (
    <section className={cn('py-20 md:py-28 relative overflow-hidden', className)}>
      {/* Background with gold gradient accents */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, oklch(0.08 0.02 270) 0%, oklch(0.10 0.02 270) 50%, oklch(0.08 0.02 270) 100%)',
        }}
      />

      {/* Gold glow decorations */}
      <div
        className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none"
        style={{ background: 'oklch(0.82 0.165 85 / 0.08)' }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'oklch(0.82 0.165 85 / 0.05)' }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, oklch(0.82 0.165 85) 0%, oklch(0.65 0.18 85) 100%)',
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              delay: i * 0.3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl mx-auto mb-8 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, oklch(0.82 0.165 85) 0%, oklch(0.65 0.18 85) 100%)',
            }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-2xl" />
            <Trophy className="w-10 h-10 md:w-12 md:h-12 text-black relative z-10" />

            {/* Sparkle decorations */}
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse" />
          </motion.div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 font-[family-name:var(--font-display)]" style={{ color: '#f5f5f5' }}>
            Ready to{' '}
            <span className="text-gradient-gold">Win</span>?
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: '#a0a0a0' }}>
            Browse our live competitions and enter for your chance to win incredible collectible cards and memorabilia. Your next big win could be just one ticket away!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="text-lg px-8 font-semibold group relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, oklch(0.82 0.165 85) 0%, oklch(0.65 0.18 85) 100%)',
                color: 'black',
              }}
            >
              <Link href="/competitions" className="flex items-center gap-2">
                <span className="relative z-10 flex items-center gap-2">
                  View Competitions
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-lg px-8 group"
              style={{
                background: 'transparent',
                borderColor: 'oklch(0.4 0.02 270)',
              }}
            >
              <Link href="/register" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Create Free Account
              </Link>
            </Button>
          </div>

          {/* Additional Info */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-10 text-sm text-muted-foreground"
            style={{ color: '#a0a0a0' }}
          >
            18+ Only. Free postal entry available on all competitions.{' '}
            <Link
              href="/terms"
              className="text-primary/80 hover:text-primary underline-offset-2 hover:underline transition-colors"
            >
              Terms apply
            </Link>
            .
          </motion.p>
        </motion.div>
      </div>

      {/* Bottom gold gradient line */}
      <div
        className="absolute bottom-0 inset-x-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, oklch(0.65 0.18 85 / 0.3) 50%, transparent 100%)',
        }}
      />
    </section>
  );
}
