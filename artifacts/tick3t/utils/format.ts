export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatPrice(amount: number): string {
  return `$${amount}`;
}

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatPurchaseDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
}

export function isEventUpcoming(dateStr: string): boolean {
  try {
    const d = new Date(dateStr);
    return d >= new Date();
  } catch {
    return true;
  }
}

export function getAvailabilityPercent(available: number, total: number): number {
  if (total === 0) return 0;
  return Math.round(((total - available) / total) * 100);
}

export function getAvailabilityLabel(available: number, total: number): string {
  if (available === 0) return 'Sold Out';
  const pct = getAvailabilityPercent(available, total);
  if (pct >= 80) return 'Almost Sold Out';
  if (pct >= 50) return 'Selling Fast';
  return 'Available';
}
