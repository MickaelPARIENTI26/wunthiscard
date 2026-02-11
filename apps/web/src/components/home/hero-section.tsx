'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CountdownTimer } from '@/components/common/countdown-timer';
import { cn } from '@/lib/utils';

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

export function HeroSection({ featuredCompetition, className }: HeroSectionProps) {
  if (!featuredCompetition) {
    return (
      <section className={cn('relative min-h-[70vh] flex items-center', className)}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Win{' '}
              <span className="text-primary">Amazing</span>{' '}
              Collectibles
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Enter prize competitions to win rare Pokemon cards, One Piece TCG, sports memorabilia and more. UK-based with free postal entry available.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/competitions">View Competitions</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link href="/how-it-works">How It Works</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn('relative min-h-[80vh] md:min-h-[70vh] flex items-center overflow-hidden', className)}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={featuredCompetition.mainImageUrl}
          alt={featuredCompetition.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-white"
          >
            <Badge className="mb-4 bg-primary/90 hover:bg-primary text-primary-foreground">
              Featured Competition
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              {featuredCompetition.title}
            </h1>

            {featuredCompetition.subtitle && (
              <p className="text-lg md:text-xl text-white/80 mb-6">
                {featuredCompetition.subtitle}
              </p>
            )}

            {/* Prize Value */}
            <div className="mb-8">
              <p className="text-sm uppercase tracking-wider text-white/60 mb-1">
                Prize Value
              </p>
              <p className="text-4xl md:text-5xl font-bold text-primary">
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'GBP',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(featuredCompetition.prizeValue)}
              </p>
            </div>

            {/* Countdown */}
            <div className="mb-8">
              <p className="text-sm uppercase tracking-wider text-white/60 mb-3">
                Draw Ends In
              </p>
              <CountdownTimer
                targetDate={new Date(featuredCompetition.drawDate)}
                size="lg"
                showLabels={true}
              />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="text-lg px-8 bg-primary hover:bg-primary/90"
              >
                <Link href={`/competitions/${featuredCompetition.slug}`}>
                  Enter Now
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-lg px-8 border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/competitions">View All Competitions</Link>
              </Button>
            </div>
          </motion.div>

          {/* Featured Image (Hidden on mobile, shown on desktop) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden md:block"
          >
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent rounded-2xl" />
              <Image
                src={featuredCompetition.mainImageUrl}
                alt={featuredCompetition.title}
                fill
                priority
                sizes="(max-width: 768px) 0vw, 50vw"
                className="object-cover rounded-2xl shadow-2xl"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
