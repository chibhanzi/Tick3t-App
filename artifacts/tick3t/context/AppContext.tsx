import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, PurchasedTicket, TicketType, User } from '@/types';

const TICKETS_KEY = '@tick3t/tickets';
const USER_KEY = '@tick3t/user';

export const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Davido: TIMELESS World Tour',
    category: 'Music',
    date: '2026-09-15',
    time: '8:00 PM',
    venue: 'Teslim Balogun Stadium',
    city: 'Lagos',
    country: 'Nigeria',
    accentColor: '#FF6B35',
    description:
      'Experience the electrifying TIMELESS World Tour with Afrobeats superstar Davido. An unforgettable night of chart-topping hits, incredible production, and pure energy that will leave you wanting more.',
    ticketTypes: [
      { id: 'ga', name: 'General Admission', price: 15000, currency: 'NGN', description: 'Standing area access', available: 5000 },
      {
        id: 'vip',
        name: 'VIP Experience',
        price: 75000,
        currency: 'NGN',
        description: 'Priority entry + backstage access',
        available: 200,
        perks: ['Early entry', 'Meet & greet', 'Official merch'],
      },
      {
        id: 'table',
        name: 'VIP Table (x6)',
        price: 500000,
        currency: 'NGN',
        description: 'Premium table for 6 guests',
        available: 20,
        perks: ['Dedicated server', 'Premium drinks', 'Best view'],
      },
    ],
    featured: true,
    tags: ['Afrobeats', 'Live Music', 'Concert'],
  },
  {
    id: '2',
    title: 'Lagos Food & Drink Festival',
    category: 'Food',
    date: '2026-09-22',
    time: '11:00 AM',
    venue: 'Eko Hotel & Suites',
    city: 'Lagos',
    country: 'Nigeria',
    accentColor: '#F59E0B',
    description:
      'Celebrate the best of Nigerian cuisine and international flavors. 50+ vendors, live cooking demos, celebrity chefs, and curated dining experiences you cannot miss.',
    ticketTypes: [
      { id: 'standard', name: 'Standard', price: 8000, currency: 'NGN', description: 'Full day access', available: 2000 },
      {
        id: 'premium',
        name: 'Premium Foodie',
        price: 25000,
        currency: 'NGN',
        description: 'Exclusive tasting sessions',
        available: 300,
        perks: ["Chef's table", 'Wine pairing', 'Gift bag'],
      },
    ],
    featured: false,
    tags: ['Food', 'Culture', 'Lagos'],
  },
  {
    id: '3',
    title: 'TEDxLagos 2026',
    category: 'Tech',
    date: '2026-10-03',
    time: '9:00 AM',
    venue: 'Landmark Event Centre',
    city: 'Lagos',
    country: 'Nigeria',
    accentColor: '#EF4444',
    description:
      'Ideas worth spreading. Join thought leaders, innovators, and changemakers for a day of powerful talks, networking, and inspiration from across Africa and beyond.',
    ticketTypes: [
      { id: 'attendee', name: 'Attendee', price: 20000, currency: 'NGN', description: 'Full event access', available: 1000 },
      {
        id: 'speaker_plus',
        name: 'Speaker Pass',
        price: 50000,
        currency: 'NGN',
        description: 'Priority seating + speaker dinner',
        available: 50,
        perks: ['Speaker dinner', 'Networking session', 'Recording access'],
      },
    ],
    featured: false,
    tags: ['Tech', 'Innovation', 'Talks'],
  },
  {
    id: '4',
    title: 'Lagos Fashion Week 2026',
    category: 'Arts',
    date: '2026-10-18',
    time: '6:00 PM',
    venue: 'Oriental Hotel',
    city: 'Lagos',
    country: 'Nigeria',
    accentColor: '#8B5CF6',
    description:
      "Witness the future of African fashion. Three days of runway shows, exhibitions, and networking with Africa's top designers and creatives shaping global style.",
    ticketTypes: [
      { id: 'show', name: 'Show Ticket', price: 30000, currency: 'NGN', description: 'Access to all runway shows', available: 800 },
      {
        id: 'vip',
        name: 'VIP All-Access',
        price: 100000,
        currency: 'NGN',
        description: 'All-access + exclusive events',
        available: 100,
        perks: ['Front row seating', 'After-party', 'Designer meetups'],
      },
    ],
    featured: false,
    tags: ['Fashion', 'Design', 'Arts'],
  },
  {
    id: '5',
    title: 'Burna Boy: African Giant Live',
    category: 'Music',
    date: '2026-11-01',
    time: '7:00 PM',
    venue: 'O2 Arena',
    city: 'London',
    country: 'UK',
    accentColor: '#10B981',
    description:
      'Grammy Award-winning artist Burna Boy brings the African Giant world tour to London. An explosive show merging Afrobeats, Dancehall, and world music on the biggest stage.',
    ticketTypes: [
      { id: 'floor', name: 'Floor Standing', price: 120, currency: 'GBP', description: 'General floor access', available: 3000 },
      { id: 'seated', name: 'Seated', price: 85, currency: 'GBP', description: 'Reserved seating', available: 5000 },
      {
        id: 'vip',
        name: 'VIP Pit',
        price: 350,
        currency: 'GBP',
        description: 'Closest to stage',
        available: 200,
        perks: ['Early entry', 'Exclusive merch', 'Soundcheck access'],
      },
    ],
    featured: false,
    tags: ['Afrobeats', 'Live Music', 'International'],
  },
  {
    id: '6',
    title: 'Naija Comedy Night',
    category: 'Arts',
    date: '2026-09-28',
    time: '7:30 PM',
    venue: 'Balmoral Convention Center',
    city: 'Abuja',
    country: 'Nigeria',
    accentColor: '#EC4899',
    description:
      "Nigeria's biggest comedians under one roof. A night of non-stop laughter featuring top acts and 5 special guests — the perfect cure for everything.",
    ticketTypes: [
      { id: 'standard', name: 'Standard', price: 12000, currency: 'NGN', description: 'General seating', available: 1500 },
      {
        id: 'vip',
        name: 'VIP',
        price: 45000,
        currency: 'NGN',
        description: 'Premium seating + meet & greet',
        available: 150,
        perks: ['Front section', 'After-party', 'Signed merch'],
      },
    ],
    featured: false,
    tags: ['Comedy', 'Entertainment', 'Abuja'],
  },
  {
    id: '7',
    title: 'Lagos International Marathon',
    category: 'Sports',
    date: '2026-10-25',
    time: '6:00 AM',
    venue: 'National Stadium',
    city: 'Lagos',
    country: 'Nigeria',
    accentColor: '#3B82F6',
    description:
      "Join thousands of runners in Nigeria's premier marathon event. Categories for all fitness levels: 5K, 10K, Half Marathon, and Full Marathon.",
    ticketTypes: [
      { id: '5k', name: '5K Fun Run', price: 5000, currency: 'NGN', description: 'Beginner friendly', available: 5000 },
      { id: 'half', name: 'Half Marathon', price: 10000, currency: 'NGN', description: '21.1km course', available: 3000 },
      { id: 'full', name: 'Full Marathon', price: 15000, currency: 'NGN', description: '42.2km course', available: 1000 },
    ],
    featured: false,
    tags: ['Running', 'Sports', 'Fitness'],
  },
  {
    id: '8',
    title: 'West Africa Blockchain Summit',
    category: 'Tech',
    date: '2026-11-14',
    time: '9:00 AM',
    venue: 'Landmark Event Centre',
    city: 'Lagos',
    country: 'Nigeria',
    accentColor: '#06B6D4',
    description:
      'The biggest blockchain and Web3 conference in West Africa. Hear from industry leaders, explore emerging technologies, and connect with the ecosystem builders shaping tomorrow.',
    ticketTypes: [
      { id: 'delegate', name: 'Delegate', price: 35000, currency: 'NGN', description: 'Full 2-day access', available: 2000 },
      {
        id: 'vip',
        name: 'VIP Delegate',
        price: 80000,
        currency: 'NGN',
        description: 'Premium access + workshops',
        available: 200,
        perks: ['Workshop access', 'VIP dinner', 'Speaker access'],
      },
    ],
    featured: false,
    tags: ['Blockchain', 'Web3', 'Tech'],
  },
];

const DEFAULT_USER: User = {
  id: 'user_001',
  name: 'Guest User',
  email: 'guest@tick3t.app',
};

interface AppContextType {
  events: Event[];
  user: User;
  purchasedTickets: PurchasedTicket[];
  isLoading: boolean;
  updateUser: (user: User) => Promise<void>;
  purchaseTicket: (event: Event, ticketType: TicketType, quantity: number) => Promise<PurchasedTicket>;
  getTicketById: (id: string) => PurchasedTicket | undefined;
  getEventById: (id: string) => Event | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function generateKeyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'TK3T-';
  for (let i = 0; i < 3; i++) {
    let seg = '';
    for (let j = 0; j < 4; j++) {
      seg += chars[Math.floor(Math.random() * chars.length)];
    }
    code += seg;
    if (i < 2) code += '-';
  }
  return code;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [purchasedTickets, setPurchasedTickets] = useState<PurchasedTicket[]>([]);
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [ticketsData, userData] = await Promise.all([
          AsyncStorage.getItem(TICKETS_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (ticketsData) setPurchasedTickets(JSON.parse(ticketsData));
        if (userData) setUser(JSON.parse(userData));
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const updateUser = useCallback(async (newUser: User) => {
    setUser(newUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
  }, []);

  const purchaseTicket = useCallback(
    async (event: Event, ticketType: TicketType, quantity: number): Promise<PurchasedTicket> => {
      const ticket: PurchasedTicket = {
        id: generateId(),
        eventId: event.id,
        event,
        ticketType,
        quantity,
        purchaseDate: new Date().toISOString(),
        status: 'upcoming',
        keyCode: generateKeyCode(),
        holderName: user.name,
        totalAmount: ticketType.price * quantity,
      };
      const updated = [...purchasedTickets, ticket];
      setPurchasedTickets(updated);
      await AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(updated));
      return ticket;
    },
    [purchasedTickets, user.name],
  );

  const getTicketById = useCallback(
    (id: string) => purchasedTickets.find((t) => t.id === id),
    [purchasedTickets],
  );

  const getEventById = useCallback(
    (id: string) => MOCK_EVENTS.find((e) => e.id === id),
    [],
  );

  return (
    <AppContext.Provider
      value={{ events: MOCK_EVENTS, user, purchasedTickets, isLoading, updateUser, purchaseTicket, getTicketById, getEventById }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
