/**
 * Client-side storage cleanup utilities
 * Used to clear purchase flow state on logout
 */

/**
 * Clear all checkout-related data from sessionStorage and localStorage
 * Call this before signing out to ensure a fresh start on next login
 */
export function clearCheckoutStorage(): void {
  if (typeof window === 'undefined') return;

  // Clear sessionStorage keys related to checkout flow
  const sessionKeys = Object.keys(sessionStorage);
  for (const key of sessionKeys) {
    if (
      key.startsWith('tickets_') ||
      key.startsWith('reservation_') ||
      key.startsWith('pending_quantity_') ||
      key.startsWith('qcm_passed_')
    ) {
      sessionStorage.removeItem(key);
    }
  }

  // Clear localStorage keys related to checkout flow (if any)
  const localKeys = Object.keys(localStorage);
  for (const key of localKeys) {
    if (
      key.startsWith('tickets_') ||
      key.startsWith('reservation_') ||
      key.startsWith('pending_quantity_') ||
      key.startsWith('qcm_passed_') ||
      key.startsWith('cart_')
    ) {
      localStorage.removeItem(key);
    }
  }
}

/**
 * Clear all checkout-related data for a specific competition
 */
export function clearCompetitionCheckoutStorage(competitionId: string): void {
  if (typeof window === 'undefined') return;

  sessionStorage.removeItem(`tickets_${competitionId}`);
  sessionStorage.removeItem(`reservation_${competitionId}`);
  sessionStorage.removeItem(`pending_quantity_${competitionId}`);
  sessionStorage.removeItem(`qcm_passed_${competitionId}`);
}
