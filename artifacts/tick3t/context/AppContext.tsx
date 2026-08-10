import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, PurchasedTicket, User } from '@/types';

const TICKETS_KEY = 'tick3t.vault.tickets';
const USER_KEY = 'tick3t.mock-auth.user';

// Real events from digital-event-key-74
const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Bass Drop Festival 2024',
    date: 'March 15, 2024',
    time: '9:00 PM',
    location: 'Miami Beach Arena',
    fullAddress: '1901 Biscayne Blvd, Miami, FL 33132',
    price: 89,
    image: 'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=800&h=500&fit=crop',
    attendees: 2500,
    category: 'Music Festival',
    available: 150,
    total: 500,
    featured: true,
    description: "Get ready for the ultimate electronic music experience! Bass Drop Festival brings together the hottest DJs and producers for a night of non-stop dancing under the Miami stars.\n\nFeaturing Skrillex, Diplo, Marshmello and many more. This isn't just a concert — it's a full sensory experience with cutting-edge visuals, interactive art installations, and the best sound system on the East Coast.",
    organizer: 'Bass Events Miami',
    isVerifiedOrganizer: true,
    tags: ['Electronic', 'Dance', 'Festival', 'Miami'],
    amenities: ['Food Trucks', 'Premium Bar', 'Valet Parking', 'Free WiFi', '24/7 Security'],
    tiers: [
      { id: 'general', name: 'General Admission', price: 89, perks: ['Event access', 'Standing area', 'Free water'] },
      { id: 'vip', name: 'VIP', price: 189, perks: ['Priority entry', 'VIP lounge access', 'Complimentary drink', 'Dedicated restrooms'] },
      { id: 'backstage', name: 'Backstage Pass', price: 349, perks: ['All VIP perks', 'Meet & greet with artists', 'Backstage access', 'Exclusive merch bundle'] },
    ],
  },
  {
    id: '2',
    title: 'Digital Art Rave',
    date: 'March 22, 2024',
    time: '10:00 PM',
    location: 'Brooklyn Warehouse, NYC',
    fullAddress: '325 Kent Ave, Brooklyn, NY 11249',
    price: 48,
    image: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=800&h=500&fit=crop',
    attendees: 800,
    category: 'Art & Culture',
    available: 0,
    total: 200,
    description: 'A unique fusion of digital art and underground music. Experience immersive projections and live visual art sets by renowned digital artists alongside curated electronic beats.\n\nThis sold-out event has become the talk of NYC art and nightlife circles.',
    organizer: 'Neon Collective',
    isVerifiedOrganizer: true,
    tags: ['Digital Art', 'Immersive', 'Electronic', 'NYC'],
    amenities: ['Art Installations', 'Full Bar', 'Coat Check', 'Photo Ops'],
    tiers: [
      { id: 'general', name: 'General Admission', price: 48, perks: ['Event access', 'Art installations'] },
    ],
  },
  {
    id: '3',
    title: 'Tech Innovation Summit',
    date: 'March 28, 2024',
    time: '9:00 AM',
    location: 'Silicon Valley Convention Center',
    fullAddress: '150 W San Carlos St, San Jose, CA 95113',
    price: 240,
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop',
    attendees: 1200,
    category: 'Tech & Networking',
    available: 300,
    total: 400,
    description: 'The premier tech conference bringing together founders, investors, and engineers. Three stages of keynotes, panels, and workshops covering AI, Web3, and the future of software.\n\nNetwork with 1,200+ tech professionals, attend masterclasses, and connect with top-tier investors.',
    organizer: 'TechSV Events',
    isVerifiedOrganizer: true,
    tags: ['AI', 'Web3', 'Startups', 'Networking'],
    amenities: ['Catered Lunch', 'Networking Lounge', 'Wi-Fi', 'Workshop Rooms', 'Investor Meetups'],
    tiers: [
      { id: 'general', name: 'General Admission', price: 240, perks: ['All keynotes', 'Networking access', 'Lunch included'] },
      { id: 'vip', name: 'VIP', price: 480, perks: ['Premium seating', 'Investor dinner', 'Speaker meet & greet', 'All workshops'] },
    ],
  },
  {
    id: '4',
    title: 'Gaming Championship',
    date: 'April 5, 2024',
    time: '2:00 PM',
    location: 'Los Angeles Arena',
    fullAddress: '1111 S Figueroa St, Los Angeles, CA 90015',
    price: 72,
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=500&fit=crop',
    attendees: 5000,
    category: 'Gaming',
    available: 800,
    total: 1000,
    description: 'The biggest esports event on the West Coast. Watch the top teams battle it out across multiple titles — FPS, MOBA, and fighting games — with a $500K prize pool on the line.\n\nLive commentary, cosplay contest, merch booths, and gaming setups to try yourself.',
    organizer: 'GameLA Productions',
    isVerifiedOrganizer: false,
    tags: ['Esports', 'FPS', 'MOBA', 'Competition'],
    amenities: ['Gaming Zones', 'Food Court', 'Merch Stands', 'Cosplay Contest', 'Live Commentary'],
    tiers: [
      { id: 'general', name: 'General Admission', price: 72, perks: ['Event access', 'Viewing areas', 'Gaming zones'] },
      { id: 'vip', name: 'VIP', price: 149, perks: ['Front-row seating', 'Player meet & greet', 'Exclusive merch', 'Gaming room access'] },
    ],
  },
  {
    id: '5',
    title: 'Beach Party Sunset',
    date: 'April 12, 2024',
    time: '6:00 PM',
    location: 'Malibu Beach Club',
    fullAddress: '22878 Pacific Coast Hwy, Malibu, CA 90265',
    price: 60,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=500&fit=crop',
    attendees: 300,
    category: 'Beach Party',
    available: 50,
    total: 150,
    description: 'Welcome the California summer with a legendary beachside celebration. Sunset cocktails, live DJ sets, fire dancers, and the best views in Malibu.\n\nOnly 150 spots available — this is an intimate, curated experience.',
    organizer: 'Pacific Social',
    isVerifiedOrganizer: true,
    tags: ['Beach', 'Sunset', 'DJ', 'Malibu'],
    amenities: ['Open Bar', 'Fire Show', 'Beach Access', 'Photo Booth', 'Catering'],
    tiers: [
      { id: 'general', name: 'General', price: 60, perks: ['Event access', 'Welcome drink', 'Beach access'] },
      { id: 'vip', name: 'VIP Cabana', price: 120, perks: ['Private cabana', 'Bottle service', 'Priority access', 'Towel & amenity kit'] },
    ],
  },
  {
    id: '6',
    title: 'Fashion Week Gala',
    date: 'April 20, 2024',
    time: '8:00 PM',
    location: 'Manhattan Design Center',
    fullAddress: '315 Hudson St, New York, NY 10013',
    price: 360,
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=500&fit=crop',
    attendees: 600,
    category: 'Fashion',
    available: 25,
    total: 100,
    description: 'The most exclusive fashion event of the season. Runway shows from emerging and established designers, a curated art exhibition, and a black-tie dinner reception.\n\nA celebration of style, creativity, and innovation attended by industry icons.',
    organizer: 'NYFW Collective',
    isVerifiedOrganizer: true,
    tags: ['Fashion', 'Runway', 'Black Tie', 'NYC'],
    amenities: ['Black-tie Dinner', 'Open Bar', 'Gift Bag', 'Valet Parking', 'Press Lounge'],
    tiers: [
      { id: 'general', name: 'General', price: 360, perks: ['Runway access', 'Exhibition', 'Dinner'] },
      { id: 'vip', name: 'VIP Table', price: 750, perks: ['Front-row seats', 'Private table', 'Designer meet & greet', 'Gift bag', 'Press room access'] },
    ],
  },
];

export const INITIAL_MARKETPLACE = [
  { id: 'm1', eventId: '2', eventTitle: 'Digital Art Rave', eventDate: 'March 22, 2024', eventLocation: 'Brooklyn Warehouse, NYC', eventImage: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=400&h=300&fit=crop', eventCategory: 'Art & Culture' as const, tierName: 'General Admission', originalPrice: 48, resalePrice: 110, seller: 'alex_nyc', sellerVerified: true, quantity: 1, listed: '2 hours ago' },
  { id: 'm2', eventId: '2', eventTitle: 'Digital Art Rave', eventDate: 'March 22, 2024', eventLocation: 'Brooklyn Warehouse, NYC', eventImage: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=400&h=300&fit=crop', eventCategory: 'Art & Culture' as const, tierName: 'General Admission', originalPrice: 48, resalePrice: 95, seller: 'nft_collector', sellerVerified: false, quantity: 2, listed: '5 hours ago' },
  { id: 'm3', eventId: '1', eventTitle: 'Bass Drop Festival 2024', eventDate: 'March 15, 2024', eventLocation: 'Miami Beach Arena', eventImage: 'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=400&h=300&fit=crop', eventCategory: 'Music Festival' as const, tierName: 'VIP', originalPrice: 189, resalePrice: 220, seller: 'miami_party', sellerVerified: true, quantity: 1, listed: '1 day ago' },
  { id: 'm4', eventId: '6', eventTitle: 'Fashion Week Gala', eventDate: 'April 20, 2024', eventLocation: 'Manhattan Design Center', eventImage: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=300&fit=crop', eventCategory: 'Fashion' as const, tierName: 'General', originalPrice: 360, resalePrice: 420, seller: 'style_trader', sellerVerified: true, quantity: 1, listed: '3 days ago' },
];

export type MarketplaceListing = typeof INITIAL_MARKETPLACE[0];

interface AppContextValue {
  events: Event[];
  tickets: PurchasedTicket[];
  user: User | null;
  marketplace: MarketplaceListing[];
  purchaseTicket: (event: Event, tierId: string, quantity: number) => Promise<PurchasedTicket>;
  getTicketById: (id: string) => PurchasedTicket | undefined;
  getEventById: (id: string) => Event | undefined;
  updateUser: (u: Partial<User>) => void;
  addMarketplaceListing: (ticket: PurchasedTicket, resalePrice: number) => void;
  listedTicketIds: Set<string>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<PurchasedTicket[]>([]);
  const [marketplace, setMarketplace] = useState<MarketplaceListing[]>(INITIAL_MARKETPLACE);
  const [listedTicketIds, setListedTicketIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<User>({
    id: '1',
    name: 'Guest User',
    email: 'guest@tick3rt.com',
    role: 'user',
    isVerified: false,
  });

  useEffect(() => {
    AsyncStorage.getItem(TICKETS_KEY).then(raw => {
      if (raw) setTickets(JSON.parse(raw));
    });
    AsyncStorage.getItem(USER_KEY).then(raw => {
      if (raw) setUser(JSON.parse(raw));
    });
  }, []);

  const purchaseTicket = useCallback(async (event: Event, tierId: string, quantity: number): Promise<PurchasedTicket> => {
    const tier = event.tiers.find(t => t.id === tierId)!;
    const ticket: PurchasedTicket = {
      id: Date.now().toString(),
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location,
      eventImage: event.image,
      tierName: tier.name,
      tierPrice: tier.price,
      quantity,
      totalPaid: tier.price * quantity,
      purchasedAt: new Date().toISOString(),
      keyCode: `T3-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${event.id}`,
      holderName: user.name,
      status: 'upcoming',
      isNFT: true,
    };
    const updated = [...tickets, ticket];
    setTickets(updated);
    await AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(updated));
    return ticket;
  }, [tickets, user]);

  const getTicketById = useCallback((id: string) => tickets.find(t => t.id === id), [tickets]);
  const getEventById = useCallback((id: string) => MOCK_EVENTS.find(e => e.id === id), []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addMarketplaceListing = useCallback((ticket: PurchasedTicket, resalePrice: number) => {
    const listing: MarketplaceListing = {
      id: `user-${Date.now()}`,
      eventId: ticket.eventId,
      eventTitle: ticket.eventTitle,
      eventDate: ticket.eventDate,
      eventLocation: ticket.eventLocation,
      eventImage: ticket.eventImage,
      eventCategory: 'Music Festival' as const, // fallback; real lookup would use getEventById
      tierName: ticket.tierName,
      originalPrice: ticket.tierPrice,
      resalePrice,
      seller: user?.name ?? 'You',
      sellerVerified: user?.isVerified ?? false,
      quantity: ticket.quantity,
      listed: 'Just now',
    };
    setMarketplace(prev => [listing, ...prev]);
    setListedTicketIds(prev => new Set([...prev, ticket.id]));
  }, [user]);

  return (
    <AppContext.Provider value={{
      events: MOCK_EVENTS, tickets, user, marketplace,
      purchaseTicket, getTicketById, getEventById, updateUser,
      addMarketplaceListing, listedTicketIds,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
