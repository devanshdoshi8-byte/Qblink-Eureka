import { IndustryMorphConfig, MorphIndustryKey } from "../types";

import clinic480 from "@/assets/env-clinic-480.webp";
import clinic800 from "@/assets/env-clinic-800.webp";
import clinic1200 from "@/assets/env-clinic-1200.webp";
import clinic800Jpg from "@/assets/env-clinic-800.jpg";

import cafe480 from "@/assets/env-cafe-480.webp";
import cafe800 from "@/assets/env-cafe-800.webp";
import cafe1200 from "@/assets/env-cafe-1200.webp";
import cafe800Jpg from "@/assets/env-cafe-800.jpg";

import salon480 from "@/assets/env-salon-480.webp";
import salon800 from "@/assets/env-salon-800.webp";
import salon1200 from "@/assets/env-salon-1200.webp";
import salon800Jpg from "@/assets/env-salon-800.jpg";

import gov480 from "@/assets/env-gov-480.webp";
import gov800 from "@/assets/env-gov-800.webp";
import gov1200 from "@/assets/env-gov-1200.webp";
import gov800Jpg from "@/assets/env-gov-800.jpg";

export const MORPH_INDUSTRIES: Record<MorphIndustryKey, IndustryMorphConfig> = {
  clinic: {
    id: "clinic",
    label: "Clinics & Diagnostics",
    icon: "🏥",
    locationName: "Metro Care Health & OPD",
    tagline: "Patients wait comfortably nearby instead of crowding in sick rooms",
    description: "Doctor consultations, diagnostic blood draws, and specialist appointments with live estimated turn arrivals.",
    themeColor: "from-blue-600 to-cyan-500",
    customer: {
      roleTitle: "Patient",
      name: "Anya Rao",
      tokenNumber: "P-104",
      queueLabel: "Dr. Mehta Consultation • OPD Room 3",
      peopleAheadText: "3 patients ahead",
      estimatedWaitText: "~9 mins",
      destinationText: "Consultation Room 3",
      statusBadge: "Live OPD Pass",
      actionNote: "Waiting at open-air terrace cafe with laptop. Proceeding when alerted.",
    },
    business: {
      operatorRole: "Front Desk Receptionist",
      counterName: "Triage & Check-in Desk",
      nowServingToken: "P-101",
      waitingCountText: "12 Patients in Line",
      velocityMetric: "3.0 min / consultation",
      manifestSample: [
        { token: "P-102", name: "Vikram S.", detail: "In Lobby" },
        { token: "P-103", name: "Meera K.", detail: "Waiting in Car" },
        { token: "P-104", name: "Anya Rao", detail: "Terrace Cafe (Remote)" },
      ],
      operationalImpactNote: "Zero repetitive 'Kitna time lagega?' front-desk interruptions.",
    },
    frictionProblem: "Sick patients packed tightly in waiting rooms with high stress and zero queue transparency.",
    qblinkFix: "Patients scan QR, track their exact turn live on their phone, and walk in 2 minutes before the doctor is ready.",
    heroImage: {
      webp480: clinic480,
      webp800: clinic800,
      webp1200: clinic1200,
      jpg: clinic800Jpg,
    },
  },
  dining: {
    id: "dining",
    label: "Cafes & Dining",
    icon: "☕",
    locationName: "Artisan Grill & Rooftop Dining",
    tagline: "Hungry guests explore nearby streets instead of blocking the front door",
    description: "Table seating queues, party size management, and kitchen pickup buzzers on any mobile browser.",
    themeColor: "from-amber-600 to-orange-500",
    customer: {
      roleTitle: "Dining Guest",
      name: "Rahul Verma (Party of 4)",
      tokenNumber: "T-012",
      queueLabel: "4-Top Booth Table Queue",
      peopleAheadText: "2 parties ahead",
      estimatedWaitText: "~12 mins",
      destinationText: "Table 14 (Window Booth)",
      statusBadge: "Table Reservation",
      actionNote: "Browsing nearby boutique shops. Phone will buzz when table is cleared.",
    },
    business: {
      operatorRole: "Host & Floor Captain",
      counterName: "Front Host Stand",
      nowServingToken: "T-010",
      waitingCountText: "7 Tables Waiting",
      velocityMetric: "4.2 min / table turn",
      manifestSample: [
        { token: "T-010", name: "Party of 2 (Kavita)", detail: "Seated at Bar" },
        { token: "T-011", name: "Party of 6 (Sharma)", detail: "Waiting in Lobby" },
        { token: "T-012", name: "Party of 4 (Rahul)", detail: "Nearby Walkway" },
      ],
      operationalImpactNote: "No lost walk-ins from crowded entryway congestion; 100% table utilization.",
    },
    frictionProblem: "Walk-in diners see a crowded doorway, assume a 1-hour wait, and walk away to competitors.",
    qblinkFix: "Guests join the digital table queue instantly, grab a drink nearby, and return the moment their table is ready.",
    heroImage: {
      webp480: cafe480,
      webp800: cafe800,
      webp1200: cafe1200,
      jpg: cafe800Jpg,
    },
  },
  salon: {
    id: "salon",
    label: "Salons & Spas",
    icon: "💇",
    locationName: "Luxe Studio & Styling Lounge",
    tagline: "Clients run errands while waiting for their preferred master stylist",
    description: "Stylist chair allocation, multi-treatment tracking, and walk-in smoothing with rolling service velocity.",
    themeColor: "from-purple-600 to-pink-500",
    customer: {
      roleTitle: "Salon Client",
      name: "Priya Sundaram",
      tokenNumber: "S-042",
      queueLabel: "Stylist Meera • Haircut & Keratin Spa",
      peopleAheadText: "1 client ahead",
      estimatedWaitText: "~6 mins",
      destinationText: "Styling Chair #4",
      statusBadge: "Styling Pass",
      actionNote: "Picking up groceries next door. Returning in 5 mins for shampoo wash.",
    },
    business: {
      operatorRole: "Salon Floor Manager",
      counterName: "Styling Reception Desk",
      nowServingToken: "S-040",
      waitingCountText: "5 Clients in Line",
      velocityMetric: "15 min / service slot",
      manifestSample: [
        { token: "S-040", name: "Ananya M.", detail: "Styling in Chair 2" },
        { token: "S-041", name: "Rohan D.", detail: "Shampoo Station" },
        { token: "S-042", name: "Priya S.", detail: "Nearby (5m away)" },
      ],
      operationalImpactNote: "Maximizes chair revenue and stylist time while eliminating lobby congestion.",
    },
    frictionProblem: "Clients hate sitting in waiting chairs for 30 minutes with wet hair reading old magazines.",
    qblinkFix: "Clients grab coffee or shop nearby, arriving exactly when their stylist's station opens.",
    heroImage: {
      webp480: salon480,
      webp800: salon800,
      webp1200: salon1200,
      jpg: salon800Jpg,
    },
  },
  government: {
    id: "government",
    label: "Government & Banking",
    icon: "🏛️",
    locationName: "Citizen Civic & Permit Center",
    tagline: "Citizens track multi-counter document permits with dignity and clarity",
    description: "Token document verification, multi-counter civic desks, and municipal public service routing.",
    themeColor: "from-emerald-600 to-teal-500",
    customer: {
      roleTitle: "Citizen Applicant",
      name: "Deepak Kumar",
      tokenNumber: "G-082",
      queueLabel: "Vehicle Permit & License Verification",
      peopleAheadText: "4 citizens ahead",
      estimatedWaitText: "~14 mins",
      destinationText: "Permit Counter #4",
      statusBadge: "Citizen Token",
      actionNote: "Reviewing application documents in garden courtyard. Ready for counter call.",
    },
    business: {
      operatorRole: "Municipal Officer",
      counterName: "Permit Counter #4",
      nowServingToken: "G-078",
      waitingCountText: "18 Tokens Active",
      velocityMetric: "3.5 min / verification",
      manifestSample: [
        { token: "G-079", name: "Suresh P.", detail: "Counter 2 (Biometrics)" },
        { token: "G-080", name: "Fatima N.", detail: "Counter 4 (Permits)" },
        { token: "G-082", name: "Deepak K.", detail: "Courtyard (Remote)" },
      ],
      operationalImpactNote: "Transforms chaotic public halls into orderly, measurable civic service workflows.",
    },
    frictionProblem: "Hundreds of frustrated citizens clutching paper slips in crowded, noisy civic halls.",
    qblinkFix: "Digital token distribution routes citizens smoothly across counters with transparent live wait estimates.",
    heroImage: {
      webp480: gov480,
      webp800: gov800,
      webp1200: gov1200,
      jpg: gov800Jpg,
    },
  },
};
