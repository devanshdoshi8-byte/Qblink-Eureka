// Centralized demo data for Qblink — used as fallback when backend is empty
// so the app always feels populated and ready to demo.

export interface DemoBusiness {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  rating: number;
  total_reviews: number;
  is_recommended: boolean;
  waiting: number;
  est_time: number;
  status: "active" | "inactive" | "closed";
  owner_id: string;
  logo_url: null;
  created_at: string;
  updated_at: string;
  settings: null;
}

export const DEMO_BUSINESSES: DemoBusiness[] = [
  // Restaurants
  { id: "demo-spice",   name: "Spice Garden Restaurant", category: "Restaurant", description: "North Indian, Mughlai and tandoor specialties.",    address: "Connaught Place, Delhi",   rating: 4.5, total_reviews: 267, is_recommended: false, waiting: 9,  est_time: 8,  status: "active",   owner_id: "demo", logo_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), settings: null },
  { id: "demo-tandoor", name: "Tandoor House",           category: "Restaurant", description: "Authentic kebabs, biryani and breads from the clay oven.", address: "Indiranagar, Bengaluru", rating: 4.6, total_reviews: 412, is_recommended: true,  waiting: 14, est_time: 9,  status: "active",   owner_id: "demo", logo_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), settings: null },
  { id: "demo-burger",  name: "Burger Republic",         category: "Restaurant", description: "Smash burgers, loaded fries and shakes.",            address: "Bandra Linking Road, Mumbai", rating: 4.4, total_reviews: 528, is_recommended: false, waiting: 11, est_time: 7,  status: "active",   owner_id: "demo", logo_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), settings: null },
  { id: "demo-sushi",   name: "Sushi & Sake",            category: "Restaurant", description: "Modern Japanese, sushi rolls and ramen.",            address: "Cyber Hub, Gurugram",       rating: 4.7, total_reviews: 198, is_recommended: true,  waiting: 4,  est_time: 11, status: "active",   owner_id: "demo", logo_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), settings: null },

  // Cafes
  { id: "demo-aroma",   name: "Aroma Café & Bakery",     category: "Cafe",       description: "Artisan coffee, fresh pastries and brunch.",         address: "MG Road, Bengaluru",       rating: 4.8, total_reviews: 312, is_recommended: true,  waiting: 7,  est_time: 6,  status: "active",   owner_id: "demo", logo_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), settings: null },
  { id: "demo-brew",    name: "Third Wave Brews",        category: "Cafe",       description: "Single-origin pour-overs and cold brews.",            address: "Koregaon Park, Pune",      rating: 4.6, total_reviews: 156, is_recommended: false, waiting: 5,  est_time: 5,  status: "active",   owner_id: "demo", logo_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), settings: null },
  { id: "demo-cookie",  name: "Cookie & Cream",          category: "Bakery",     description: "Cookies, cakes and dessert boxes.",                  address: "Park Street, Kolkata",     rating: 4.5, total_reviews: 220, is_recommended: false, waiting: 3,  est_time: 4,  status: "active",   owner_id: "demo", logo_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), settings: null },

  // Healthcare
  { id: "demo-sharma",  name: "Sharma Dental Clinic",    category: "Clinic",     description: "Family dentistry, orthodontics and cosmetic care.",  address: "Lajpat Nagar, Delhi",      rating: 4.6, total_reviews: 187, is_recommended: false, waiting: 3,  est_time: 15, status: "active",   owner_id: "demo", logo_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), settings: null },
  { id: "demo-city",    name: "City General Hospital",   category: "Hospital",   description: "OPD consultations and diagnostic services.",         address: "Park Street, Kolkata",     rating: 4.3, total_reviews: 856, is_recommended: false, waiting: 18, est_time: 12, status: "active",   owner_id: "demo", logo_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), settings: null },
  { id: "demo-quickfix",name: "QuickFix Clinic",         category: "Clinic",     description: "Walk-in general medicine and minor procedures.",     address: "Koramangala, Bengaluru",   rating: 4.4, total_reviews: 134, is_recommended: false, waiting: 5,  est_time: 10, status: "active",   owner_id: "demo", logo_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), settings: null },
  { id: "demo-pediac",  name: "LittleOnes Pediatrics",   category: "Clinic",     description: "Pediatrics, vaccinations and child wellness.",       address: "Whitefield, Bengaluru",    rating: 4.8, total_reviews: 201, is_recommended: true,  waiting: 6,  est_time: 14, status: "active",   owner_id: "demo", logo_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), settings: null },

  // Salons & Grooming
  { id: "demo-royal",   name: "Royal Barber Studio",     category: "Salon",      description: "Premium haircuts, beard styling and grooming.",      address: "Bandra West, Mumbai",      rating: 4.9, total_reviews: 421, is_recommended: true,  waiting: 12, est_time: 20, status: "active",   owner_id: "demo", logo_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), settings: null },
  { id: "demo-glow",    name: "Glow Beauty Lounge",      category: "Salon",      description: "Hair, skin and bridal makeup studio.",               address: "Hitech City, Hyderabad",   rating: 4.7, total_reviews: 198, is_recommended: false, waiting: 0,  est_time: 25, status: "inactive", owner_id: "demo", logo_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), settings: null },
  { id: "demo-spa",     name: "Serene Day Spa",          category: "Spa",        description: "Massage therapy and wellness rituals.",              address: "Anna Nagar, Chennai",      rating: 4.7, total_reviews: 144, is_recommended: false, waiting: 2,  est_time: 45, status: "active",   owner_id: "demo", logo_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), settings: null },

  // Government Services
  { id: "demo-passport",name: "Regional Passport Office",category: "Government", description: "Passport applications, renewals and verifications.", address: "Bhikaji Cama Place, Delhi", rating: 4.1, total_reviews: 932, is_recommended: false, waiting: 42, est_time: 18, status: "active",  owner_id: "demo", logo_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), settings: null },
  { id: "demo-rto",     name: "RTO Transport Office",    category: "Transport",  description: "Driving licence, vehicle registration and tests.",    address: "Andheri East, Mumbai",     rating: 3.9, total_reviews: 712, is_recommended: false, waiting: 56, est_time: 22, status: "active",   owner_id: "demo", logo_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), settings: null },
  { id: "demo-municipal", name: "Municipal Corporation Desk", category: "Municipal", description: "Property tax, water bills and civic certificates.", address: "Town Hall, Pune",        rating: 4.0, total_reviews: 421, is_recommended: false, waiting: 28, est_time: 15, status: "active",   owner_id: "demo", logo_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), settings: null },
  { id: "demo-pubhealth", name: "Public Healthcare Desk",  category: "Public Healthcare", description: "Government health schemes and vaccinations.",   address: "Civil Lines, Lucknow",     rating: 4.2, total_reviews: 312, is_recommended: false, waiting: 21, est_time: 12, status: "active",   owner_id: "demo", logo_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), settings: null },

  // Other
  { id: "demo-taj",     name: "Taj Business Hotel",      category: "Hotel",      description: "Front desk check-in and concierge.",                 address: "Marine Drive, Mumbai",     rating: 4.6, total_reviews: 542, is_recommended: false, waiting: 0,  est_time: 5,  status: "closed",   owner_id: "demo", logo_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), settings: null },
  { id: "demo-bank",    name: "MetroBank Branch",        category: "Other",      description: "Account services and customer support.",             address: "Brigade Road, Bengaluru",  rating: 4.0, total_reviews: 388, is_recommended: false, waiting: 16, est_time: 9,  status: "active",   owner_id: "demo", logo_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), settings: null },
];

const FIRST_NAMES = ["Priya", "Arjun", "Sneha", "Vikram", "Neha", "Rahul", "Ananya", "Karan", "Riya", "Aditya", "Pooja", "Rohan", "Meera", "Sanjay", "Divya"];
const LAST_NAMES  = ["Sharma", "Patel", "Joshi", "Singh", "Shah", "Mehta", "Iyer", "Kapoor", "Reddy", "Nair", "Verma", "Agarwal"];

export interface DemoVisitor {
  id: string;
  token_number: number;
  visitor_name: string;
  phone: string;
  status: "waiting" | "called" | "served" | "skipped";
  joined_at: string;
  called_at: string | null;
  served_at: string | null;
  queue_id: string;
}

const randPhone = () => `+91 9${Math.floor(100000000 + Math.random() * 899999999)}`;
const pickName = (i: number) =>
  `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i * 3) % LAST_NAMES.length]}`;

export const buildDemoVisitors = (queueId = "demo-queue"): DemoVisitor[] => {
  const now = Date.now();
  const list: DemoVisitor[] = [];

  // Served (earlier today)
  for (let i = 1; i <= 6; i++) {
    const joined = now - (90 - i * 8) * 60_000;
    const served = joined + (8 + Math.floor(Math.random() * 10)) * 60_000;
    list.push({
      id: `demo-v-s-${i}`, token_number: i, visitor_name: pickName(i + 4), phone: randPhone(),
      status: "served", joined_at: new Date(joined).toISOString(), called_at: new Date(served - 60_000).toISOString(),
      served_at: new Date(served).toISOString(), queue_id: queueId,
    });
  }

  // Currently called
  list.push({
    id: "demo-v-c-1", token_number: 7, visitor_name: "Priya Sharma", phone: randPhone(),
    status: "called", joined_at: new Date(now - 14 * 60_000).toISOString(),
    called_at: new Date(now - 60_000).toISOString(), served_at: null, queue_id: queueId,
  });

  // Waiting
  const waitingNames = ["Arjun Patel", "Sneha Joshi", "Vikram Singh", "Neha Shah", "Rahul Mehta"];
  waitingNames.forEach((name, idx) => {
    list.push({
      id: `demo-v-w-${idx}`, token_number: 8 + idx, visitor_name: name, phone: randPhone(),
      status: "waiting", joined_at: new Date(now - (12 - idx * 2) * 60_000).toISOString(),
      called_at: null, served_at: null, queue_id: queueId,
    });
  });

  return list;
};

// Stable demo settings preset for the Settings page when nothing is saved.
export const DEMO_SETTINGS = {
  name: "Aroma Café & Bakery",
  category: "Restaurant",
  description: "Artisan coffee, fresh pastries and weekend brunch.",
  address: "MG Road, Bengaluru",
};
