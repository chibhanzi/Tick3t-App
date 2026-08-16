import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, PurchasedTicket, User, AppNotification, NotifPrefs } from '@/types';

const TICKETS_KEY = 'tick3t.vault.tickets';
const USER_KEY = 'tick3t.mock-auth.user';
const MARKETPLACE_KEY = 'tick3t.marketplace.listings';
const LISTED_IDS_KEY = 'tick3t.marketplace.listed-ids';
const FOLLOWING_KEY = 'tick3t.following.organizers';
const SOCIALS_KEY = 'tick3t.connected.socials';
const WAITLIST_KEY = 'tick3t.waitlist.events';
const WATCHLIST_KEY = 'tick3t.watchlist.events';
const POOL_KEY = 'tick3t.pool.events';
const PRIMARY_SOCIAL_KEY = 'tick3t.primary.social';
const NOTIF_READ_KEY = 'tick3t.notifications.readIds';
const NOTIF_PREFS_KEY = 'tick3t.notifications.prefs';

const DEFAULT_NOTIF_PREFS: NotifPrefs = { events: true, resale: true, transfers: true, marketing: false };

// Seed notifications — always shown; read state persisted separately
const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1', type: 'event_reminder',
    title: 'Bass Drop Festival starts tonight! 🎵',
    body: 'Your ticket is ready. Doors open at 9:00 PM at Miami Beach Arena — have a great night!',
    timestamp: '2026-08-15T08:00:00.000Z', read: false, deepLink: '/event/1',
  },
  {
    id: 'n2', type: 'saved_almost_sold_out',
    title: 'Beach Party Sunset is almost gone',
    body: 'Only 50 tickets remaining for Beach Party Sunset, an event you saved. Grab yours now.',
    timestamp: '2026-08-15T05:00:00.000Z', read: false, deepLink: '/event/5',
  },
  {
    id: 'n3', type: 'offer_received',
    title: 'New offer on your VIP listing',
    body: 'Someone offered $220 for your VIP ticket to Bass Drop Festival 2026.',
    timestamp: '2026-08-14T10:00:00.000Z', read: false, deepLink: '/(tabs)/marketplace',
  },
  {
    id: 'n4', type: 'listing_sold',
    title: 'Your ticket sold for $420 🎉',
    body: 'Your Fashion Week Gala General ticket was sold. Funds released after the event.',
    timestamp: '2026-08-13T14:30:00.000Z', read: true, deepLink: '/(tabs)/vault',
  },
  {
    id: 'n5', type: 'transfer_received',
    title: 'Ticket received from Alex Chen',
    body: 'Alex Chen transferred a Gaming Championship General ticket to your vault.',
    timestamp: '2026-08-12T09:15:00.000Z', read: true, deepLink: '/(tabs)/vault',
  },
  {
    id: 'n6', type: 'event_reminder',
    title: 'Tech Innovation Summit in 2 weeks',
    body: "Don't forget — Tech Innovation Summit is on Aug 29. Check in online to skip the queue.",
    timestamp: '2026-08-11T08:00:00.000Z', read: true, deepLink: '/event/3',
  },
  {
    id: 'n7', type: 'offer_received',
    title: 'Offer on your Digital Art Rave listing',
    body: 'You received a $95 offer for your General Admission ticket to Digital Art Rave.',
    timestamp: '2026-08-10T16:45:00.000Z', read: true, deepLink: '/(tabs)/marketplace',
  },
  {
    id: 'n8', type: 'saved_almost_sold_out',
    title: 'Fashion Week Gala: only 25 spots left',
    body: 'This exclusive event you saved is nearly sold out. Only 25 tickets remain.',
    timestamp: '2026-08-09T11:00:00.000Z', read: true, deepLink: '/event/6',
  },
];

// Waitlist seed counts (pre-populated so social proof is immediate)
const MOCK_WAITLIST_COUNTS: Record<string, number> = { '2': 287 };

// Pool seed data per event: how many people have committed before the user joins
const MOCK_POOL_DATA: Record<string, { target: number; raised: number; contributors: number }> = {
  '2': { target: 50, raised: 32, contributors: 32 },
};

export interface SocialFriend {
  id: string; name: string; handle: string; initials: string; color: string; attendingEventIds: string[];
  socials: { platform: 'instagram' | 'twitter'; handle: string }[];
}
export const MOCK_SOCIAL_FRIENDS: SocialFriend[] = [
  { id: 'f1', name: 'Alex Chen',  handle: '@alex_raves',  initials: 'AC', color: '#6366F1', attendingEventIds: ['1', '4'], socials: [{ platform: 'instagram', handle: 'alex.raves' }, { platform: 'twitter', handle: 'alex_raves' }] },
  { id: 'f2', name: 'Priya R.',   handle: '@priya_vibes', initials: 'PR', color: '#EC4899', attendingEventIds: ['2', '5'], socials: [{ platform: 'instagram', handle: 'priya_vibes' }] },
  { id: 'f3', name: 'Marcus L.',  handle: '@marcusparty', initials: 'ML', color: '#06B6D4', attendingEventIds: ['3', '4'], socials: [{ platform: 'twitter', handle: 'marcusparty' }] },
  { id: 'f4', name: 'Sasha M.',   handle: '@sasham',      initials: 'SM', color: '#22C55E', attendingEventIds: ['1', '6'], socials: [{ platform: 'instagram', handle: 'sasha.m_official' }, { platform: 'twitter', handle: 'sasham' }] },
  { id: 'f5', name: 'Jordan K.',  handle: '@jk_out',      initials: 'JK', color: '#F59E0B', attendingEventIds: ['5'],      socials: [{ platform: 'instagram', handle: 'jordan.k.out' }] },
];

// ── Organizer metadata ────────────────────────────────────────────────────────

export interface OrganizerMeta {
  id: string;
  name: string;
  bio: string;
  color: string;
  eventCount: number;
  followerCount: number;
  mutuals: { instagram: string[]; twitter: string[] };
}

export const MOCK_ORGANIZERS: Record<string, OrganizerMeta> = {
  'Bass Events Miami': {
    id: 'bass-events-miami',
    name: 'Bass Events Miami',
    bio: "Miami's premier electronic music collective, running sell-out raves and festivals since 2018.",
    color: '#6366F1',
    eventCount: 12,
    followerCount: 4800,
    mutuals: {
      instagram: ['@dj_miami_life', '@bass_addict', '@neon_rave_sg'],
      twitter: ['@edm_world', '@miami_nights'],
    },
  },
  'Neon Collective': {
    id: 'neon-collective',
    name: 'Neon Collective',
    bio: 'Independent art & culture producers bringing immersive gallery experiences to unconventional spaces.',
    color: '#EC4899',
    eventCount: 7,
    followerCount: 2100,
    mutuals: {
      instagram: ['@art_gallery_sg', '@culture_hopper'],
      twitter: ['@artsy_tweets'],
    },
  },
  'TechSV Events': {
    id: 'techsv-events',
    name: 'TechSV Events',
    bio: "Silicon Valley's go-to event organizer for founders, engineers, and investors.",
    color: '#06B6D4',
    eventCount: 19,
    followerCount: 6300,
    mutuals: {
      instagram: ['@startup_grind', '@vc_insider', '@techfounder_sg'],
      twitter: ['@techcrunch_fan', '@yc_alumni', '@founders_daily'],
    },
  },
  'GameLA Productions': {
    id: 'gamela-productions',
    name: 'GameLA Productions',
    bio: "LA's biggest esports and gaming tournament organizer.",
    color: '#22C55E',
    eventCount: 8,
    followerCount: 3700,
    mutuals: {
      instagram: ['@esports_daily', '@gamedev_life'],
      twitter: ['@twitch_top', '@esports_central', '@lol_pro_scene'],
    },
  },
  'Pacific Social': {
    id: 'pacific-social',
    name: 'Pacific Social',
    bio: 'Curating the best beach parties and sunset sessions up and down the California coast.',
    color: '#F59E0B',
    eventCount: 15,
    followerCount: 5200,
    mutuals: {
      instagram: ['@cali_vibes', '@beach_party_sg', '@sunset_sessions'],
      twitter: ['@surf_culture', '@cali_events'],
    },
  },
  'NYFW Collective': {
    id: 'nyfw-collective',
    name: 'NYFW Collective',
    bio: "New York's fashion week experts — runway, retail, and after-party all in one package.",
    color: '#A78BFA',
    eventCount: 6,
    followerCount: 8100,
    mutuals: {
      instagram: ['@fashion_week_sg', '@runway_daily', '@style_insider', '@mode_mag'],
      twitter: ['@vogue_updates', '@nyfw_live'],
    },
  },
};

// ── Types ────────────────────────────────────────────────────────────────────

export type EventCategory =
  | 'Music Festival' | 'Art & Culture' | 'Tech & Networking'
  | 'Gaming' | 'Beach Party' | 'Fashion';

export type MarketplaceListing = {
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
  ticketId?: string; // vault ticket this was listed from (user listings only)
};

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Bass Drop Festival 2026',
    date: 'August 15, 2026',
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
    date: 'August 16, 2026',
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
    date: 'August 29, 2026',
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
    date: 'September 12, 2026',
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
    date: 'September 27, 2026',
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
    date: 'October 18, 2026',
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

export const INITIAL_MARKETPLACE: MarketplaceListing[] = [
  { id: 'm1', eventId: '2', eventTitle: 'Digital Art Rave', eventDate: 'August 16, 2026', eventLocation: 'Brooklyn Warehouse, NYC', eventImage: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=400&h=300&fit=crop', eventCategory: 'Art & Culture', tierName: 'General Admission', originalPrice: 48, resalePrice: 110, seller: 'alex_nyc', sellerVerified: true, quantity: 1, listed: '2 hours ago' },
  { id: 'm2', eventId: '2', eventTitle: 'Digital Art Rave', eventDate: 'August 16, 2026', eventLocation: 'Brooklyn Warehouse, NYC', eventImage: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=400&h=300&fit=crop', eventCategory: 'Art & Culture', tierName: 'General Admission', originalPrice: 48, resalePrice: 95, seller: 'nft_collector', sellerVerified: false, quantity: 2, listed: '5 hours ago' },
  { id: 'm3', eventId: '1', eventTitle: 'Bass Drop Festival 2026', eventDate: 'August 15, 2026', eventLocation: 'Miami Beach Arena', eventImage: 'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=400&h=300&fit=crop', eventCategory: 'Music Festival', tierName: 'VIP', originalPrice: 189, resalePrice: 220, seller: 'miami_party', sellerVerified: true, quantity: 1, listed: '1 day ago' },
  { id: 'm4', eventId: '6', eventTitle: 'Fashion Week Gala', eventDate: 'October 18, 2026', eventLocation: 'Manhattan Design Center', eventImage: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=300&fit=crop', eventCategory: 'Fashion', tierName: 'General', originalPrice: 360, resalePrice: 420, seller: 'style_trader', sellerVerified: true, quantity: 1, listed: '3 days ago' },
];

// ── Context interface ─────────────────────────────────────────────────────────

interface AppContextValue {
  events: Event[];
  tickets: PurchasedTicket[];
  user: User | null;
  marketplace: MarketplaceListing[];
  listedTicketIds: Set<string>;
  followedOrganizers: Set<string>;
  connectedSocials: Record<string, string>;
  primarySocial: string | null;
  setPrimarySocial: (platform: string | null) => void;
  joinedWaitlist: Set<string>;
  watchlist: Set<string>;
  joinedPools: Set<string>;
  connectSocial: (platform: string, handle: string) => void;
  disconnectSocial: (platform: string) => void;
  toggleWaitlist: (eventId: string) => void;
  toggleWatchlist: (eventId: string) => void;
  joinPool: (eventId: string) => void;
  getWaitlistCount: (eventId: string) => number;
  getPoolData: (eventId: string) => { target: number; raised: number; contributors: number };
  purchaseTicket: (event: Event, tierId: string, quantity: number) => Promise<PurchasedTicket>;
  purchaseMarketplaceTicket: (listing: MarketplaceListing) => Promise<PurchasedTicket>;
  getTicketById: (id: string) => PurchasedTicket | undefined;
  getEventById: (id: string) => Event | undefined;
  getOrganizerEvents: (organizerName: string) => Event[];
  updateUser: (u: Partial<User>) => void;
  addMarketplaceListing: (ticket: PurchasedTicket, resalePrice: number) => void;
  cancelListing: (listingId: string) => void;
  transferTicket: (ticketId: string) => Promise<void>;
  toggleFollowOrganizer: (organizerName: string) => void;
  // Notifications
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markNotifRead: (id: string) => void;
  notifPrefs: NotifPrefs;
  setNotifPrefs: (prefs: Partial<NotifPrefs>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<PurchasedTicket[]>([]);
  const [marketplace, setMarketplace] = useState<MarketplaceListing[]>(INITIAL_MARKETPLACE);
  const [listedTicketIds, setListedTicketIds] = useState<Set<string>>(new Set());
  const [followedOrganizers, setFollowedOrganizers] = useState<Set<string>>(new Set());
  const [connectedSocials, setConnectedSocials] = useState<Record<string, string>>({});
  const [primarySocial, setPrimarySocialState] = useState<string | null>(null);
  const [joinedWaitlist, setJoinedWaitlist] = useState<Set<string>>(new Set());
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [joinedPools, setJoinedPools] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED_NOTIFICATIONS);
  const [notifPrefs, setNotifPrefsState] = useState<NotifPrefs>(DEFAULT_NOTIF_PREFS);
  const [user, setUser] = useState<User>({
    id: '1',
    name: 'Guest User',
    email: 'guest@tick3t.com',
    role: 'user',
    isVerified: false,
  });

  // Restore persisted state on mount
  useEffect(() => {
    AsyncStorage.getItem(TICKETS_KEY).then(raw => {
      if (raw) setTickets(JSON.parse(raw));
    });
    AsyncStorage.getItem(USER_KEY).then(raw => {
      if (raw) setUser(JSON.parse(raw));
    });
    AsyncStorage.getItem(MARKETPLACE_KEY).then(raw => {
      if (raw) {
        try { setMarketplace(JSON.parse(raw)); } catch { /* ignore corrupt data */ }
      }
    });
    AsyncStorage.getItem(LISTED_IDS_KEY).then(raw => {
      if (raw) {
        try { setListedTicketIds(new Set(JSON.parse(raw))); } catch { /* ignore */ }
      }
    });
    AsyncStorage.getItem(FOLLOWING_KEY).then(raw => {
      if (raw) {
        try { setFollowedOrganizers(new Set(JSON.parse(raw))); } catch { /* ignore */ }
      }
    });
    AsyncStorage.getItem(SOCIALS_KEY).then(raw => {
      if (raw) { try { setConnectedSocials(JSON.parse(raw)); } catch { /* ignore */ } }
    });
    AsyncStorage.getItem(WAITLIST_KEY).then(raw => {
      if (raw) { try { setJoinedWaitlist(new Set(JSON.parse(raw))); } catch { /* ignore */ } }
    });
    AsyncStorage.getItem(WATCHLIST_KEY).then(raw => {
      if (raw) { try { setWatchlist(new Set(JSON.parse(raw))); } catch { /* ignore */ } }
    });
    AsyncStorage.getItem(POOL_KEY).then(raw => {
      if (raw) { try { setJoinedPools(new Set(JSON.parse(raw))); } catch { /* ignore */ } }
    });
    AsyncStorage.getItem(PRIMARY_SOCIAL_KEY).then(raw => {
      if (raw) { try { setPrimarySocialState(JSON.parse(raw)); } catch { /* ignore */ } }
    });
    // Restore notification read state (we always show seed data, just persist which are read)
    AsyncStorage.getItem(NOTIF_READ_KEY).then(raw => {
      if (raw) {
        try {
          const readIds: string[] = JSON.parse(raw);
          if (readIds.length) {
            setNotifications(prev => prev.map(n => readIds.includes(n.id) ? { ...n, read: true } : n));
          }
        } catch { /* ignore */ }
      }
    });
    AsyncStorage.getItem(NOTIF_PREFS_KEY).then(raw => {
      if (raw) { try { setNotifPrefsState({ ...DEFAULT_NOTIF_PREFS, ...JSON.parse(raw) }); } catch { /* ignore */ } }
    });
  }, []);

  // Helper: persist marketplace + listedIds together
  const persistMarketplace = useCallback(async (listings: MarketplaceListing[], ids: Set<string>) => {
    await AsyncStorage.setItem(MARKETPLACE_KEY, JSON.stringify(listings));
    await AsyncStorage.setItem(LISTED_IDS_KEY, JSON.stringify([...ids]));
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

  const purchaseMarketplaceTicket = useCallback(async (listing: MarketplaceListing): Promise<PurchasedTicket> => {
    const ticket: PurchasedTicket = {
      id: Date.now().toString(),
      eventId: listing.eventId,
      eventTitle: listing.eventTitle,
      eventDate: listing.eventDate,
      eventTime: '',
      eventLocation: listing.eventLocation,
      eventImage: listing.eventImage,
      tierName: listing.tierName,
      tierPrice: listing.resalePrice,
      quantity: listing.quantity,
      totalPaid: listing.resalePrice * listing.quantity,
      purchasedAt: new Date().toISOString(),
      keyCode: `T3-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${listing.eventId}`,
      holderName: user?.name ?? 'Guest',
      status: 'upcoming',
      isNFT: true,
    };
    const updatedTickets = [...tickets, ticket];
    setTickets(updatedTickets);
    await AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(updatedTickets));

    // Remove listing, update listedIds if it was a user listing
    const updatedMarket = marketplace.filter(l => l.id !== listing.id);
    const updatedIds = new Set(listedTicketIds);
    if (listing.ticketId) updatedIds.delete(listing.ticketId);
    setMarketplace(updatedMarket);
    setListedTicketIds(updatedIds);
    await persistMarketplace(updatedMarket, updatedIds);
    return ticket;
  }, [tickets, user, marketplace, listedTicketIds, persistMarketplace]);

  const addMarketplaceListing = useCallback(async (ticket: PurchasedTicket, resalePrice: number) => {
    // Resolve category from events
    const event = MOCK_EVENTS.find(e => e.id === ticket.eventId);
    const listing: MarketplaceListing = {
      id: `user-${Date.now()}`,
      eventId: ticket.eventId,
      eventTitle: ticket.eventTitle,
      eventDate: ticket.eventDate,
      eventLocation: ticket.eventLocation,
      eventImage: ticket.eventImage,
      eventCategory: (event?.category as EventCategory) ?? 'Music Festival',
      tierName: ticket.tierName,
      originalPrice: ticket.tierPrice,
      resalePrice,
      seller: user?.name ?? 'You',
      sellerVerified: user?.isVerified ?? false,
      quantity: ticket.quantity,
      listed: 'Just now',
      ticketId: ticket.id,
    };
    const updatedMarket = [listing, ...marketplace];
    const updatedIds = new Set([...listedTicketIds, ticket.id]);
    setMarketplace(updatedMarket);
    setListedTicketIds(updatedIds);
    await persistMarketplace(updatedMarket, updatedIds);
  }, [user, marketplace, listedTicketIds, persistMarketplace]);

  const cancelListing = useCallback(async (listingId: string) => {
    const listing = marketplace.find(l => l.id === listingId);
    const updatedMarket = marketplace.filter(l => l.id !== listingId);
    const updatedIds = new Set(listedTicketIds);
    if (listing?.ticketId) updatedIds.delete(listing.ticketId);
    setMarketplace(updatedMarket);
    setListedTicketIds(updatedIds);
    await persistMarketplace(updatedMarket, updatedIds);
  }, [marketplace, listedTicketIds, persistMarketplace]);

  const transferTicket = useCallback(async (ticketId: string) => {
    // Remove ticket from vault; if listed, also remove that listing
    const listing = marketplace.find(l => l.ticketId === ticketId);
    const updatedTickets = tickets.filter(t => t.id !== ticketId);
    setTickets(updatedTickets);
    await AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(updatedTickets));
    if (listing) {
      const updatedMarket = marketplace.filter(l => l.id !== listing.id);
      const updatedIds = new Set(listedTicketIds);
      updatedIds.delete(ticketId);
      setMarketplace(updatedMarket);
      setListedTicketIds(updatedIds);
      await persistMarketplace(updatedMarket, updatedIds);
    }
  }, [tickets, marketplace, listedTicketIds, persistMarketplace]);

  const getTicketById = useCallback((id: string) => tickets.find(t => t.id === id), [tickets]);
  const getEventById = useCallback((id: string) => MOCK_EVENTS.find(e => e.id === id), []);
  const getOrganizerEvents = useCallback((organizerName: string) =>
    MOCK_EVENTS.filter(e => e.organizer === organizerName), []);

  const connectSocial = useCallback((platform: string, handle: string) => {
    setConnectedSocials(prev => {
      const next = { ...prev, [platform]: handle };
      AsyncStorage.setItem(SOCIALS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const disconnectSocial = useCallback((platform: string) => {
    setConnectedSocials(prev => {
      const next = { ...prev };
      delete next[platform];
      AsyncStorage.setItem(SOCIALS_KEY, JSON.stringify(next));
      return next;
    });
    setPrimarySocialState(prev => {
      if (prev === platform) { AsyncStorage.setItem(PRIMARY_SOCIAL_KEY, JSON.stringify(null)); return null; }
      return prev;
    });
  }, []);

  const setPrimarySocial = useCallback((platform: string | null) => {
    setPrimarySocialState(platform);
    AsyncStorage.setItem(PRIMARY_SOCIAL_KEY, JSON.stringify(platform));
  }, []);

  const toggleWaitlist = useCallback((eventId: string) => {
    setJoinedWaitlist(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId); else next.add(eventId);
      AsyncStorage.setItem(WAITLIST_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const toggleWatchlist = useCallback((eventId: string) => {
    setWatchlist(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId); else next.add(eventId);
      AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const joinPool = useCallback((eventId: string) => {
    setJoinedPools(prev => {
      const next = new Set(prev);
      next.add(eventId);
      AsyncStorage.setItem(POOL_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const getWaitlistCount = useCallback((eventId: string) => {
    return (MOCK_WAITLIST_COUNTS[eventId] ?? 0) + (joinedWaitlist.has(eventId) ? 1 : 0);
  }, [joinedWaitlist]);

  const getPoolData = useCallback((eventId: string) => {
    const base = MOCK_POOL_DATA[eventId] ?? { target: 50, raised: 0, contributors: 0 };
    const extra = joinedPools.has(eventId) ? 1 : 0;
    return { ...base, raised: base.raised + extra, contributors: base.contributors + extra };
  }, [joinedPools]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      AsyncStorage.setItem(NOTIF_READ_KEY, JSON.stringify(next.map(n => n.id)));
      return next;
    });
  }, []);

  const markNotifRead = useCallback((id: string) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      AsyncStorage.setItem(NOTIF_READ_KEY, JSON.stringify(next.filter(n => n.read).map(n => n.id)));
      return next;
    });
  }, []);

  const setNotifPrefs = useCallback((prefs: Partial<NotifPrefs>) => {
    setNotifPrefsState(prev => {
      const next = { ...prev, ...prefs };
      AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleFollowOrganizer = useCallback((organizerName: string) => {
    setFollowedOrganizers(prev => {
      const next = new Set(prev);
      if (next.has(organizerName)) next.delete(organizerName);
      else next.add(organizerName);
      AsyncStorage.setItem(FOLLOWING_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider value={{
      events: MOCK_EVENTS, tickets, user, marketplace, listedTicketIds, followedOrganizers,
      connectedSocials, primarySocial, setPrimarySocial, joinedWaitlist, watchlist, joinedPools,
      connectSocial, disconnectSocial, toggleWaitlist, toggleWatchlist, joinPool,
      getWaitlistCount, getPoolData,
      purchaseTicket, purchaseMarketplaceTicket, getTicketById, getEventById, getOrganizerEvents,
      updateUser, addMarketplaceListing, cancelListing, transferTicket, toggleFollowOrganizer,
      notifications, unreadCount, markAllRead, markNotifRead, notifPrefs, setNotifPrefs,
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
