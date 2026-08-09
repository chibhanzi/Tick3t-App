export type EventCategory = 'All' | 'Music' | 'Sports' | 'Arts' | 'Tech' | 'Food';

export interface TicketType {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  available: number;
  perks?: string[];
}

export interface Event {
  id: string;
  title: string;
  category: Exclude<EventCategory, 'All'>;
  date: string;
  time: string;
  venue: string;
  city: string;
  country: string;
  accentColor: string;
  description: string;
  ticketTypes: TicketType[];
  featured?: boolean;
  tags: string[];
}

export interface PurchasedTicket {
  id: string;
  eventId: string;
  event: Event;
  ticketType: TicketType;
  quantity: number;
  purchaseDate: string;
  status: 'upcoming' | 'active' | 'used';
  keyCode: string;
  holderName: string;
  totalAmount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}
