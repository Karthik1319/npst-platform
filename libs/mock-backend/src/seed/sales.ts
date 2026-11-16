import { dateFrom, minutesAgo } from '../dates';
import type { Random } from '../random';
import type {
  Customer,
  DocumentRef,
  Industry,
  Lead,
  LeadSource,
  LeadStatus,
  Opportunity,
  OpportunityStage,
  TimelineEntry,
} from '../types';
import {
  emailFor,
  FIRST_NAMES,
  LAST_NAMES,
  SALES_MANAGER,
  SALES_TEAM,
  SOLUTIONS_TEAM,
} from './people';

const CRORE = 10_000_000;
const LAKH = 100_000;

/** Invented banks and fintechs (customers and prospects). */
export const CUSTOMERS: Customer[] = [
  customer(
    'C-101',
    'ABC Bank',
    'Private bank',
    'Mumbai',
    null,
    'Meera Iyer',
    'Chief Digital Officer',
  ),
  customer(
    'C-102',
    'Meridian Co-operative Bank',
    'Co-operative bank',
    'Pune',
    2021,
    'Sunil Gokhale',
    'General Manager – IT',
  ),
  customer(
    'C-103',
    'Sahyog Urban Co-op Bank',
    'Co-operative bank',
    'Nagpur',
    2019,
    'Anita Deshpande',
    'Head of Operations',
  ),
  customer(
    'C-104',
    'Northwind Small Finance Bank',
    'Small finance bank',
    'Bengaluru',
    null,
    'Karthik Hegde',
    'VP – Digital Channels',
  ),
  customer(
    'C-105',
    'Pinnacle Payments Bank',
    'Payments bank',
    'New Delhi',
    2026,
    'Ravi Khanna',
    'Chief Technology Officer',
  ),
  customer(
    'C-106',
    'Coastal Gramin Bank',
    'Regional rural bank',
    'Mangaluru',
    2020,
    'Shalini Shetty',
    'Chief Manager – IT',
  ),
  customer(
    'C-107',
    'Vista Fintech',
    'Fintech',
    'Gurugram',
    null,
    'Kabir Sinha',
    'Co-founder & CEO',
  ),
  customer(
    'C-108',
    'Horizon Finance',
    'NBFC',
    'Chennai',
    2022,
    'Lakshmi Narayanan',
    'Head of Lending Technology',
  ),
  customer(
    'C-109',
    'Unity Mutual Co-op Bank',
    'Co-operative bank',
    'Ahmedabad',
    2018,
    'Hitesh Patel',
    'CEO',
  ),
  customer(
    'C-110',
    'Lotus Small Finance Bank',
    'Small finance bank',
    'Kolkata',
    2024,
    'Debashish Sen',
    'Chief Information Officer',
  ),
  customer(
    'C-111',
    'Trident Bank',
    'Private bank',
    'Hyderabad',
    null,
    'Srinivas Reddy',
    'Chief Risk Officer',
  ),
  customer(
    'C-112',
    'Sapphire Payments',
    'Fintech',
    'Mumbai',
    2023,
    'Nikita Shah',
    'Head of Product',
  ),
  customer(
    'C-113',
    'Everest Co-operative Bank',
    'Co-operative bank',
    'Nashik',
    2022,
    'Prakash Wagh',
    'Manager – Digital Banking',
  ),
  customer(
    'C-114',
    'Riverside Gramin Bank',
    'Regional rural bank',
    'Jaipur',
    2023,
    'Vikas Thakur',
    'AGM – IT',
  ),
  customer(
    'C-115',
    'Orion Capital',
    'NBFC',
    'Pune',
    null,
    'Rashmi Pawar',
    'Chief Operating Officer',
  ),
  customer(
    'C-116',
    'Bluewave Fintech',
    'Fintech',
    'Bengaluru',
    2025,
    'Aditya Kamath',
    'CTO',
  ),
  customer(
    'C-117',
    'Crest Urban Co-op Bank',
    'Co-operative bank',
    'Surat',
    null,
    'Jignesh Trivedi',
    'General Manager',
  ),
  customer(
    'C-118',
    'Summit Small Finance Bank',
    'Small finance bank',
    'Lucknow',
    2025,
    'Neeraj Mishra',
    'Head of Payments',
  ),
];

function customer(
  id: string,
  name: string,
  industry: Industry,
  city: string,
  customerSince: number | null,
  contactName: string,
  contactTitle: string,
): Customer {
  const domain = `${name.toLowerCase().split(' ')[0]}.example`;
  return {
    id,
    name,
    industry,
    city,
    customerSince,
    contactName,
    contactTitle,
    email: emailFor(contactName, domain),
    phone: `+91 22 ${4000 + Number(id.slice(2)) * 7} ${1000 + Number(id.slice(2)) * 13}`,
  };
}

/** What each product usually involves (used for requirements and summaries). */
export const PRODUCTS: Record<string, readonly string[]> = {
  'Digital Banking Platform': [
    'Retail and corporate internet banking on one platform',
    'Mobile app for Android and iOS with biometric login',
    'Integration with the existing core banking system (CBS)',
    'Go-live of phase 1 within 9 months of signing',
    'Compliance with RBI digital payment security controls',
  ],
  'UPI Switch': [
    'NPCI-certified UPI switch sized for 1,000 TPS at peak',
    'Migration of existing VPAs without customer downtime',
    'UPI Lite and UPI 123PAY support',
    'Active-active disaster recovery site',
    'Real-time dispute and complaint handling',
  ],
  'Video KYC Onboarding': [
    'Video KYC as per the RBI KYC master direction',
    'Aadhaar and PAN verification',
    'Savings account opening in under 10 minutes',
    'Agent workbench with queue management',
  ],
  'Merchant Acquiring (UPI + Soundbox)': [
    'Merchant onboarding app for field agents',
    'Dynamic QR and Soundbox integration',
    'Settlement and reconciliation dashboard',
    'Target of 50,000 merchants in year one',
  ],
  'Fraud Risk Management': [
    'Real-time monitoring of UPI and card transactions',
    'Rule engine combined with machine-learning risk scores',
    'Case management for the fraud operations team',
    'Integration with CBS and switch transaction logs',
  ],
  'Payment Gateway': [
    'Cards, UPI, net banking and wallets in one checkout',
    'PCI DSS compliant hosted checkout page',
    'Merchant dashboard with refunds and reports',
    'T+1 settlement to merchant accounts',
  ],
  'BBPS Integration': [
    'BBPS customer and biller operating unit',
    'Bill fetch and bill payment APIs',
    'Complaint management as per NPCI guidelines',
  ],
  'Mobile Banking App': [
    'Redesigned mobile banking app with UPI built in',
    'Self-service for cards, cheques and fixed deposits',
    'Support for regional languages',
  ],
  'API Banking Platform': [
    'Developer portal with sandbox',
    'API gateway with OAuth 2.0 and rate limits',
    'Partner onboarding and approval workflow',
  ],
  'Loan Origination System': [
    'Digital loan journeys for personal and MSME loans',
    'Bureau, bank statement and GST data checks',
    'Rule-based credit decisions with manual review',
  ],
};

export const PRODUCT_NAMES = Object.keys(PRODUCTS);

/** Stages a deal has passed through, in order, up to `stage`. */
const STAGE_PATH: Record<OpportunityStage, OpportunityStage[]> = {
  Opportunity: ['Opportunity'],
  Proposal: ['Opportunity', 'Proposal'],
  Negotiation: ['Opportunity', 'Proposal', 'Negotiation'],
  Won: ['Opportunity', 'Proposal', 'Negotiation', 'Won'],
  Lost: ['Opportunity', 'Proposal', 'Lost'],
};

const PROBABILITY: Record<OpportunityStage, number> = {
  Opportunity: 30,
  Proposal: 50,
  Negotiation: 75,
  Won: 100,
  Lost: 0,
};

const NEXT_ACTION: Record<OpportunityStage, string> = {
  Opportunity: 'Discovery workshop with the customer',
  Proposal: 'Present the solution proposal',
  Negotiation: 'Agree final commercials',
  Won: 'Hand over to delivery',
  Lost: 'Record loss review',
};

interface FeaturedDeal {
  id: string;
  customerId: string;
  product: string;
  name?: string;
  value: number;
  stage: OpportunityStage;
  probability?: number;
  owner: string;
  closeInDays: number;
  createdDaysAgo: number;
  nextAction?: string;
  nextActionInDays?: number;
  summary?: string;
  lostReason?: string;
}

/** Deals the demo talks about; the rest are generated. */
const FEATURED: FeaturedDeal[] = [
  {
    id: 'OP-1043',
    customerId: 'C-101',
    product: 'Digital Banking Platform',
    value: 3.8 * CRORE,
    stage: 'Proposal',
    probability: 60,
    owner: 'Rahul Kulkarni',
    closeInDays: 24,
    createdDaysAgo: 41,
    nextAction: 'Solution proposal review with the CDO office',
    nextActionInDays: 2,
    summary:
      'ABC Bank is replacing its internet and mobile banking with one digital platform. NPST is shortlisted with two other vendors; the proposal review with the Chief Digital Officer decides the final round.',
  },
  {
    id: 'OP-1038',
    customerId: 'C-102',
    product: 'UPI Switch',
    name: 'UPI Switch Migration',
    value: 1.6 * CRORE,
    stage: 'Negotiation',
    owner: 'Sneha Patil',
    closeInDays: 12,
    createdDaysAgo: 63,
    nextAction: 'Send revised commercials (3-year AMC)',
    nextActionInDays: 0,
  },
  {
    id: 'OP-1046',
    customerId: 'C-104',
    product: 'Video KYC Onboarding',
    value: 2.2 * CRORE,
    stage: 'Opportunity',
    probability: 35,
    owner: 'Kavya Reddy',
    closeInDays: 58,
    createdDaysAgo: 9,
    nextAction: 'Discovery workshop with digital channels team',
    nextActionInDays: 3,
  },
  {
    id: 'OP-1041',
    customerId: 'C-111',
    product: 'Fraud Risk Management',
    value: 4.4 * CRORE,
    stage: 'Proposal',
    owner: 'Imran Shaikh',
    closeInDays: 35,
    createdDaysAgo: 30,
    nextAction: 'Technical evaluation by the Solutions team',
    nextActionInDays: 4,
  },
  {
    id: 'OP-1035',
    customerId: 'C-107',
    product: 'Payment Gateway',
    value: 85 * LAKH,
    stage: 'Negotiation',
    probability: 80,
    owner: 'Rahul Kulkarni',
    closeInDays: 6,
    createdDaysAgo: 52,
    nextAction: 'Contract redlines with legal',
    nextActionInDays: -1,
  },
  {
    id: 'OP-1029',
    customerId: 'C-105',
    product: 'Merchant Acquiring (UPI + Soundbox)',
    value: 2.9 * CRORE,
    stage: 'Won',
    owner: 'Sneha Patil',
    closeInDays: -12,
    createdDaysAgo: 96,
  },
  {
    id: 'OP-1022',
    customerId: 'C-106',
    product: 'Mobile Banking App',
    value: 1.1 * CRORE,
    stage: 'Lost',
    owner: 'Kavya Reddy',
    closeInDays: -20,
    createdDaysAgo: 110,
    lostReason: 'Customer chose a lower-priced vendor',
  },
];

export function seedOpportunities(now: Date, random: Random): Opportunity[] {
  const deals: FeaturedDeal[] = [...FEATURED];
  const stages: OpportunityStage[] = [
    ...Array<OpportunityStage>(9).fill('Opportunity'),
    ...Array<OpportunityStage>(7).fill('Proposal'),
    ...Array<OpportunityStage>(5).fill('Negotiation'),
    ...Array<OpportunityStage>(8).fill('Won'),
    ...Array<OpportunityStage>(4).fill('Lost'),
  ];
  stages.forEach((stage, index) => {
    const closed = stage === 'Won' || stage === 'Lost';
    deals.push({
      id: `OP-${1001 + index}`,
      customerId: random.pick(CUSTOMERS).id,
      product: random.pick(PRODUCT_NAMES),
      value: random.int(3, 24) * 10 * LAKH,
      stage,
      owner: random.pick(SALES_TEAM),
      closeInDays: closed ? -random.int(5, 120) : random.int(5, 90),
      createdDaysAgo: random.int(20, 150),
      nextActionInDays: random.int(-3, 10),
      ...(stage === 'Lost'
        ? {
            lostReason: random.pick([
              'Budget moved to next financial year',
              'Customer chose a lower-priced vendor',
              'Project put on hold by the customer',
            ]),
          }
        : {}),
    });
  });
  // Ids 1001–1033 are generated; skip any id a featured deal already uses.
  const used = new Set(FEATURED.map((deal) => deal.id));
  const unique = deals.filter(
    (deal, index) => index < FEATURED.length || !used.has(deal.id),
  );
  return unique
    .map((deal) => buildOpportunity(deal, now, random))
    .sort((a, b) => b.id.localeCompare(a.id));
}

function buildOpportunity(
  deal: FeaturedDeal,
  now: Date,
  random: Random,
): Opportunity {
  const found = CUSTOMERS.find((c) => c.id === deal.customerId);
  if (!found) throw new Error(`Unknown customer ${deal.customerId}`);
  const name = deal.name ?? deal.product;
  const architect = random.pick(SOLUTIONS_TEAM);
  const createdAt = minutesAgo(now, deal.createdDaysAgo * 24 * 60);
  const path = STAGE_PATH[deal.stage];
  const stepDays = Math.max(
    1,
    Math.floor(deal.createdDaysAgo / (path.length + 1)),
  );

  const timeline: TimelineEntry[] = [
    {
      id: `${deal.id}-t0`,
      at: createdAt,
      actor: deal.owner,
      text: `Qualified lead converted to opportunity`,
    },
  ];
  path.slice(1).forEach((stage, index) => {
    timeline.push({
      id: `${deal.id}-t${index + 1}`,
      at: minutesAgo(
        now,
        (deal.createdDaysAgo - stepDays * (index + 1)) * 24 * 60,
      ),
      actor: deal.owner,
      text:
        stage === 'Won'
          ? 'Deal won: purchase order received'
          : stage === 'Lost'
            ? `Deal lost: ${deal.lostReason ?? 'no reason recorded'}`
            : `Stage changed to ${stage}`,
    });
  });
  if (deal.id === 'OP-1043') {
    timeline.push(
      {
        id: 'OP-1043-t9',
        at: minutesAgo(now, 6 * 24 * 60),
        actor: 'Vikram Rao',
        text: 'Solution architecture walkthrough held with the bank’s IT team',
      },
      {
        id: 'OP-1043-t10',
        at: minutesAgo(now, 15),
        actor: 'Rahul Kulkarni',
        text: 'Proposal v2 uploaded for management review',
      },
    );
  }
  timeline.sort((a, b) => b.at.localeCompare(a.at));

  const documents: DocumentRef[] = [
    doc(
      deal.id,
      1,
      `RFP_${slug(found.name)}.pdf`,
      'RFP',
      1840,
      deal.owner,
      createdAt,
    ),
  ];
  if (path.includes('Proposal')) {
    documents.push(
      doc(
        deal.id,
        2,
        `NPST_Proposal_${slug(found.name)}_v2.pdf`,
        'Proposal',
        3260,
        architect,
        minutesAgo(now, (deal.createdDaysAgo / 2) * 24 * 60),
      ),
      doc(
        deal.id,
        3,
        'Solution_Overview.pptx',
        'Presentation',
        5120,
        architect,
        minutesAgo(now, (deal.createdDaysAgo / 2) * 24 * 60),
      ),
    );
  }
  if (path.includes('Negotiation')) {
    documents.push(
      doc(
        deal.id,
        4,
        'Commercials_Draft.xlsx',
        'Commercials',
        96,
        deal.owner,
        minutesAgo(now, 8 * 24 * 60),
      ),
    );
  }
  if (deal.stage === 'Won') {
    documents.push(
      doc(
        deal.id,
        5,
        'Signed_Contract.pdf',
        'Contract',
        2210,
        SALES_MANAGER,
        minutesAgo(now, Math.max(1, -deal.closeInDays) * 24 * 60),
      ),
    );
  }

  return {
    id: deal.id,
    name,
    customerId: found.id,
    customerName: found.name,
    product: deal.product,
    value: deal.value,
    stage: deal.stage,
    probability: deal.probability ?? PROBABILITY[deal.stage],
    owner: deal.owner,
    expectedClose: dateFrom(now, deal.closeInDays),
    nextAction: deal.nextAction ?? NEXT_ACTION[deal.stage],
    nextActionDue: dateFrom(
      now,
      deal.nextActionInDays ??
        (deal.stage === 'Won' || deal.stage === 'Lost' ? deal.closeInDays : 3),
    ),
    createdAt,
    summary:
      deal.summary ??
      `${found.name} (${found.industry.toLowerCase()}, ${found.city}) is evaluating a ${deal.product.toLowerCase()} from NPST.`,
    requirements: [...(PRODUCTS[deal.product] ?? [])],
    team: [
      { name: deal.owner, role: 'Account owner' },
      { name: architect, role: 'Solutions architect' },
      { name: SALES_MANAGER, role: 'Sales manager' },
    ],
    timeline,
    notes:
      deal.id === 'OP-1043'
        ? [
            {
              id: 'OP-1043-n1',
              at: minutesAgo(now, 3 * 24 * 60),
              author: 'Rahul Kulkarni',
              text: 'CDO wants a phased go-live: retail first, corporate banking in phase 2. Pricing should reflect that.',
            },
            {
              id: 'OP-1043-n2',
              at: minutesAgo(now, 26 * 60),
              author: 'Arjun Mehta',
              text: 'Competitors are quoting 15–20% lower. Lead with our UPI and CBS integration track record.',
            },
          ]
        : [
            {
              id: `${deal.id}-n1`,
              at: minutesAgo(
                now,
                Math.max(1, deal.createdDaysAgo - 5) * 24 * 60,
              ),
              author: deal.owner,
              text: `Decision makers identified: ${found.contactName} (${found.contactTitle}).`,
            },
          ],
    documents,
    ...(deal.lostReason ? { lostReason: deal.lostReason } : {}),
  };
}

function doc(
  dealId: string,
  n: number,
  name: string,
  kind: DocumentRef['kind'],
  sizeKb: number,
  uploadedBy: string,
  uploadedAt: string,
): DocumentRef {
  return { id: `${dealId}-d${n}`, name, kind, sizeKb, uploadedBy, uploadedAt };
}

const slug = (name: string) => name.replace(/[^A-Za-z0-9]+/g, '_');

// ---------- Leads ----------

const LEAD_PREFIXES = [
  'Aster',
  'Banyan',
  'Cedar',
  'Delta',
  'Falcon',
  'Granite',
  'Harbor',
  'Indigo',
  'Juniper',
  'Keystone',
  'Lighthouse',
  'Maple',
  'Nova',
  'Oakridge',
  'Peak',
  'Quartz',
  'Redwood',
  'Silverline',
  'Tidal',
  'Vertex',
  'Willow',
  'Zenith',
  'Amber',
  'Beacon',
] as const;

const LEAD_SUFFIX: Record<Industry, string> = {
  'Private bank': 'Bank',
  'Co-operative bank': 'Urban Co-op Bank',
  'Small finance bank': 'Small Finance Bank',
  'Payments bank': 'Payments Bank',
  'Regional rural bank': 'Gramin Bank',
  NBFC: 'Finance',
  Fintech: 'Pay',
};

const INDUSTRIES = Object.keys(LEAD_SUFFIX) as Industry[];
const SOURCES: LeadSource[] = [
  'Website',
  'Referral',
  'Event',
  'Partner',
  'LinkedIn',
  'RFP portal',
  'Cold outreach',
];
const CITIES = [
  'Mumbai',
  'Pune',
  'Bengaluru',
  'Chennai',
  'Hyderabad',
  'New Delhi',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Indore',
  'Kochi',
  'Lucknow',
  'Nagpur',
  'Surat',
  'Coimbatore',
] as const;
const TITLES = [
  'Head of IT',
  'Chief Digital Officer',
  'General Manager',
  'CTO',
  'VP – Payments',
  'Head of Operations',
  'Chief Manager – IT',
  'CEO',
] as const;

export function seedLeads(now: Date, random: Random): Lead[] {
  const statuses: LeadStatus[] = [
    ...Array<LeadStatus>(24).fill('New'),
    ...Array<LeadStatus>(22).fill('Contacted'),
    ...Array<LeadStatus>(38).fill('Qualified'),
    ...Array<LeadStatus>(14).fill('Unqualified'),
    ...Array<LeadStatus>(26).fill('Converted'),
  ];
  const usedNames = new Set<string>();
  return statuses
    .map((status, index): Lead => {
      const industry = random.pick(INDUSTRIES);
      let company: string;
      do {
        company = `${random.pick(LEAD_PREFIXES)} ${LEAD_SUFFIX[industry]}`;
      } while (
        usedNames.has(company) &&
        usedNames.size < LEAD_PREFIXES.length * INDUSTRIES.length
      );
      usedNames.add(company);
      const contactName = `${random.pick(FIRST_NAMES)} ${random.pick(LAST_NAMES)}`;
      // Newer leads are more likely to still be New or Contacted.
      const ageDays =
        status === 'New'
          ? random.int(0, 12)
          : status === 'Contacted'
            ? random.int(3, 30)
            : random.int(10, 88);
      return {
        id: `LD-${2101 + index}`,
        company,
        contactName,
        contactTitle: random.pick(TITLES),
        email: emailFor(
          contactName,
          `${company.split(' ')[0]?.toLowerCase() ?? 'lead'}.example`,
        ),
        phone: `+91 9${random.int(100, 999)} ${random.int(10000, 99999)}`,
        source: random.pick(SOURCES),
        industry,
        city: random.pick(CITIES),
        owner: random.pick(SALES_TEAM),
        status,
        interest: random.pick(PRODUCT_NAMES),
        estimatedValue: random.int(3, 40) * 10 * LAKH,
        createdAt: minutesAgo(now, ageDays * 24 * 60 + random.int(0, 600)),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
