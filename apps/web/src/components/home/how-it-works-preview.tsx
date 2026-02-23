'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Search, Ticket, HelpCircle, Trophy, ArrowRight, Shield, Sparkles, Mail, Lock, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HowItWorksPreviewProps {
  className?: string;
}

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  iconColor: string;
}

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
  const t = useTranslations('howItWorks');
  const tCommon = useTranslations('common');

  const steps: Step[] = [
    {
      icon: Search,
      title: t('step1Title'),
      description: t('step1Desc'),
      gradient: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-blue-400',
    },
    {
      icon: Ticket,
      title: t('step2Title'),
      description: t('step2Desc'),
      gradient: 'from-emerald-500/20 to-green-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      icon: HelpCircle,
      title: t('step3Title'),
      description: t('step3Desc'),
      gradient: 'from-purple-500/20 to-violet-500/20',
      iconColor: 'text-purple-400',
    },
    {
      icon: Trophy,
      title: t('step4Title'),
      description: t('step4Desc'),
      gradient: 'from-amber-500/20 to-yellow-500/20',
      iconColor: 'text-primary',
    },
  ];

  return (
    <section
      className={cn('py-16 md:py-20 lg:py-24 relative', className)}
      style={{
        background: 'linear-gradient(180deg, #12151e 0%, #161a28 50%, #12151e 100%)',
      }}
    >
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.1) 1px, transparent 0)`,
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
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 font-[family-name:var(--font-outfit)]">
            <span className="text-gradient-gold">{t('title')}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto" style={{ color: '#7a7e90' }}>
            {t('subtitle')}
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
                      background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    }}
                  >
                    <div
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                      style={{ background: 'rgba(255, 255, 255, 0.15)' }}
                    />
                  </div>
                )}

                {/* Step Number */}
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center z-10"
                  style={{
                    background: 'linear-gradient(135deg, #F0B90B 0%, #C9990A 100%)',
                    color: '#12151e',
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
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <Icon className={cn('w-12 h-12', step.iconColor)} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold mb-3 font-[family-name:var(--font-outfit)]" style={{ color: '#ffffff' }}>
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed" style={{ color: '#7a7e90' }}>
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
            className="font-semibold group btn-primary-gold"
          >
            <Link href="/how-it-works" className="flex items-center gap-2">
              {tCommon('learnMore')}
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
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 text-center text-sm text-muted-foreground" style={{ color: '#7a7e90' }}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(52, 199, 114, 0.15) 0%, rgba(52, 199, 114, 0.08) 100%)',
                  border: '1px solid rgba(52, 199, 114, 0.2)',
                }}
              >
                <Shield className="w-5 h-5" style={{ color: '#34C772' }} />
              </div>
              <span>{t('trustBadges.ukBased')}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.15) 0%, rgba(74, 144, 226, 0.08) 100%)',
                  border: '1px solid rgba(74, 144, 226, 0.2)',
                }}
              >
                <Sparkles className="w-5 h-5" style={{ color: '#4A90E2' }} />
              </div>
              <span>{t('trustBadges.certifiedRng')}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(155, 89, 182, 0.15) 0%, rgba(155, 89, 182, 0.08) 100%)',
                  border: '1px solid rgba(155, 89, 182, 0.2)',
                }}
              >
                <Mail className="w-5 h-5" style={{ color: '#9B59B6' }} />
              </div>
              <span>{t('trustBadges.freePostalEntry')}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(240, 185, 11, 0.15) 0%, rgba(240, 185, 11, 0.08) 100%)',
                  border: '1px solid rgba(240, 185, 11, 0.2)',
                }}
              >
                <Lock className="w-5 h-5" style={{ color: '#F0B90B' }} />
              </div>
              <span>{t('trustBadges.securePayments')}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
