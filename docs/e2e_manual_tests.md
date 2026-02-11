# E2E Manual Test Plan

This document outlines comprehensive end-to-end manual test scenarios for WinThisCard before production launch.

---

## Pre-Test Setup

### Environment Requirements
- [ ] PostgreSQL database running (`docker compose up -d`)
- [ ] Redis running (Upstash or local)
- [ ] Stripe test mode credentials configured
- [ ] At least one active competition in database
- [ ] Test user accounts:
  - Fresh email for new registration
  - Existing user with purchases
  - Admin user (role: ADMIN)
  - Super admin user (role: SUPER_ADMIN)

### Browser Requirements
- Chrome (latest)
- Safari (latest)
- Firefox (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

---

## Test Journey 1: New User Journey

**Objective**: Verify complete new user registration, skill question, ticket purchase, and checkout flow.

### 1.1 Registration
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/register` | Registration form displays |
| 2 | Enter invalid email (e.g., "test") | Real-time error: "Invalid email address" |
| 3 | Enter valid email | Email field validates, green checkmark |
| 4 | Enter weak password (e.g., "abc123") | Error: password requirements not met |
| 5 | Enter strong password (e.g., "SecureP@ss1") | Password validates |
| 6 | Leave first name empty, submit | Error: "First name is required" |
| 7 | Fill all fields correctly | Form submits |
| 8 | Check email inbox | Verification email received |
| 9 | Click verification link | Account verified, redirected to login |
| 10 | Login with credentials | Dashboard/home page loads |

### 1.2 Browse Competitions
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/competitions` | Competition listing displays |
| 2 | Use category filter | Only filtered competitions show |
| 3 | Use sort dropdown | Competitions reorder correctly |
| 4 | Use pagination | Page changes, URL updates |
| 5 | Click competition card | Detail page loads at `/competitions/[slug]` |

### 1.3 Competition Detail & Skill Question
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View competition detail page | All info displays (title, price, images, description) |
| 2 | Check countdown timer | Timer updates in real-time |
| 3 | Check progress bar | Shows tickets sold / total |
| 4 | Click "Get Tickets" button | Redirected to ticket selector |
| 5 | Select quantity (e.g., 10 tickets) | Bonus tier displays (+1 bonus) |
| 6 | Click "Continue" | Skill question modal appears |
| 7 | Select wrong answer | Error message, must retry |
| 8 | Select correct answer | Proceed to checkout |

### 1.4 Checkout & Payment
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Review order summary | Correct tickets, price, bonus |
| 2 | Ticket numbers display | Reserved numbers visible |
| 3 | Countdown timer shows | 10-minute reservation timer |
| 4 | Click "Pay Now" | Redirected to Stripe Checkout |
| 5 | Use test card: 4242 4242 4242 4242 | Payment processes |
| 6 | Complete Stripe checkout | Redirected to success page |
| 7 | Check success page | Order confirmation, ticket numbers |
| 8 | Check email | Order confirmation email received |
| 9 | Navigate to `/profile/orders` | Order appears in history |
| 10 | Navigate to `/profile/tickets` | Tickets appear with numbers |

### 1.5 Edge Cases - Registration
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Register with existing email | Error: "Email already registered" |
| 2 | Register with emoji in name | Validation error or sanitized |
| 3 | Register with very long name (>50 chars) | Error: max length exceeded |
| 4 | XSS attempt in name field | Input sanitized, no script execution |

---

## Test Journey 2: Google OAuth Journey

**Objective**: Verify Google sign-in and subsequent purchase flow.

### 2.1 Google Sign-In
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login page with Google button |
| 2 | Click "Sign in with Google" | Google OAuth popup/redirect |
| 3 | Select Google account | Authentication proceeds |
| 4 | First-time user | Account created, welcome email sent |
| 5 | Returning user | Logged in, redirected to dashboard |
| 6 | Check profile | Name and email from Google displayed |

### 2.2 Purchase with OAuth Account
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to competition | Detail page loads |
| 2 | Click "Get Tickets" | Already authenticated, proceed to selector |
| 3 | Complete purchase flow | Same as Journey 1.4 |
| 4 | Verify email matches Google email | Confirmation sent to Google email |

### 2.3 Edge Cases - OAuth
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Cancel Google popup | Return to login page, no error |
| 2 | Google account without email | Error: email required |
| 3 | Existing email (credentials) + Google | Account linked or error message |

---

## Test Journey 3: Admin Full Cycle

**Objective**: Verify complete admin workflow from competition creation to draw execution.

### 3.1 Admin Login & Dashboard
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to admin URL (port 3001) | Admin login page |
| 2 | Login with admin credentials | Admin dashboard loads |
| 3 | Verify dashboard stats | Revenue, users, orders, competitions display |
| 4 | Check recent orders widget | Latest orders visible |
| 5 | Check active competitions widget | Current competitions visible |

### 3.2 Create Competition
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Competitions > New | Competition form loads |
| 2 | Fill required fields | Form validates in real-time |
| 3 | Upload main image | Image previews |
| 4 | Add gallery images | Multiple images upload |
| 5 | Set category and subcategory | Dropdown selection works |
| 6 | Set ticket price (e.g., £5) | Price formats correctly |
| 7 | Set total tickets (e.g., 1000) | Number input validates |
| 8 | Set draw date (future) | Date picker works |
| 9 | Add skill question | 4 options, one correct |
| 10 | Save as DRAFT | Competition saved, redirected to detail |

### 3.3 Publish Competition
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View DRAFT competition | Status badge shows DRAFT |
| 2 | Click "Publish" | Confirmation dialog |
| 3 | Confirm publish | Status changes to ACTIVE |
| 4 | Verify on public site | Competition appears in listing |

### 3.4 Monitor Competition
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View competition detail | Stats show (sold, revenue) |
| 2 | Check tickets tab | All ticket numbers listed |
| 3 | Check orders tab | Purchases for this competition |
| 4 | Simulate purchases | Stats update in real-time |

### 3.5 Execute Draw (SUPER_ADMIN only)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as SUPER_ADMIN | Access draw functionality |
| 2 | Navigate to competition draw page | Draw interface loads |
| 3 | Verify eligibility | Must be SOLD_OUT or past draw date |
| 4 | Click "Execute Draw" | Confirmation dialog |
| 5 | Confirm draw | Random winner selected |
| 6 | View winner details | Winning ticket, user info displayed |
| 7 | Competition status changes | Status = COMPLETED |
| 8 | Winner notification | Email sent to winner |
| 9 | Verify public display | Winner shows on competition page |

### 3.6 Cancel Competition
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create test competition | DRAFT status |
| 2 | Publish and sell some tickets | ACTIVE with sales |
| 3 | Click "Cancel Competition" | Warning about refunds |
| 4 | Enter cancellation reason | Required field |
| 5 | Confirm cancellation | Status = CANCELLED |
| 6 | Verify refunds | Stripe refunds initiated |
| 7 | Check emails | Cancellation emails sent |

### 3.7 User Management
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Users | User list with filters |
| 2 | Search by email | Results filter correctly |
| 3 | View user detail | Profile, orders, tickets visible |
| 4 | Ban user (if SUPER_ADMIN) | User marked as banned |
| 5 | Banned user tries to login | Access denied message |
| 6 | Unban user | Access restored |

### 3.8 Audit Log (SUPER_ADMIN only)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Audit Log | Log entries displayed |
| 2 | Filter by action type | Filtered results show |
| 3 | View log detail | Timestamp, user, action, details |
| 4 | Verify sensitive actions logged | Draw, ban, delete all logged |

---

## Test Journey 4: Edge Cases & Error States

### 4.1 Payment Failures
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Use declining card: 4000 0000 0000 0002 | Payment fails, error shown |
| 2 | Use insufficient funds: 4000 0000 0000 9995 | Specific error message |
| 3 | Close Stripe checkout mid-payment | Return to site, reservation held |
| 4 | Wait for reservation timeout | Tickets released, error shown |
| 5 | Network error during checkout | Graceful error handling |

### 4.2 Concurrent Users
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Two users reserve same tickets | First succeeds, second gets different |
| 2 | User A reserves, User B buys | Different tickets for each |
| 3 | Last tickets scenario | Proper handling, no overselling |
| 4 | SOLD_OUT state triggers | Status updates, no more purchases |

### 4.3 Session & Auth Edge Cases
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Session expires mid-checkout | Redirect to login, return to checkout |
| 2 | Multiple tabs, logout in one | All tabs redirect to login |
| 3 | Login on different device | Session works on new device |
| 4 | Browser back button from success | No duplicate charges |

### 4.4 Input Validation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | SQL injection in search | Sanitized, no SQL error |
| 2 | XSS in contact form | Sanitized, no script execution |
| 3 | Negative ticket quantity | Validation error |
| 4 | Non-integer ticket quantity | Validation error |
| 5 | Quantity > max per user | Capped at maximum |

### 4.5 Rate Limiting
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Rapid login attempts (>5) | Rate limited, 429 response |
| 2 | Rapid API requests | Rate limited |
| 3 | After cooldown | Requests allowed again |

### 4.6 Accessibility
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Keyboard navigation | All elements reachable |
| 2 | Screen reader (VoiceOver) | Proper ARIA labels |
| 3 | High contrast mode | Content readable |
| 4 | Zoom 200% | Layout doesn't break |

### 4.7 Mobile Specific
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Bottom nav on mobile | Present and functional |
| 2 | Image gallery swipe | Swipe gestures work |
| 3 | Form inputs on iOS | Keyboard doesn't obscure |
| 4 | PWA install prompt | Prompt appears (if configured) |

### 4.8 Error Pages
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/nonexistent` | Custom 404 page |
| 2 | Trigger server error | Custom error page |
| 3 | Check error page links | Navigation works |

---

## Test Sign-Off Checklist

Before launch, ensure ALL tests pass:

### Critical Path (Must Pass)
- [ ] New user registration and email verification
- [ ] Login (credentials and Google OAuth)
- [ ] View competitions and detail pages
- [ ] Ticket selection and skill question
- [ ] Stripe checkout completes successfully
- [ ] Order confirmation email received
- [ ] Admin can create and publish competition
- [ ] Draw execution works (SUPER_ADMIN)
- [ ] Refunds process on cancellation

### Security (Must Pass)
- [ ] Rate limiting active
- [ ] XSS prevented
- [ ] SQL injection prevented
- [ ] HTTPS enforced
- [ ] Sensitive routes protected

### Performance (Should Pass)
- [ ] Page load < 3 seconds
- [ ] Images optimized
- [ ] No console errors

### Mobile (Should Pass)
- [ ] All pages responsive
- [ ] Touch interactions work
- [ ] Bottom nav functional

---

## Test Results Log

| Date | Tester | Journey | Result | Notes |
|------|--------|---------|--------|-------|
| | | | | |
| | | | | |
| | | | | |

---

*Document created: Phase 6 - Testing & Launch*
*Last updated: February 2026*
