export type EventCategory =
  | 'All'
  | 'Music Festival'
  | 'Art & Culture'
  | 'Tech & Networking'
  | 'Gaming'
  | 'Beach Party'
  | 'Fashion';

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  perks: string[];
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  fullAddress: string;
  price: number; // lowest tier price
  image: string;
  attendees: number;
  category: EventCategory;
  available: number;
  total: number;
  description: string;
  organizer: string;
  isVerifiedOrganizer: boolean;
  tags: string[];
  amenities: string[];
  tiers: TicketTier[];
  featured?: boolean;
}

export interface PurchasedTicket {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventImage: string;
  tierName: string;
  tierPrice: number;
  quantity: number;
  totalPaid: number;
  purchasedAt: string;
  keyCode: string;
  holderName: string;
  status: 'upcoming' | 'past' | 'cancelled';
  isNFT: boolean;
}

export interface MarketplaceListing {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventImage: string;
  eventCategory: EventCategory;
  tierName: string;
  originalPrice: number;
  resalePrice: number;
  seller: string;
  sellerVerified: boolean;
  quantity: number;
  listed: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'organizer';
  isVerified: boolean;
}

export type NotificationType =
  | 'event_reminder'
  | 'offer_received'
  | 'listing_sold'
  | 'transfer_received'
  | 'saved_almost_sold_out';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string; // ISO string
  read: boolean;
  deepLink?: string; // expo-router path
}

export interface NotifPrefs {
  events: boolean;      // event_reminder, saved_almost_sold_out
  resale: boolean;      // offer_received, listing_sold
  transfers: boolean;   // transfer_received
  marketing: boolean;   // future marketing types
}
