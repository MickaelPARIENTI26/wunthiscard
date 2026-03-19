import { describe, it, expect } from 'vitest';
import {
  createCompetitionSchema,
  claimFreeEntrySchema,
} from '../../packages/shared/src/validators/index';
import {
  calculateProgress,
} from '../../packages/shared/src/utils/index';
import {
  REFERRAL_TICKETS_REQUIRED,
  REFERRAL_CODE_LENGTH,
  MAX_REFERRALS_PER_USER,
  DEFAULT_MAX_TICKETS_PER_USER_FREE,
} from '../../packages/shared/src/constants/index';
import type { CompetitionPrize } from '../../packages/shared/src/types/index';

// ==========================================
// Helper: base valid competition data
// ==========================================
const baseCompetition = {
  title: 'Charizard PSA 10',
  descriptionShort: 'A rare card.',
  descriptionLong: '<p>Detailed description</p>',
  category: 'POKEMON' as const,
  prizeValue: 1000,
  ticketPrice: 5,
  totalTickets: 500,
  maxTicketsPerUser: 50,
  drawDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  mainImageUrl: 'https://example.com/card.jpg',
  galleryUrls: [],
  questionText: 'What year was the first Pokemon TCG released?',
  questionChoices: ['1996', '1998', '2000', '2002'],
  questionAnswer: 0,
};

// ==========================================
// FREE COMPETITIONS
// ==========================================
describe('Free Competition Validation', () => {
  it('should accept a free competition with ticketPrice = 0', () => {
    const freeComp = {
      ...baseCompetition,
      isFree: true,
      ticketPrice: 0,
      totalTickets: null,
    };
    const result = createCompetitionSchema.safeParse(freeComp);
    expect(result.success).toBe(true);
  });

  it('should reject a free competition with ticketPrice > 0', () => {
    const freeComp = {
      ...baseCompetition,
      isFree: true,
      ticketPrice: 5,
    };
    const result = createCompetitionSchema.safeParse(freeComp);
    expect(result.success).toBe(false);
  });

  it('should reject a paid competition with ticketPrice = 0', () => {
    const paidComp = {
      ...baseCompetition,
      isFree: false,
      ticketPrice: 0,
    };
    const result = createCompetitionSchema.safeParse(paidComp);
    expect(result.success).toBe(false);
  });

  it('should accept a paid competition with ticketPrice >= 1', () => {
    const paidComp = {
      ...baseCompetition,
      isFree: false,
      ticketPrice: 1,
      totalTickets: 100,
    };
    const result = createCompetitionSchema.safeParse(paidComp);
    expect(result.success).toBe(true);
  });

  it('should reject a paid competition with totalTickets = null', () => {
    const paidComp = {
      ...baseCompetition,
      isFree: false,
      ticketPrice: 5,
      totalTickets: null,
    };
    const result = createCompetitionSchema.safeParse(paidComp);
    expect(result.success).toBe(false);
  });

  it('should accept a free competition with totalTickets = null (unlimited)', () => {
    const freeComp = {
      ...baseCompetition,
      isFree: true,
      ticketPrice: 0,
      totalTickets: null,
    };
    const result = createCompetitionSchema.safeParse(freeComp);
    expect(result.success).toBe(true);
  });

  it('should accept a free competition with a defined totalTickets (limited)', () => {
    const freeComp = {
      ...baseCompetition,
      isFree: true,
      ticketPrice: 0,
      totalTickets: 200,
    };
    const result = createCompetitionSchema.safeParse(freeComp);
    expect(result.success).toBe(true);
  });

  it('should default isFree to false', () => {
    const comp = { ...baseCompetition, totalTickets: 100 };
    const result = createCompetitionSchema.safeParse(comp);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isFree).toBe(false);
    }
  });
});

// ==========================================
// CLAIM FREE ENTRY
// ==========================================
describe('Claim Free Entry Validation', () => {
  it('should accept valid competitionId', () => {
    expect(() => claimFreeEntrySchema.parse({ competitionId: 'comp123' })).not.toThrow();
  });

  it('should reject empty competitionId', () => {
    expect(() => claimFreeEntrySchema.parse({ competitionId: '' })).toThrow();
  });

  it('should reject missing competitionId', () => {
    expect(() => claimFreeEntrySchema.parse({})).toThrow();
  });
});

// ==========================================
// CALCULATE PROGRESS (nullable totalTickets)
// ==========================================
describe('calculateProgress with nullable total', () => {
  it('should return 0 when total is null (unlimited)', () => {
    expect(calculateProgress(50, null)).toBe(0);
  });

  it('should return 0 when total is 0', () => {
    expect(calculateProgress(0, 0)).toBe(0);
  });

  it('should calculate percentage correctly', () => {
    expect(calculateProgress(50, 100)).toBe(50);
    expect(calculateProgress(750, 1000)).toBe(75);
    expect(calculateProgress(1000, 1000)).toBe(100);
  });

  it('should round to nearest integer', () => {
    expect(calculateProgress(33, 100)).toBe(33);
    expect(calculateProgress(1, 3)).toBe(33); // 33.33 → 33
    expect(calculateProgress(2, 3)).toBe(67); // 66.67 → 67
  });
});

// ==========================================
// REFERRAL SYSTEM
// ==========================================
describe('Referral System Constants', () => {
  it('should require 10 tickets for a free ticket', () => {
    expect(REFERRAL_TICKETS_REQUIRED).toBe(10);
  });

  it('should have 8-char referral codes', () => {
    expect(REFERRAL_CODE_LENGTH).toBe(8);
  });

  it('should limit referrals to 100 per user', () => {
    expect(MAX_REFERRALS_PER_USER).toBe(100);
  });

  it('should default free competition to 1 ticket per user', () => {
    expect(DEFAULT_MAX_TICKETS_PER_USER_FREE).toBe(1);
  });
});

describe('Referral Bonus Calculation', () => {
  // Simulates the webhook logic: Math.floor(count / REFERRAL_TICKETS_REQUIRED)
  function calculateReferralBonus(ticketCount: number): { freeTickets: number; remaining: number } {
    const freeTickets = Math.floor(ticketCount / REFERRAL_TICKETS_REQUIRED);
    const remaining = ticketCount % REFERRAL_TICKETS_REQUIRED;
    return { freeTickets, remaining };
  }

  it('should award 0 free tickets for 9 referral tickets', () => {
    const { freeTickets, remaining } = calculateReferralBonus(9);
    expect(freeTickets).toBe(0);
    expect(remaining).toBe(9);
  });

  it('should award 1 free ticket for exactly 10 referral tickets', () => {
    const { freeTickets, remaining } = calculateReferralBonus(10);
    expect(freeTickets).toBe(1);
    expect(remaining).toBe(0);
  });

  it('should award 2 free tickets for 25 referral tickets with 5 remaining', () => {
    const { freeTickets, remaining } = calculateReferralBonus(25);
    expect(freeTickets).toBe(2);
    expect(remaining).toBe(5);
  });

  it('should award 5 free tickets for exactly 50 referral tickets', () => {
    const { freeTickets, remaining } = calculateReferralBonus(50);
    expect(freeTickets).toBe(5);
    expect(remaining).toBe(0);
  });

  it('should handle large batch purchase correctly (e.g. 37 tickets at once)', () => {
    // Existing counter: 8, new purchase: 37 → total 45
    const existingCount = 8;
    const newPurchase = 37;
    const totalCount = existingCount + newPurchase;
    const { freeTickets, remaining } = calculateReferralBonus(totalCount);
    expect(freeTickets).toBe(4); // 45 / 10 = 4
    expect(remaining).toBe(5); // 45 % 10 = 5
  });

  it('should award 0 for 0 tickets', () => {
    const { freeTickets } = calculateReferralBonus(0);
    expect(freeTickets).toBe(0);
  });
});

// ==========================================
// URGENCY SYSTEM
// ==========================================
describe('Urgency Level Calculation', () => {
  // Mirrors the getUrgencyLevel function from competition-card.tsx
  function getUrgencyLevel(drawDate: Date, status: string): 'last-hours' | 'ending-soon' | null {
    if (status !== 'ACTIVE') return null;
    const diff = new Date(drawDate).getTime() - Date.now();
    if (diff <= 0) return null;
    if (diff < 3 * 60 * 60 * 1000) return 'last-hours';
    if (diff < 24 * 60 * 60 * 1000) return 'ending-soon';
    return null;
  }

  it('should return null for non-ACTIVE competitions', () => {
    const futureDate = new Date(Date.now() + 1 * 60 * 60 * 1000);
    expect(getUrgencyLevel(futureDate, 'DRAFT')).toBe(null);
    expect(getUrgencyLevel(futureDate, 'COMPLETED')).toBe(null);
    expect(getUrgencyLevel(futureDate, 'CANCELLED')).toBe(null);
    expect(getUrgencyLevel(futureDate, 'UPCOMING')).toBe(null);
  });

  it('should return "last-hours" when less than 3 hours remain', () => {
    const in2Hours = new Date(Date.now() + 2 * 60 * 60 * 1000);
    expect(getUrgencyLevel(in2Hours, 'ACTIVE')).toBe('last-hours');
  });

  it('should return "last-hours" when less than 1 hour remains', () => {
    const in30Min = new Date(Date.now() + 30 * 60 * 1000);
    expect(getUrgencyLevel(in30Min, 'ACTIVE')).toBe('last-hours');
  });

  it('should return "ending-soon" when 3-24 hours remain', () => {
    const in12Hours = new Date(Date.now() + 12 * 60 * 60 * 1000);
    expect(getUrgencyLevel(in12Hours, 'ACTIVE')).toBe('ending-soon');
  });

  it('should return "ending-soon" at exactly 4 hours', () => {
    const in4Hours = new Date(Date.now() + 4 * 60 * 60 * 1000);
    expect(getUrgencyLevel(in4Hours, 'ACTIVE')).toBe('ending-soon');
  });

  it('should return null when more than 24 hours remain', () => {
    const in2Days = new Date(Date.now() + 48 * 60 * 60 * 1000);
    expect(getUrgencyLevel(in2Days, 'ACTIVE')).toBe(null);
  });

  it('should return null when draw date has passed', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(getUrgencyLevel(yesterday, 'ACTIVE')).toBe(null);
  });
});

// ==========================================
// URGENCY SORTING
// ==========================================
describe('Urgency-Based Sorting', () => {
  // Mirrors the sorting logic from live-competitions.tsx
  interface SortableCompetition {
    id: string;
    drawDate: Date;
    status: string;
  }

  function sortByUrgency(comps: SortableCompetition[]): SortableCompetition[] {
    const now = Date.now();
    return [...comps].sort((a, b) => {
      const diffA = new Date(a.drawDate).getTime() - now;
      const diffB = new Date(b.drawDate).getTime() - now;
      const urgencyA = diffA > 0 && diffA < 3 * 3600000 ? 0 : diffA > 0 && diffA < 24 * 3600000 ? 1 : 2;
      const urgencyB = diffB > 0 && diffB < 3 * 3600000 ? 0 : diffB > 0 && diffB < 24 * 3600000 ? 1 : 2;
      if (urgencyA !== urgencyB) return urgencyA - urgencyB;
      return diffA - diffB;
    });
  }

  it('should put last-hours competitions first', () => {
    const comps: SortableCompetition[] = [
      { id: 'far', drawDate: new Date(Date.now() + 48 * 3600000), status: 'ACTIVE' },
      { id: 'soon', drawDate: new Date(Date.now() + 12 * 3600000), status: 'ACTIVE' },
      { id: 'urgent', drawDate: new Date(Date.now() + 1 * 3600000), status: 'ACTIVE' },
    ];
    const sorted = sortByUrgency(comps);
    expect(sorted[0]!.id).toBe('urgent');
    expect(sorted[1]!.id).toBe('soon');
    expect(sorted[2]!.id).toBe('far');
  });

  it('should sort same-urgency by closest draw date', () => {
    const comps: SortableCompetition[] = [
      { id: 'later', drawDate: new Date(Date.now() + 10 * 3600000), status: 'ACTIVE' },
      { id: 'sooner', drawDate: new Date(Date.now() + 5 * 3600000), status: 'ACTIVE' },
    ];
    const sorted = sortByUrgency(comps);
    expect(sorted[0]!.id).toBe('sooner');
    expect(sorted[1]!.id).toBe('later');
  });
});

// ==========================================
// MULTI-DRAW PRIZES
// ==========================================
describe('Multi-Draw Prize Validation', () => {
  it('should type-check CompetitionPrize structure', () => {
    const prize: CompetitionPrize = {
      position: 1,
      title: 'Charizard PSA 10',
      value: 3000,
      imageUrl: 'https://example.com/charizard.jpg',
      certification: '45678901',
      grade: 'PSA 10',
    };
    expect(prize.position).toBe(1);
    expect(prize.title).toBe('Charizard PSA 10');
    expect(prize.value).toBe(3000);
  });

  it('should allow optional fields on CompetitionPrize', () => {
    const prize: CompetitionPrize = {
      position: 2,
      title: 'Umbreon VMAX',
      value: 1500,
    };
    expect(prize.imageUrl).toBeUndefined();
    expect(prize.certification).toBeUndefined();
    expect(prize.grade).toBeUndefined();
  });

  it('should calculate total value from multiple prizes', () => {
    const prizes: CompetitionPrize[] = [
      { position: 1, title: 'Charizard', value: 3000 },
      { position: 2, title: 'Umbreon', value: 1500 },
      { position: 3, title: 'Pikachu', value: 1000 },
    ];
    const totalValue = prizes.reduce((sum, p) => sum + p.value, 0);
    expect(totalValue).toBe(5500);
  });

  it('should sort prizes by position', () => {
    const prizes: CompetitionPrize[] = [
      { position: 3, title: 'Pikachu', value: 1000 },
      { position: 1, title: 'Charizard', value: 3000 },
      { position: 2, title: 'Umbreon', value: 1500 },
    ];
    const sorted = [...prizes].sort((a, b) => a.position - b.position);
    expect(sorted[0]!.title).toBe('Charizard');
    expect(sorted[1]!.title).toBe('Umbreon');
    expect(sorted[2]!.title).toBe('Pikachu');
  });
});

// ==========================================
// MYSTERY CARD
// ==========================================
describe('Mystery Card Data Stripping', () => {
  // Simulates the server-side stripping logic from getCompetition
  interface MysteryCompetition {
    isMystery: boolean;
    isRevealed: boolean;
    realTitle: string | null;
    realValue: number | null;
    realImages: string[];
    realCertification: string | null;
    realGrade: string | null;
  }

  function stripMysteryFields(comp: MysteryCompetition): MysteryCompetition {
    if (comp.isMystery && !comp.isRevealed) {
      return {
        ...comp,
        realTitle: null,
        realValue: null,
        realImages: [],
        realCertification: null,
        realGrade: null,
      };
    }
    return comp;
  }

  it('should strip real* fields when mystery and not revealed', () => {
    const comp: MysteryCompetition = {
      isMystery: true,
      isRevealed: false,
      realTitle: 'Charizard Base Set PSA 10',
      realValue: 3000,
      realImages: ['https://example.com/charizard.jpg'],
      realCertification: '45678901',
      realGrade: 'PSA 10',
    };
    const stripped = stripMysteryFields(comp);
    expect(stripped.realTitle).toBeNull();
    expect(stripped.realValue).toBeNull();
    expect(stripped.realImages).toEqual([]);
    expect(stripped.realCertification).toBeNull();
    expect(stripped.realGrade).toBeNull();
  });

  it('should NOT strip fields when mystery is revealed', () => {
    const comp: MysteryCompetition = {
      isMystery: true,
      isRevealed: true,
      realTitle: 'Charizard Base Set PSA 10',
      realValue: 3000,
      realImages: ['https://example.com/charizard.jpg'],
      realCertification: '45678901',
      realGrade: 'PSA 10',
    };
    const stripped = stripMysteryFields(comp);
    expect(stripped.realTitle).toBe('Charizard Base Set PSA 10');
    expect(stripped.realValue).toBe(3000);
  });

  it('should NOT strip fields when not mystery', () => {
    const comp: MysteryCompetition = {
      isMystery: false,
      isRevealed: false,
      realTitle: null,
      realValue: null,
      realImages: [],
      realCertification: null,
      realGrade: null,
    };
    const stripped = stripMysteryFields(comp);
    expect(stripped).toEqual(comp);
  });
});

// ==========================================
// TICKET PACKS
// ==========================================
describe('Ticket Pack Pricing', () => {
  const packs = [
    { name: 'Starter', tickets: 5, bonus: 0 },
    { name: 'Popular', tickets: 10, bonus: 1 },
    { name: 'Best Value', tickets: 20, bonus: 3 },
    { name: 'Ultimate', tickets: 50, bonus: 5 },
  ];

  it('should calculate correct total tickets including bonus', () => {
    packs.forEach((pack) => {
      expect(pack.tickets + pack.bonus).toBeGreaterThanOrEqual(pack.tickets);
    });
    expect(packs[1]!.tickets + packs[1]!.bonus).toBe(11);
    expect(packs[2]!.tickets + packs[2]!.bonus).toBe(23);
    expect(packs[3]!.tickets + packs[3]!.bonus).toBe(55);
  });

  it('should calculate savings correctly', () => {
    const ticketPrice = 14.99;
    packs.forEach((pack) => {
      const totalTickets = pack.tickets + pack.bonus;
      const fullPrice = totalTickets * ticketPrice;
      const actualPrice = pack.tickets * ticketPrice;
      const savings = fullPrice - actualPrice;
      expect(savings).toBeCloseTo(pack.bonus * ticketPrice, 2);
    });
  });

  it('should have no savings for Starter pack (0 bonus)', () => {
    const ticketPrice = 5;
    const starter = packs[0]!;
    const savings = (starter.tickets + starter.bonus) * ticketPrice - starter.tickets * ticketPrice;
    expect(savings).toBe(0);
  });

  it('should calculate paid tickets correctly when referral ticket is used', () => {
    const quantity = 10;
    const useReferralTicket = true;
    const paidTickets = useReferralTicket ? Math.max(quantity - 1, 0) : quantity;
    expect(paidTickets).toBe(9);
  });

  it('should not go below 0 paid tickets with referral', () => {
    const quantity = 1;
    const useReferralTicket = true;
    const paidTickets = useReferralTicket ? Math.max(quantity - 1, 0) : quantity;
    expect(paidTickets).toBe(0);
  });
});

// ==========================================
// REFERRAL CODE FORMAT
// ==========================================
describe('Referral Code Format', () => {
  // Mirrors the code generation logic from registerUser
  function generateReferralCode(firstName: string): string {
    const prefix = firstName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4).padEnd(4, 'A');
    const suffix = Math.random().toString(16).slice(2, 6).toUpperCase();
    return (prefix + suffix).slice(0, REFERRAL_CODE_LENGTH);
  }

  it('should generate an 8-character code', () => {
    const code = generateReferralCode('Mickael');
    expect(code.length).toBe(8);
  });

  it('should start with first 4 chars of uppercase name', () => {
    const code = generateReferralCode('Mickael');
    expect(code.slice(0, 4)).toBe('MICK');
  });

  it('should pad short names', () => {
    const code = generateReferralCode('Li');
    expect(code.length).toBe(8);
    expect(code.slice(0, 2)).toBe('LI');
  });

  it('should be alphanumeric', () => {
    const code = generateReferralCode('Test');
    expect(/^[A-Z0-9]{8}$/i.test(code)).toBe(true);
  });
});

// ==========================================
// COMPETITION VALIDATION — EDGE CASES
// ==========================================
describe('Competition Schema Edge Cases', () => {
  it('should reject negative ticket price', () => {
    const comp = { ...baseCompetition, ticketPrice: -5 };
    const result = createCompetitionSchema.safeParse(comp);
    expect(result.success).toBe(false);
  });

  it('should reject 0 prize value', () => {
    const comp = { ...baseCompetition, prizeValue: 0, totalTickets: 100 };
    const result = createCompetitionSchema.safeParse(comp);
    expect(result.success).toBe(false);
  });

  it('should reject negative prize value', () => {
    const comp = { ...baseCompetition, prizeValue: -100 };
    const result = createCompetitionSchema.safeParse(comp);
    expect(result.success).toBe(false);
  });

  it('should reject totalTickets exceeding 100,000', () => {
    const comp = { ...baseCompetition, totalTickets: 100001 };
    const result = createCompetitionSchema.safeParse(comp);
    expect(result.success).toBe(false);
  });

  it('should reject more than 4 question choices', () => {
    const comp = { ...baseCompetition, questionChoices: ['A', 'B', 'C', 'D', 'E'], totalTickets: 100 };
    const result = createCompetitionSchema.safeParse(comp);
    expect(result.success).toBe(false);
  });

  it('should reject fewer than 4 question choices', () => {
    const comp = { ...baseCompetition, questionChoices: ['A', 'B', 'C'], totalTickets: 100 };
    const result = createCompetitionSchema.safeParse(comp);
    expect(result.success).toBe(false);
  });

  it('should reject questionAnswer out of range', () => {
    const comp = { ...baseCompetition, questionAnswer: 4, totalTickets: 100 };
    const result = createCompetitionSchema.safeParse(comp);
    expect(result.success).toBe(false);
  });

  it('should accept maxTicketsPerUser = 1 (free competition)', () => {
    const comp = {
      ...baseCompetition,
      isFree: true,
      ticketPrice: 0,
      totalTickets: null,
      maxTicketsPerUser: 1,
    };
    const result = createCompetitionSchema.safeParse(comp);
    expect(result.success).toBe(true);
  });

  it('should reject maxTicketsPerUser > 100', () => {
    const comp = { ...baseCompetition, maxTicketsPerUser: 101, totalTickets: 100 };
    const result = createCompetitionSchema.safeParse(comp);
    expect(result.success).toBe(false);
  });
});
