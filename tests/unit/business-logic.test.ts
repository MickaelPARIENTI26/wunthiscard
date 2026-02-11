import { describe, it, expect } from 'vitest';
import {
  calculateBonusTickets,
  calculateTotalPrice,
  generateSlug,
  generateOrderNumber,
  anonymizeWinnerName,
} from '../../packages/shared/src/utils/index';
import { DEFAULT_BONUS_TIERS } from '../../packages/shared/src/constants/index';

describe('Bonus Ticket Calculation', () => {
  it('should return 1 bonus for 10 tickets', () => {
    expect(calculateBonusTickets(10, DEFAULT_BONUS_TIERS)).toBe(1);
  });

  it('should return 2 bonus for 15 tickets', () => {
    expect(calculateBonusTickets(15, DEFAULT_BONUS_TIERS)).toBe(2);
  });

  it('should return 3 bonus for 20 tickets', () => {
    expect(calculateBonusTickets(20, DEFAULT_BONUS_TIERS)).toBe(3);
  });

  it('should return 5 bonus for 50 tickets', () => {
    expect(calculateBonusTickets(50, DEFAULT_BONUS_TIERS)).toBe(5);
  });

  it('should return 0 bonus for 9 tickets', () => {
    expect(calculateBonusTickets(9, DEFAULT_BONUS_TIERS)).toBe(0);
  });

  it('should return 3 bonus for 25 tickets (uses tier below)', () => {
    expect(calculateBonusTickets(25, DEFAULT_BONUS_TIERS)).toBe(3);
  });

  it('should return 0 bonus for 0 tickets', () => {
    expect(calculateBonusTickets(0, DEFAULT_BONUS_TIERS)).toBe(0);
  });

  it('should return 5 bonus for 100 tickets', () => {
    expect(calculateBonusTickets(100, DEFAULT_BONUS_TIERS)).toBe(5);
  });
});

describe('Order Total Calculation', () => {
  it('should calculate correct total: 10 tickets at £5 = £50', () => {
    expect(calculateTotalPrice(10, 5)).toBe(50);
  });

  it('should calculate correct total: 1 ticket at £2 = £2', () => {
    expect(calculateTotalPrice(1, 2)).toBe(2);
  });

  it('should calculate correct total: 50 tickets at £3.99 = £199.50', () => {
    expect(calculateTotalPrice(50, 3.99)).toBe(199.5);
  });

  it('should NOT charge for bonus tickets (bonus is free)', () => {
    // Buy 10 tickets at £5 = £50 (bonus ticket is FREE)
    const paidTickets = 10;
    const ticketPrice = 5;
    const total = calculateTotalPrice(paidTickets, ticketPrice);
    // Bonus is 1 ticket but should NOT be charged
    expect(total).toBe(50);
    // Total tickets received should be 11, but total charged is still £50
  });
});

describe('Ticket Number Validation', () => {
  it('should reject negative ticket numbers', () => {
    const isValidTicketNumber = (num: number, maxTickets: number) =>
      Number.isInteger(num) && num > 0 && num <= maxTickets;

    expect(isValidTicketNumber(-1, 1000)).toBe(false);
  });

  it('should reject zero ticket number', () => {
    const isValidTicketNumber = (num: number, maxTickets: number) =>
      Number.isInteger(num) && num > 0 && num <= maxTickets;

    expect(isValidTicketNumber(0, 1000)).toBe(false);
  });

  it('should accept positive integers within range', () => {
    const isValidTicketNumber = (num: number, maxTickets: number) =>
      Number.isInteger(num) && num > 0 && num <= maxTickets;

    expect(isValidTicketNumber(1, 1000)).toBe(true);
    expect(isValidTicketNumber(500, 1000)).toBe(true);
    expect(isValidTicketNumber(1000, 1000)).toBe(true);
  });

  it('should reject ticket numbers exceeding total', () => {
    const isValidTicketNumber = (num: number, maxTickets: number) =>
      Number.isInteger(num) && num > 0 && num <= maxTickets;

    expect(isValidTicketNumber(1001, 1000)).toBe(false);
  });

  it('should reject non-integer ticket numbers', () => {
    const isValidTicketNumber = (num: number, maxTickets: number) =>
      Number.isInteger(num) && num > 0 && num <= maxTickets;

    expect(isValidTicketNumber(1.5, 1000)).toBe(false);
    expect(isValidTicketNumber(NaN, 1000)).toBe(false);
  });

  it('should detect duplicate ticket numbers', () => {
    const hasDuplicates = (nums: number[]) => new Set(nums).size !== nums.length;

    expect(hasDuplicates([1, 2, 3])).toBe(false);
    expect(hasDuplicates([1, 2, 2])).toBe(true);
    expect(hasDuplicates([1, 1, 1])).toBe(true);
    expect(hasDuplicates([])).toBe(false);
  });
});

describe('Slug Generation', () => {
  it('should convert title to lowercase slug', () => {
    expect(generateSlug('Charizard PSA 10 Base Set')).toBe('charizard-psa-10-base-set');
  });

  it('should handle special characters', () => {
    expect(generateSlug("Pokemon - Pikachu's Adventure!")).toBe('pokemon-pikachus-adventure');
  });

  it('should handle multiple spaces', () => {
    expect(generateSlug('Multiple   Spaces   Here')).toBe('multiple-spaces-here');
  });

  it('should handle leading/trailing spaces', () => {
    expect(generateSlug('  Trimmed  ')).toBe('trimmed');
  });

  it('should handle numbers', () => {
    expect(generateSlug('Card Number 123')).toBe('card-number-123');
  });

  it('should handle already lowercase text', () => {
    expect(generateSlug('already lowercase')).toBe('already-lowercase');
  });

  it('should handle empty string', () => {
    expect(generateSlug('')).toBe('');
  });
});

describe('Winner Name Anonymization', () => {
  it('should anonymize "John Doe" to "J*** D**"', () => {
    expect(anonymizeWinnerName('John', 'Doe')).toBe('J*** D**');
  });

  it('should anonymize "Jose O\'Brien" correctly', () => {
    // Note: the apostrophe in O'Brien stays as part of the name
    expect(anonymizeWinnerName('Jose', "O'Brien")).toBe("J*** O******");
  });

  it('should handle single character names', () => {
    expect(anonymizeWinnerName('A', 'B')).toBe('A B');
  });

  it('should handle short names', () => {
    expect(anonymizeWinnerName('Li', 'Wu')).toBe('L* W*');
  });

  it('should handle long names', () => {
    expect(anonymizeWinnerName('Christopher', 'Worthington')).toBe('C********** W**********');
  });
});

describe('Order Number Generation', () => {
  it('should generate order number with WTC prefix', () => {
    const orderNum = generateOrderNumber();
    expect(orderNum.startsWith('WTC-')).toBe(true);
  });

  it('should include date in YYYYMMDD format', () => {
    const orderNum = generateOrderNumber();
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    expect(orderNum).toContain(today);
  });

  it('should match format WTC-YYYYMMDD-XXXX', () => {
    const orderNum = generateOrderNumber();
    const pattern = /^WTC-\d{8}-[A-Z0-9]{4}$/;
    expect(pattern.test(orderNum)).toBe(true);
  });

  it('should generate unique order numbers', () => {
    const orderNums = new Set<string>();
    for (let i = 0; i < 100; i++) {
      orderNums.add(generateOrderNumber());
    }
    // All 100 should be unique
    expect(orderNums.size).toBe(100);
  });

  it('should accept custom prefix', () => {
    const orderNum = generateOrderNumber('TEST');
    expect(orderNum.startsWith('TEST-')).toBe(true);
  });
});
