import { Block, DocPage, PdfDocument, TemplatePack } from './types';
import { uid } from './utils';

const now = Date.now();
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

function page(blocks: Block[]): DocPage {
  return { blocks, annotations: [] };
}

export function buildSampleDocuments(): PdfDocument[] {
  const purchase: PdfDocument = {
    id: uid(),
    title: 'Residential Purchase Agreement — Miami Beach',
    type: 'contract',
    status: 'pending',
    parties: ['SunCoast Realty Group', 'Marcus & Elena Thompson'],
    author: 'Sarah Kim',
    createdAt: now - 3 * DAY,
    updatedAt: now - 2 * HOUR,
    fileSize: '312 KB',
    source: 'sample',
    viewedBy: ['Marcus Chen'],
    pages: [
      page([
        { type: 'title', text: 'RESIDENTIAL PURCHASE AGREEMENT' },
        { type: 'subtitle', text: 'State of Florida — Miami-Dade County' },
        { type: 'gap', h: 10 },
        {
          type: 'meta',
          rows: [
            ['Contract No.', 'RPA-2026-0451'],
            ['Effective Date', 'September 1, 2026'],
            ['Closing Date', 'October 15, 2026'],
            ['Governing Law', 'State of Florida'],
          ],
        },
        { type: 'gap', h: 10 },
        {
          type: 'meta',
          rows: [
            ['Property', '1420 Ocean Drive, Apt 7B'],
            ['City / County', 'Miami Beach, Miami-Dade County'],
            ['Parcel ID', '05-42-31-001-0842'],
          ],
        },
        { type: 'gap', h: 14 },
        { type: 'heading', text: '1. Purchase Price & Deposit' },
        {
          type: 'paragraph',
          text: 'Buyer agrees to purchase the Property for Seven Hundred Eighty-Five Thousand Dollars ($785,000). Within three (3) business days of the Effective Date, Buyer shall deposit $15,000 as an earnest money deposit with the escrow agent, SunCoast Title & Escrow, LLC.',
        },
        { type: 'gap', h: 8 },
        { type: 'heading', text: '2. Financing' },
        {
          type: 'paragraph',
          text: 'This contract is contingent upon Buyer obtaining a conventional mortgage of at least $628,000 (80% of the purchase price) at an interest rate not to exceed 6.75% APR, within forty-five (45) days of the Effective Date.',
        },
        { type: 'gap', h: 8 },
        { type: 'heading', text: '3. Inspections & Due Diligence' },
        {
          type: 'paragraph',
          text: 'Buyer shall have ten (10) days from the Effective Date to complete a general home inspection, wind mitigation inspection, four-point inspection, and termite inspection. Buyer may terminate this contract for any reason during the inspection period and receive a full refund of the earnest money deposit.',
        },
        { type: 'gap', h: 8 },
        { type: 'heading', text: '4. Closing Costs & Prorations' },
        {
          type: 'paragraph',
          text: 'Seller shall pay the documentary stamp taxes on the deed and the real estate brokerage commissions. Buyer shall pay all closing costs associated with financing, the title search, and lender-required insurance. Property taxes and HOA dues shall be prorated as of the Closing Date.',
        },
        { type: 'gap', h: 12 },
        { type: 'divider' },
        { type: 'gap', h: 8 },
        { type: 'sigline', label: 'Buyer — Marcus & Elena Thompson' },
        { type: 'gap', h: 6 },
        { type: 'sigline', label: 'Seller — SunCoast Realty Group' },
      ]),
      page([
        { type: 'title', text: 'ADDENDUM A — PROPERTY DISCLOSURE' },
        { type: 'subtitle', text: 'Florida Seller\'s Property Condition Disclosure' },
        { type: 'gap', h: 12 },
        { type: 'heading', text: 'Property Condition' },
        {
          type: 'paragraph',
          text: 'The Property was built in 1998 and features impact-resistant windows and doors, a standing-seam metal roof (replaced 2021), and a central HVAC system (replaced 2023). The Property is located in FEMA Flood Zone X (minimal risk).',
        },
        { type: 'gap', h: 8 },
        { type: 'heading', text: 'Known Issues' },
        {
          type: 'list',
          items: [
            'No known structural defects or foundation issues',
            'No history of sinkholes or subsidence',
            'No water intrusion or prior storm damage claims',
            'Termite treatment completed March 2026',
          ],
        },
        { type: 'gap', h: 10 },
        { type: 'heading', text: 'HOA & Community' },
        {
          type: 'paragraph',
          text: 'The Property is part of the Ocean Drive Condominium Association. Monthly HOA dues are $845, covering building insurance, exterior maintenance, and amenities. The Association maintains a healthy reserve fund and has no pending special assessments.',
        },
        { type: 'gap', h: 12 },
        { type: 'divider' },
        { type: 'gap', h: 8 },
        { type: 'sigline', label: 'Seller Acknowledgment' },
      ]),
    ],
  };

  const lease: PdfDocument = {
    id: uid(),
    title: 'Commercial Lease — Tampa Office',
    type: 'contract',
    status: 'pending',
    parties: ['Gulfstream Properties LLC', 'Palmetto Digital Inc.'],
    author: 'Priya Patel',
    createdAt: now - 5 * DAY,
    updatedAt: now - 26 * HOUR,
    fileSize: '148 KB',
    source: 'sample',
    pages: [
      page([
        { type: 'title', text: 'COMMERCIAL LEASE AGREEMENT' },
        { type: 'subtitle', text: 'State of Florida — Hillsborough County' },
        { type: 'gap', h: 10 },
        {
          type: 'meta',
          rows: [
            ['Lease No.', 'CL-2026-0119'],
            ['Commencement', 'October 1, 2026'],
            ['Term', '36 months'],
            ['Governing Law', 'State of Florida'],
          ],
        },
        { type: 'gap', h: 10 },
        {
          type: 'meta',
          rows: [
            ['Premises', 'Suite 400, 220 Channelside Drive'],
            ['City / County', 'Tampa, Hillsborough County'],
            ['Rentable Area', '2,400 sq ft'],
          ],
        },
        { type: 'gap', h: 14 },
        { type: 'heading', text: '1. Rent & Security Deposit' },
        {
          type: 'paragraph',
          text: 'Tenant shall pay monthly base rent of $4,800, due on the first day of each month. Tenant shall also deposit $9,600 (two months\' rent) as a security deposit, refundable at lease expiration subject to the terms herein.',
        },
        { type: 'gap', h: 8 },
        { type: 'heading', text: '2. Use of Premises' },
        {
          type: 'paragraph',
          text: 'The Premises shall be used for general office purposes and software development. Tenant shall comply with all applicable laws, ordinances, and regulations of the City of Tampa and Hillsborough County.',
        },
        { type: 'gap', h: 8 },
        { type: 'heading', text: '3. CAM & Operating Expenses' },
        {
          type: 'paragraph',
          text: 'Tenant shall pay its pro-rata share of common area maintenance (CAM) charges, estimated at $1,150 per month, covering landscaping, security, parking lot maintenance, and building insurance.',
        },
        { type: 'gap', h: 12 },
        { type: 'divider' },
        { type: 'gap', h: 8 },
        { type: 'sigline', label: 'Landlord — Gulfstream Properties LLC' },
        { type: 'gap', h: 6 },
        { type: 'sigline', label: 'Tenant — Palmetto Digital Inc.' },
      ]),
    ],
  };

  const closing: PdfDocument = {
    id: uid(),
    title: 'Closing Disclosure — Key West Condo',
    type: 'closing',
    status: 'draft',
    parties: ['SunCoast Title & Escrow', 'Marcus & Elena Thompson'],
    author: 'You',
    createdAt: now - 2 * DAY,
    updatedAt: now - 5 * HOUR,
    fileSize: '92 KB',
    source: 'sample',
    pages: [
      page([
        { type: 'title', text: 'CLOSING DISCLOSURE' },
        { type: 'subtitle', text: 'SunCoast Title & Escrow, LLC — Miami, FL' },
        { type: 'gap', h: 10 },
        {
          type: 'meta',
          rows: [
            ['File No.', 'CD-2026-0892'],
            ['Closing Date', 'October 15, 2026'],
            ['Property', '1420 Ocean Drive, Apt 7B'],
            ['Buyer', 'Marcus & Elena Thompson'],
          ],
        },
        { type: 'gap', h: 14 },
        {
          type: 'table',
          columns: ['Item', 'Amount'],
          rows: [
            ['Purchase Price', '$785,000.00'],
            ['Earnest Money Deposit', '($15,000.00)'],
            ['Loan Amount (80%)', '$628,000.00'],
            ['Cash Due at Closing', '$142,000.00'],
          ],
        },
        { type: 'gap', h: 10 },
        { type: 'heading', text: 'Closing Costs' },
        {
          type: 'table',
          columns: ['Description', 'Buyer', 'Seller'],
          rows: [
            ['Doc Stamps on Deed (0.70%)', '—', '$5,495.00'],
            ['Title Insurance', '$2,140.00', '—'],
            ['Escrow Fee', '$1,250.00', '$1,250.00'],
            ['Intangible Tax on Mortgage', '$2,512.00', '—'],
            ['Recording Fees', '$85.00', '—'],
            ['HOA Estoppel & Transfer', '$450.00', '—'],
          ],
        },
        { type: 'gap', h: 10 },
        {
          type: 'meta',
          rows: [
            ['Total Buyer Costs', '$146,437.00'],
            ['Total Seller Costs', '$6,745.00'],
          ],
        },
        { type: 'gap', h: 12 },
        { type: 'heading', text: 'Wire Instructions' },
        {
          type: 'paragraph',
          text: 'Please wire funds to SunCoast Title & Escrow, LLC, First Republic Bank, Account 8841-2209, Routing 321081669, referencing file CD-2026-0892. Do not send cash. Verify wire instructions by phone before sending.',
        },
        { type: 'gap', h: 10 },
        { type: 'divider' },
        { type: 'gap', h: 6 },
        { type: 'sigline', label: 'Acknowledged — Buyer' },
      ]),
    ],
  };

  const listing: PdfDocument = {
    id: uid(),
    title: 'Listing Agreement — Naples Villa',
    type: 'listing',
    status: 'signed',
    parties: ['SunCoast Realty Group', 'Robert & Linda Castellano'],
    author: 'Sarah Kim',
    createdAt: now - 12 * DAY,
    updatedAt: now - 4 * DAY,
    fileSize: '1.1 MB',
    source: 'sample',
    signedAt: now - 4 * DAY,
    signedBy: 'Robert Castellano',
    pages: [
      page([
        { type: 'title', text: 'EXCLUSIVE RIGHT OF SALE LISTING' },
        { type: 'subtitle', text: 'Prepared for Robert & Linda Castellano' },
        { type: 'gap', h: 10 },
        {
          type: 'meta',
          rows: [
            ['Listing No.', 'LS-2026-0312'],
            ['Broker', 'SunCoast Realty Group'],
            ['Expiration', 'December 31, 2026'],
            ['List Price', '$1,250,000'],
          ],
        },
        { type: 'gap', h: 10 },
        {
          type: 'meta',
          rows: [
            ['Property', '88 Palm Boulevard'],
            ['City / County', 'Naples, Collier County'],
            ['Type', 'Single-Family Villa'],
            ['Bed / Bath', '4 / 3.5'],
            ['Living Area', '3,120 sq ft'],
            ['Lot', '0.42 acres'],
          ],
        },
        { type: 'gap', h: 14 },
        { type: 'heading', text: 'Broker Compensation' },
        {
          type: 'paragraph',
          text: 'Seller agrees to pay Broker a commission of 5.5% of the gross sales price. Broker will co-broker 2.5% to any cooperating broker who brings a ready, willing, and able buyer.',
        },
        { type: 'gap', h: 8 },
        { type: 'heading', text: 'Included in Sale' },
        {
          type: 'list',
          items: [
            'All window treatments and fixed appliances',
            'Impact-rated sliding glass doors',
            'Heated saltwater pool and spa equipment',
            'Garage remotes and gate keypad',
          ],
        },
        { type: 'gap', h: 12 },
        { type: 'divider' },
        { type: 'gap', h: 8 },
        { type: 'sigline', label: 'Seller — Robert & Linda Castellano', signed: true },
      ]),
    ],
  };

  const rider: PdfDocument = {
    id: uid(),
    title: 'Florida HOA Disclosure & Riders',
    type: 'form',
    status: 'draft',
    parties: ['SunCoast Realty Group', 'Buyer'],
    author: 'Priya Patel',
    createdAt: now - 8 * HOUR,
    updatedAt: now - 2 * HOUR,
    fileSize: '104 KB',
    source: 'sample',
    pages: [
      page([
        { type: 'title', text: 'FLORIDA HOA DISCLOSURE & RIDERS' },
        { type: 'subtitle', text: 'Required under Florida Statutes §720.401' },
        { type: 'gap', h: 10 },
        {
          type: 'meta',
          rows: [
            ['Association', 'Ocean Drive Condominium Assn.'],
            ['Property', '1420 Ocean Drive, Miami Beach'],
            ['Monthly Dues', '$845.00'],
          ],
        },
        { type: 'gap', h: 14 },
        { type: 'heading', text: 'Rider 1 — Association Documents' },
        {
          type: 'paragraph',
          text: 'Buyer acknowledges receipt of the Declaration of Covenants, Conditions & Restrictions (CC&Rs), the Association bylaws, the annual budget, and the most recent reserve study. Buyer has 3 days to cancel this contract after receiving these documents.',
        },
        { type: 'gap', h: 8 },
        { type: 'heading', text: 'Rider 2 — Flood Insurance' },
        {
          type: 'paragraph',
          text: 'The Property is located in FEMA Flood Zone X (minimal risk). Buyer is advised to obtain a flood insurance quote. Lender requires a standard flood hazard determination form.',
        },
        { type: 'gap', h: 8 },
        { type: 'heading', text: 'Rider 3 — Windstorm Insurance' },
        {
          type: 'paragraph',
          text: 'The Property features impact-resistant windows and doors and a metal roof, qualifying for wind mitigation discounts under Florida law. Buyer shall obtain a windstorm insurance binder prior to Closing.',
        },
        { type: 'gap', h: 10 },
        { type: 'heading', text: 'Buyer Acknowledgment' },
        {
          type: 'paragraph',
          text: 'Buyer acknowledges receiving all riders and disclosures and understands the right to cancel within the applicable review periods.',
        },
        { type: 'gap', h: 12 },
        { type: 'divider' },
        { type: 'gap', h: 8 },
        { type: 'sigline', label: 'Buyer — Signature & Date' },
      ]),
    ],
  };

  return [purchase, lease, closing, listing, rider];
}

export function buildActivitySeed(documents: PdfDocument[]) {
  const byTitle = (t: string) => documents.find((d) => d.title.startsWith(t))?.id ?? documents[0].id;
  const H = 3600 * 1000;
  return [
    {
      id: 'seed-1',
      documentId: byTitle('Residential Purchase'),
      documentTitle: 'Residential Purchase Agreement — Miami Beach',
      type: 'viewed' as const,
      actor: 'Marcus Chen',
      message: 'viewed the document',
      timestamp: Date.now() - 42 * 60 * 1000,
      remote: true,
    },
    {
      id: 'seed-2',
      documentId: byTitle('Residential Purchase'),
      documentTitle: 'Residential Purchase Agreement — Miami Beach',
      type: 'commented' as const,
      actor: 'Sarah Kim',
      message: 'commented: "Can we clarify the financing contingency timeline?"',
      timestamp: Date.now() - 3 * H,
      remote: true,
    },
    {
      id: 'seed-3',
      documentId: byTitle('Listing Agreement'),
      documentTitle: 'Listing Agreement — Naples Villa',
      type: 'signed' as const,
      actor: 'Robert Castellano',
      message: 'signed the document electronically',
      timestamp: Date.now() - 4 * 24 * H,
      remote: true,
    },
    {
      id: 'seed-4',
      documentId: byTitle('Closing Disclosure'),
      documentTitle: 'Closing Disclosure — Key West Condo',
      type: 'edited' as const,
      actor: 'You',
      message: 'updated closing cost line items',
      timestamp: Date.now() - 5 * H,
    },
    {
      id: 'seed-5',
      documentId: byTitle('Commercial Lease'),
      documentTitle: 'Commercial Lease — Tampa Office',
      type: 'shared' as const,
      actor: 'Priya Patel',
      message: 'shared the document with Palmetto Digital Inc.',
      timestamp: Date.now() - 26 * H,
      remote: true,
    },
  ];
}

export function buildTemplatePacks(): TemplatePack[] {
  const freePack: TemplatePack = {
    id: 'pack-residential',
    name: 'Residential Essentials',
    description: 'Core Florida residential forms',
    pro: false,
    templates: [
      {
        id: 'tpl-purchase',
        title: 'Purchase Agreement',
        description: 'FL As-Is residential contract',
        category: 'Contract',
        pro: false,
        icon: 'document-text-outline',
        pages: [
          [
            { type: 'title', text: 'FLORIDA AS-IS RESIDENTIAL CONTRACT' },
            { type: 'subtitle', text: 'Florida Realtors / FAR Form' },
            { type: 'gap', h: 10 },
            { type: 'meta', rows: [
              ['Form', 'FAR/BAR As-Is'],
              ['Effective Date', 'September 2026'],
              ['Governing Law', 'State of Florida'],
            ]},
            { type: 'gap', h: 12 },
            { type: 'heading', text: 'Parties' },
            { type: 'paragraph', text: 'Buyer and Seller agree to the terms of this As-Is Residential Contract for the purchase of the property described below.' },
            { type: 'gap', h: 8 },
            { type: 'heading', text: 'Property' },
            { type: 'meta', rows: [
              ['Address', '____________________'],
              ['County', '____________________'],
              ['Parcel ID', '____________________'],
            ]},
            { type: 'gap', h: 12 },
            { type: 'divider' },
            { type: 'gap', h: 8 },
            { type: 'sigline', label: 'Buyer' },
            { type: 'gap', h: 6 },
            { type: 'sigline', label: 'Seller' },
          ],
        ],
      },
      {
        id: 'tpl-disclosure',
        title: 'Seller Disclosure',
        description: 'FL property condition disclosure',
        category: 'Disclosure',
        pro: false,
        icon: 'shield-checkmark-outline',
        pages: [
          [
            { type: 'title', text: 'SELLER\'S PROPERTY CONDITION DISCLOSURE' },
            { type: 'subtitle', text: 'State of Florida — Required Disclosure' },
            { type: 'gap', h: 12 },
            { type: 'heading', text: 'Property Information' },
            { type: 'paragraph', text: 'Seller discloses the following regarding the condition of the property, per Florida law.' },
            { type: 'gap', h: 8 },
            { type: 'heading', text: 'Disclosures' },
            { type: 'list', items: [
              'Roof condition and age',
              'Plumbing, electrical, and HVAC systems',
              'Water intrusion or prior storm damage',
              'Sinkhole or foundation issues',
              'Known environmental hazards',
            ]},
            { type: 'gap', h: 12 },
            { type: 'divider' },
            { type: 'gap', h: 8 },
            { type: 'sigline', label: 'Seller — Signature & Date' },
          ],
        ],
      },
    ],
  };

  const proPack: TemplatePack = {
    id: 'pack-luxury',
    name: 'Luxury & Commercial Pro',
    description: 'High-end listings, commercial leases, and investor forms',
    pro: true,
    templates: [
      {
        id: 'tpl-listing',
        title: 'Exclusive Listing',
        description: 'FL exclusive right of sale',
        category: 'Listing',
        pro: true,
        icon: 'home-outline',
        pages: [
          [
            { type: 'title', text: 'EXCLUSIVE RIGHT OF SALE LISTING' },
            { type: 'subtitle', text: 'Florida Realtors Exclusive Listing' },
            { type: 'gap', h: 10 },
            { type: 'meta', rows: [
              ['Listing Type', 'Exclusive Right of Sale'],
              ['Term', '____ days'],
              ['List Price', '$____________'],
            ]},
            { type: 'gap', h: 12 },
            { type: 'heading', text: 'Broker Compensation' },
            { type: 'paragraph', text: 'Seller agrees to pay Broker a commission of ____% of the gross sales price.' },
            { type: 'gap', h: 12 },
            { type: 'divider' },
            { type: 'gap', h: 8 },
            { type: 'sigline', label: 'Seller' },
          ],
        ],
      },
      {
        id: 'tpl-commercial',
        title: 'Commercial Lease',
        description: 'FL commercial lease agreement',
        category: 'Lease',
        pro: true,
        icon: 'business-outline',
        pages: [
          [
            { type: 'title', text: 'COMMERCIAL LEASE AGREEMENT' },
            { type: 'subtitle', text: 'State of Florida' },
            { type: 'gap', h: 10 },
            { type: 'meta', rows: [
              ['Term', '____ months'],
              ['Base Rent', '$________ / mo'],
              ['CAM', '$________ / mo'],
            ]},
            { type: 'gap', h: 12 },
            { type: 'heading', text: 'Use of Premises' },
            { type: 'paragraph', text: 'Tenant shall use the Premises for commercial purposes only and comply with all applicable laws.' },
            { type: 'gap', h: 12 },
            { type: 'divider' },
            { type: 'gap', h: 8 },
            { type: 'sigline', label: 'Landlord' },
            { type: 'gap', h: 6 },
            { type: 'sigline', label: 'Tenant' },
          ],
        ],
      },
      {
        id: 'tpl-investor',
        title: 'Investor Analysis',
        description: 'Rental property pro forma',
        category: 'Investment',
        pro: true,
        icon: 'trending-up-outline',
        pages: [
          [
            { type: 'title', text: 'RENTAL PROPERTY PRO FORMA' },
            { type: 'subtitle', text: 'Florida Investment Analysis' },
            { type: 'gap', h: 10 },
            { type: 'meta', rows: [
              ['Property', '____________________'],
              ['Purchase Price', '$____________'],
              ['Est. Rent', '$________ / mo'],
            ]},
            { type: 'gap', h: 12 },
            { type: 'heading', text: 'Returns' },
            { type: 'table', columns: ['Metric', 'Value'], rows: [
              ['Cap Rate', '____%'],
              ['Cash-on-Cash', '____%'],
              ['COCR', '____%'],
            ]},
            { type: 'gap', h: 12 },
            { type: 'divider' },
            { type: 'gap', h: 8 },
            { type: 'sigline', label: 'Investor' },
          ],
        ],
      },
    ],
  };

  return [freePack, proPack];
}

export function buildSignatureSeed() {
  const pts: { x: number; y: number }[] = [];
  const N = 60;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = 0.08 + t * 0.84;
    const y =
      0.62 -
      Math.sin(t * Math.PI * 2.2) * 0.22 * Math.sin(t * Math.PI) -
      t * 0.12 +
      Math.sin(t * 18) * 0.02;
    pts.push({ x, y });
  }
  return pts;
}
