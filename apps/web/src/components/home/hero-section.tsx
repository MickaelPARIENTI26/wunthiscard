'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CountdownTimer } from '@/components/common/countdown-timer';
import { cn } from '@/lib/utils';
import { Sparkles, Zap } from 'lucide-react';

interface FeaturedCompetition {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  mainImageUrl: string;
  prizeValue: number;
  drawDate: Date;
  category: string;
}

interface HeroSectionProps {
  featuredCompetition: FeaturedCompetition | null;
  className?: string;
}

// Floating particle component
function FloatingParticle({ delay, size, x, y }: { delay: number; size: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-gradient-to-br from-primary/40 to-primary/10"
      style={{ width: size, height: size, left: `${x}%`, top: `${y}%` }}
      animate={{
        y: [0, -30, 0],
        opacity: [0.3, 0.8, 0.3],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

export function HeroSection({ featuredCompetition, className }: HeroSectionProps) {
  if (!featuredCompetition) {
    return (
      <section className={cn('relative min-h-[80vh] flex items-center overflow-hidden', className)}>
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <FloatingParticle
              key={i}
              delay={i * 0.5}
              size={4 + (i % 3) * 4}
              x={10 + (i * 12)}
              y={20 + (i * 8) % 60}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="mb-6 bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30">
                <Sparkles className="w-3 h-3 mr-1" />
                Premium Collectibles
              </Badge>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6 font-[family-name:var(--font-display)]">
              Win{' '}
              <span className="text-gradient-gold">Rare</span>{' '}
              <br className="hidden sm:block" />
              Collectibles
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Enter prize competitions to win rare Pokemon cards, One Piece TCG, sports memorabilia and more. UK-based with free postal entry available.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 bg-primary hover:bg-primary/90 glow-gold-sm font-semibold">
                <Link href="/competitions">
                  <Zap className="w-5 h-5 mr-2" />
                  View Competitions
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 border-border hover:border-primary/50 hover:bg-primary/5">
                <Link href="/how-it-works">How It Works</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn('relative min-h-[90vh] md:min-h-[85vh] flex items-center overflow-hidden', className)}>
      {/* Dark Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card/50 to-background" />

      {/* Background Image with heavy overlay */}
      <div className="absolute inset-0">
        <Image
          src={featuredCompetition.mainImageUrl}
          alt={featuredCompetition.title}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30"
        />
        {/* Dark overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <FloatingParticle
            key={i}
            delay={i * 0.4}
            size={3 + (i % 4) * 3}
            x={5 + (i * 8)}
            y={15 + (i * 7) % 70}
          />
        ))}
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="mb-4 bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30">
                <Sparkles className="w-3 h-3 mr-1" />
                Featured Competition
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 font-[family-name:var(--font-display)]"
            >
              {featuredCompetition.title}
            </motion.h1>

            {featuredCompetition.subtitle && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-lg md:text-xl text-muted-foreground mb-6"
              >
                {featuredCompetition.subtitle}
              </motion.p>
            )}

            {/* Prize Value */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
                Prize Value
              </p>
              <p className="text-5xl md:text-6xl lg:text-7xl font-bold text-gradient-gold glow-gold-text tabular-nums font-[family-name:var(--font-display)]">
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'GBP',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(featuredCompetition.prizeValue)}
              </p>
            </motion.div>

            {/* Countdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8"
            >
              <p className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
                Draw Ends In
              </p>
              <CountdownTimer
                targetDate={new Date(featuredCompetition.drawDate)}
                size="lg"
                showLabels={true}
              />
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                asChild
                size="lg"
                className="text-lg px-8 bg-primary hover:bg-primary/90 glow-gold-sm font-semibold"
              >
                <Link href={`/competitions/${featuredCompetition.slug}`}>
                  <Zap className="w-5 h-5 mr-2" />
                  Enter Now
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-lg px-8 border-border hover:border-primary/50 hover:bg-primary/5"
              >
                <Link href="/competitions">View All Competitions</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Featured Card Image with holographic effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block"
          >
            <div className="relative max-w-md mx-auto">
              {/* Glow effect behind card */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-500/20 to-blue-500/20 blur-3xl scale-110" />

              {/* Card container with 3D effect */}
              <div className="relative card-3d">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-primary/30 glow-gold holo-shimmer">
                  <Image
                    src={featuredCompetition.mainImageUrl}
                    alt={featuredCompetition.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 0vw, 400px"
                    className="object-cover"
                  />

                  {/* Holographic overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent pointer-events-none" />

                  {/* Bottom gradient overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
