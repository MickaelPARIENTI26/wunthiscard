'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Ticket, HelpCircle, Trophy, ArrowRight, Shield, Sparkles, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HowItWorksPreviewProps {
  className?: string;
}

const steps = [
  {
    icon: Search,
    title: 'Choose Competition',
    description: 'Browse our selection of premium collectible cards and memorabilia competitions.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-400',
  },
  {
    icon: Ticket,
    title: 'Select Tickets',
    description: 'Pick your lucky numbers or let us choose randomly. Buy more for bonus tickets!',
    gradient: 'from-emerald-500/20 to-green-500/20',
    iconColor: 'text-emerald-400',
  },
  {
    icon: HelpCircle,
    title: 'Answer Question',
    description: 'Answer a simple skill question to validate your entry. It is easy!',
    gradient: 'from-purple-500/20 to-violet-500/20',
    iconColor: 'text-purple-400',
  },
  {
    icon: Trophy,
    title: 'Win Amazing Prizes',
    description: 'Wait for the draw and you could win incredible collectibles worth thousands!',
    gradient: 'from-amber-500/20 to-yellow-500/20',
    iconColor: 'text-primary',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function HowItWorksPreview({ className }: HowItWorksPreviewProps) {
  return (
    <section
      className={cn('py-16 md:py-20 lg:py-24 relative', className)}
      style={{
        background: 'linear-gradient(180deg, oklch(0.06 0.02 270) 0%, oklch(0.08 0.02 270) 50%, oklch(0.06 0.02 270) 100%)',
      }}
    >
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, oklch(0.25 0.02 270) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14 md:mb-18"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 font-[family-name:var(--font-display)]">
            <span className="text-gradient-gold">How It Works</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Enter our prize competitions in 4 simple steps and win amazing collectibles
          </p>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                variants={itemVariants}
                className="relative text-center group"
              >
                {/* Connector Line (Desktop only) */}
                {index < steps.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-14 left-[60%] w-[80%] h-px"
                    style={{
                      background: 'linear-gradient(90deg, oklch(0.3 0.02 270) 0%, oklch(0.2 0.02 270) 100%)',
                    }}
                  >
                    <div
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                      style={{ background: 'oklch(0.3 0.02 270)' }}
                    />
                  </div>
                )}

                {/* Step Number */}
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center z-10"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.82 0.165 85) 0%, oklch(0.65 0.18 85) 100%)',
                    color: 'black',
                  }}
                >
                  {index + 1}
                </div>

                {/* Icon Container */}
                <div
                  className={cn(
                    'w-24 h-24 md:w-28 md:h-28 rounded-2xl mx-auto mb-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-105',
                    `bg-gradient-to-br ${step.gradient}`
                  )}
                  style={{
                    border: '1px solid oklch(0.25 0.02 270)',
                  }}
                >
                  <Icon className={cn('w-12 h-12', step.iconColor)} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold mb-3 font-[family-name:var(--font-display)]">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-14"
        >
          <Button
            asChild
            size="lg"
            className="font-semibold group"
            style={{
              background: 'linear-gradient(135deg, oklch(0.82 0.165 85) 0%, oklch(0.65 0.18 85) 100%)',
              color: 'black',
            }}
          >
            <Link href="/how-it-works" className="flex items-center gap-2">
              Learn More
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 md:mt-20 pt-8"
          style={{
            borderTop: '1px solid oklch(0.2 0.02 270)',
          }}
        >
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 text-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.15 0.05 140) 0%, oklch(0.12 0.04 140) 100%)',
                  border: '1px solid oklch(0.25 0.05 140)',
                }}
              >
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <span>UK Based</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.15 0.05 250) 0%, oklch(0.12 0.04 250) 100%)',
                  border: '1px solid oklch(0.25 0.05 250)',
                }}
              >
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <span>Certified RNG</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.15 0.05 300) 0%, oklch(0.12 0.04 300) 100%)',
                  border: '1px solid oklch(0.25 0.05 300)',
                }}
              >
                <Mail className="w-5 h-5 text-purple-400" />
              </div>
              <span>Free Postal Entry</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.15 0.05 85) 0%, oklch(0.12 0.04 85) 100%)',
                  border: '1px solid oklch(0.25 0.05 85)',
                }}
              >
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <span>Secure Payments</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
