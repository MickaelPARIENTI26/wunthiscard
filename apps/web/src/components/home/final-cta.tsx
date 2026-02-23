'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Sparkles, ArrowRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FinalCTAProps {
  className?: string;
}

export function FinalCTA({ className }: FinalCTAProps) {
  const t = useTranslations();

  return (
    <section className={cn('py-20 md:py-28 relative overflow-hidden', className)}>
      {/* CTA gradient background */}
      <div className="absolute inset-0 cta-gradient" />

      {/* Gold glow decorations */}
      <div
        className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none"
        style={{ background: 'rgba(240, 185, 11, 0.08)' }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'rgba(240, 185, 11, 0.05)' }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #F0B90B 0%, #C9990A 100%)',
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
              background: 'linear-gradient(135deg, #F0B90B 0%, #C9990A 100%)',
            }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-2xl" />
            <Trophy className="w-10 h-10 md:w-12 md:h-12 relative z-10" style={{ color: '#12151e' }} />

            {/* Sparkle decorations */}
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse" />
          </motion.div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 font-[family-name:var(--font-outfit)]" style={{ color: '#ffffff' }}>
            {t('cta.title')}
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: '#7a7e90' }}>
            {t('cta.subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="text-lg px-8 font-semibold group relative overflow-hidden btn-primary-gold"
            >
              <Link href="/competitions" className="flex items-center gap-2">
                <span className="relative z-10 flex items-center gap-2">
                  {t('common.viewCompetitions')}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-lg px-8 group btn-secondary-dark"
            >
              <Link href="/register" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {t('common.createFreeAccount')}
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
            style={{ color: '#7a7e90' }}
          >
            {t('cta.disclaimer')}{' '}
            <Link
              href="/terms"
              className="text-primary/80 hover:text-primary underline-offset-2 hover:underline transition-colors"
            >
              {t('cta.termsApply')}
            </Link>
            .
          </motion.p>
        </motion.div>
      </div>

      {/* Bottom gold gradient line */}
      <div
        className="absolute bottom-0 inset-x-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(240, 185, 11, 0.3) 50%, transparent 100%)',
        }}
      />
    </section>
  );
}
