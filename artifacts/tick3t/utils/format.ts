export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { NGN: '₦', GBP: '£', USD: '$', EUR: '€' };
  const symbol = symbols[currency] ?? currency + ' ';
  if (amount >= 1000000) return `${symbol}${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(0)}K`;
  return `${symbol}${amount.toLocaleString()}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatPurchaseDate(isoStr: string): string {
  const date = new Date(isoStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isEventUpcoming(dateStr: string): boolean {
  const eventDate = new Date(dateStr + 'T23:59:59');
  return eventDate > new Date();
}
