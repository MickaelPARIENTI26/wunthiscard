'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowRight, Flame, Anchor, Dribbble, Trophy, Sparkles, Layers, Hexagon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Urgency helpers
function getUrgencyLevel(drawDate: Date, status: string): 'last-hours' | 'ending-soon' | null {
  if (status !== 'ACTIVE') return null;
  const diff = new Date(drawDate).getTime() - Date.now();
  if (diff <= 0) return null;
  if (diff < 3 * 60 * 60 * 1000) return 'last-hours';
  if (diff < 24 * 60 * 60 * 1000) return 'ending-soon';
  return null;
}

interface CompetitionCardProps {
  id: string;
  slug: string;
  title: string;
  mainImageUrl: string;
  category: string;
  prizeValue: number;
  ticketPrice: number;
  totalTickets: number | null;
  soldTickets: number;
  drawDate: Date;
  status: string;
  isFree?: boolean;
  isMystery?: boolean;
  isRevealed?: boolean;
  createdAt?: Date;
  drawType?: string;
  prizeCount?: number;
  className?: string;
  index?: number;
}

// Category configuration with Lucide icons
const categoryConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string }> = {
  POKEMON: { label: 'Pokemon', icon: Flame, color: '#F0B90B' },
  ONE_PIECE: { label: 'One Piece', icon: Anchor, color: '#EF4444' },
  SPORTS_BASKETBALL: { label: 'Basketball', icon: Dribbble, color: '#3B82F6' },
  SPORTS_FOOTBALL: { label: 'Football', icon: Trophy, color: '#22C55E' },
  SPORTS_OTHER: { label: 'Sports', icon: Trophy, color: '#3B82F6' },
  MEMORABILIA: { label: 'Memorabilia', icon: Sparkles, color: '#A855F7' },
  YUGIOH: { label: 'Yu-Gi-Oh!', icon: Layers, color: '#8B5CF6' },
  MTG: { label: 'MTG', icon: Hexagon, color: '#64748B' },
  OTHER: { label: 'Other', icon: Layers, color: '#6B7280' },
};

export function CompetitionCard({
  slug,
  title,
  mainImageUrl,
  category,
  prizeValue,
  ticketPrice,
  totalTickets,
  soldTickets,
  drawDate,
  status,
  isFree = false,
  isMystery = false,
  isRevealed = false,
  drawType = 'single',
  prizeCount = 1,
  className,
  index = 0,
}: CompetitionCardProps) {
  const t = useTranslations('competitions');
  const isActive = status === 'ACTIVE';
  const isSoldOut = status === 'SOLD_OUT';

  const soldPercentage = totalTickets ? Math.round((soldTickets / totalTickets) * 100) : 0;
  const isHotSelling = totalTickets ? soldPercentage >= 75 : false;

  const defaultConfig = { label: 'Other', icon: Layers, color: '#6B7280' };
  const config = categoryConfig[category] ?? defaultConfig;
  const categoryColor = config.color;

  const urgency = useMemo(() => getUrgencyLevel(drawDate, status), [drawDate, status]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={cn('group', className)}
    >
      <Link href={`/competitions/${slug}`} className="block h-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:rounded-[20px]" style={{ outlineColor: categoryColor }}>
        <div
          className="h-full flex flex-col overflow-hidden competition-card hover:-translate-y-2 transition-all duration-[450ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
          style={{
            background: 'var(--bg-card)',
            border: urgency === 'last-hours'
              ? '2px solid rgba(239, 68, 68, 0.3)'
              : urgency === 'ending-soon'
              ? '2px solid rgba(245, 158, 11, 0.2)'
              : '1px solid var(--border-light)',
            borderRadius: '20px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            ['--cat-color' as string]: categoryColor,
          }}
        >
          {/* Image Zone - 9:16 Aspect Ratio */}
          <div
            className="relative flex items-center justify-center overflow-hidden"
            style={{
              aspectRatio: '9/16',
              maxHeight: '280px',
              background: isMystery && !isRevealed
                ? `linear-gradient(160deg, ${categoryColor}30, ${categoryColor}, ${categoryColor}30)`
                : mainImageUrl ? '#f5f5f7' : `linear-gradient(135deg, ${categoryColor}12 0%, ${categoryColor}05 50%, #f5f5f7 100%)`,
              borderRadius: '20px 20px 0 0',
            }}
          >
            {/* Mystery unrevealed: gradient + "?" */}
            {isMystery && !isRevealed ? (
              <span
                style={{
                  color: '#ffffff',
                  fontSize: '80px',
                  fontWeight: 900,
                  textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  animation: 'mysteryPulse 3s ease-in-out infinite',
                  userSelect: 'none',
                }}
              >
                ?
              </span>
            ) : mainImageUrl ? (
              <Image
                src={mainImageUrl}
                alt={title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                style={{ borderRadius: '20px 20px 0 0' }}
              />
            ) : (
              <config.icon
                className="w-16 h-16 md:w-20 md:h-20 transition-all duration-500 ease-out group-hover:scale-[1.15] group-hover:rotate-[-3deg]"
                style={{
                  color: categoryColor,
                  filter: `drop-shadow(0 12px 32px ${categoryColor}30)`,
                }}
              />
            )}

            {/* Mystery pulse animation */}
            {isMystery && !isRevealed && (
              <style>{`
                @keyframes mysteryPulse {
                  0%, 100% { transform: scale(1); }
                  50% { transform: scale(1.05); }
                }
              `}</style>
            )}

            {/* Category Badge - Top Left */}
            <div
              className="absolute top-4 left-4 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider z-10"
              style={{
                background: '#ffffff',
                border: `1px solid ${categoryColor}30`,
                color: categoryColor,
              }}
            >
              {config.label}
            </div>

            {/* Status Badge - Top Right */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
              {isMystery && !isRevealed && (
                <div
                  style={{
                    background: '#8B5CF6',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '8px',
                  }}
                >
                  MYSTERY
                </div>
              )}
              {isMystery && isRevealed && (
                <div
                  style={{
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: '#8B5CF6',
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '8px',
                  }}
                >
                  Was a Mystery
                </div>
              )}
              {drawType === 'multi' && prizeCount > 1 && (
                <div
                  style={{
                    background: '#8B5CF6',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '8px',
                  }}
                >
                  {prizeCount} Winners
                </div>
              )}
              {isFree && (
                <div
                  style={{
                    background: '#16A34A',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '8px',
                  }}
                >
                  FREE
                </div>
              )}
              {urgency === 'last-hours' ? (
                <div
                  className="urgency-badge-pulse px-3 py-1.5 rounded-lg text-[9px] font-bold"
                  style={{ background: '#EF4444', color: '#ffffff' }}
                >
                  Last Hours
                </div>
              ) : urgency === 'ending-soon' ? (
                <div
                  className="px-3 py-1.5 rounded-lg text-[9px] font-bold"
                  style={{ background: '#F59E0B', color: '#ffffff' }}
                >
                  Ending Soon
                </div>
              ) : (
                <div
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5"
                  style={{
                    background: '#ffffff',
                    border: `1px solid ${isHotSelling ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                    color: isHotSelling ? '#EF4444' : '#22C55E',
                  }}
                >
                  {isHotSelling ? (
                    <>{soldPercentage}% sold</>
                  ) : (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      Open
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Info Zone */}
          <div className="flex-1 flex flex-col" style={{ padding: '18px 22px 24px' }}>
            {/* Title */}
            <h3
              className="font-semibold line-clamp-2 mb-3 min-h-[2.5rem] font-[family-name:var(--font-outfit)]"
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#1a1a2e',
              }}
            >
              {title}
            </h3>

            {/* Prize Value */}
            <p
              className="font-[family-name:var(--font-outfit)] mb-4"
              style={{
                fontSize: '30px',
                fontWeight: 800,
                color: '#1a1a2e',
              }}
            >
              {isMystery && !isRevealed && (
                <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)', marginRight: '4px' }}>
                  From
                </span>
              )}
              {new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: 'GBP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(prizeValue)}
            </p>

            {drawType === 'multi' && prizeCount > 1 && (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-8px', marginBottom: '4px' }}>
                {prizeCount} cards to win
              </p>
            )}

            {/* Progress Bar */}
            <div className="mb-4">
              <div
                className="w-full rounded-full overflow-hidden"
                style={{
                  height: '6px',
                  background: '#f0f0f3',
                }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${soldPercentage}%`,
                    background: `linear-gradient(90deg, ${categoryColor} 0%, ${categoryColor}CC 100%)`,
                    boxShadow: `0 0 12px ${categoryColor}40`,
                  }}
                />
              </div>
              {/* Stats */}
              <div className="flex justify-between mt-2">
                <span style={{ fontSize: '11px', color: '#6b7088' }}>
                  {isFree ? (
                    totalTickets
                      ? `${soldTickets} / ${totalTickets} participants`
                      : `${soldTickets} participants`
                  ) : (
                    <>{soldTickets} / {totalTickets} {t('sold')}</>
                  )}
                </span>
                <span style={{ fontSize: '11px', color: '#9a9eb0' }}>
                  {isFree ? (
                    totalTickets ? `${totalTickets - soldTickets} spots left` : 'Unlimited'
                  ) : (
                    <>{(totalTickets ?? 0) - soldTickets} {t('ticketsLeft')}</>
                  )}
                </span>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Separator + Price + CTA */}
            <div
              style={{
                borderTop: '1px solid #f0f0f3',
                marginTop: '18px',
                paddingTop: '14px',
              }}
            >
              {/* Price */}
              <div className="flex items-baseline justify-between mb-3">
                {isFree ? (
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#16A34A' }}>
                    FREE
                  </span>
                ) : (
                  <>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>
                      {new Intl.NumberFormat('en-GB', {
                        style: 'currency',
                        currency: 'GBP',
                        minimumFractionDigits: 2,
                      }).format(ticketPrice)}
                    </span>
                    <span style={{ fontSize: '11px', color: '#9a9eb0' }}>
                      {t('perTicket')}
                    </span>
                  </>
                )}
              </div>

              {/* CTA Button */}
              <button
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 font-semibold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2",
                  isActive && !isSoldOut && "hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                )}
                style={{
                  background: isActive && !isSoldOut
                    ? (isFree ? '#16A34A' : 'var(--text-primary)')
                    : 'var(--bg-alt)',
                  color: isActive && !isSoldOut
                    ? '#ffffff'
                    : 'var(--text-muted)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  boxShadow: isActive && !isSoldOut
                    ? (isFree ? '0 4px 16px rgba(22, 163, 74, 0.3)' : '0 4px 16px rgba(26, 26, 46, 0.2)')
                    : 'none',
                  outlineColor: categoryColor,
                }}
              >
                {isActive && !isSoldOut ? (
                  <>
                    {isFree ? 'Enter for Free' : isMystery && !isRevealed ? 'Enter the Mystery' : t('enterNow')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : isSoldOut ? (
                  t('soldOut')
                ) : (
                  t('viewDetails')
                )}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
