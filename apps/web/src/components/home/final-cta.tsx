'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FinalCTAProps {
  className?: string;
}

export function FinalCTA({ className }: FinalCTAProps) {
  return (
    <section className={cn('py-16 md:py-24 relative overflow-hidden', className)}>
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

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
            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 mx-auto mb-6 flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-primary" />
          </motion.div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Ready to{' '}
            <span className="text-primary">Win</span>?
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Browse our live competitions and enter for your chance to win incredible collectible cards and memorabilia. Your next big win could be just one ticket away!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/competitions" className="flex items-center gap-2">
                View Competitions
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/auth/register">
                Create Free Account
              </Link>
            </Button>
          </div>

          {/* Additional Info */}
          <p className="mt-8 text-sm text-muted-foreground">
            18+ Only. Free postal entry available on all competitions.{' '}
            <Link href="/terms" className="underline hover:text-foreground transition-colors">
              Terms apply
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </section>
  );
}
