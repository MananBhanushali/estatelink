# EstateLink — Demo Script

A step-by-step showcase of all EstateLink features, designed for a ~15-minute live demo.

---

## 0. Pre-Demo Setup

### 0.1 Verify Environment

```sh
# 1. Dev server running
npm run dev  # http://localhost:3000

# 2. MySQL running with schema + seed
MYSQL_PWD='<your-password>' mysql -u root -e "USE estatelink_db; SHOW TABLES;"
# Expect: 12 tables (Brokers, Clients, Commission, Properties, Property_Tenant_Type, Leases, Enquiries, Deals, Reviews, Users + views/procedure)

# 3. Seed data is loaded
MYSQL_PWD='<your-password>' mysql -u root -e "USE estatelink_db; SELECT COUNT(*) AS brokers FROM Brokers; SELECT COUNT(*) AS props FROM Properties; SELECT COUNT(*) AS deals FROM Deals;"
# Expect: 4 brokers, 10 properties, 4 deals
```

### 0.2 Demo Credentials (all passwords: `password123`)

| Role | Email | Purpose |
|------|-------|---------|
| Admin | `admin@estatelink.com` | Company-wide dashboard, leaderboard, refresh rentals |
| Broker | `rajesh.sharma@estatelink.com` | List properties, manage enquiries, convert deals, view earnings |
| Client | `rohan.mehta@gmail.com` | Browse, enquire, leave reviews |

---

## 1. Landing Page (`/`) — 2 minutes

**Goal:** Show the public face of EstateLink.

| Step | Action | What to Say / Show |
|------|--------|--------------------|
| 1.1 | Open `http://localhost:3000/` | "This is EstateLink — brokerage, simplified." |
| 1.2 | Scroll down | Point out **Hero** with gradient background and floating animation |
| 1.3 | Scroll to **Stats Bar** | "500+ Properties · 50+ Brokers · ₹100Cr+ Deals Closed" — count-up animation |
| 1.4 | Scroll to **Features** | Six cards: Smart Filtering, Automated Commission, Rental Lifecycle, Verified Reviews, Broker Leaderboard, Lease Management |
| 1.5 | Scroll to **How It Works** | Three steps: Browse → Enquire → Close Deal |
| 1.6 | Scroll to **Role Showcase** | Client / Broker / Admin cards — "Each role gets a dedicated portal" |
| 1.7 | Scroll to **Testimonials** | Verified client reviews with star ratings |
| 1.8 | Scroll to **CTA Footer** | "Ready to modernize your brokerage?" |
| 1.9 | Toggle theme (top-right) | Dark ↔ Light mode |
| 1.10 | Click "Get Started" | Goes to `/register` |

**Demo tip:** Open dev tools → Lighthouse → run on `/` to show performance score.

---

## 2. Authentication & Dashboard Shell — 2 minutes

**Goal:** Show role-based login and the app shell.

| Step | Action | What to Say / Show |
|------|--------|--------------------|
| 2.1 | Go to `/login` | Clean login form with gradient backdrop |
| 2.2 | Log in as **Broker** (`rajesh.sharma@estatelink.com` / `password123`) | Redirects to `/broker/dashboard` |
| 2.3 | Show sidebar | "Role-specific navigation — broker sees Dashboard, Enquiries, My Properties, List Property, Earnings, Reviews" |
| 2.4 | Click header avatar → dropdown | Shows name, email, role, "Browse properties", "Sign out" |
| 2.5 | Toggle theme | Dark mode by default, switchable |
| 2.6 | Sign out | Back to `/login` |

**Demo tip:** Try logging in as admin and client to show different sidebar links per role.

---

## 3. Client Portal — 3 minutes

**Goal:** Show the property seeker experience.

### 3.1 Browse Properties
| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Log in as **Client** (`rohan.mehta@gmail.com`) | Lands on `/properties` |
| 3.2 | Filter: `status=available`, `tenant_type=bachelor`, `bedrooms=2` | Results filter instantly |
| 3.3 | Click a property card | Opens `/properties/[id]` detail |

### 3.2 Property Detail & Enquiry
| Step | Action | Expected |
|------|--------|----------|
| 3.4 | View full property detail | Price, broker info, lease terms (if rental), tenant eligibility badges |
| 3.5 | Click "Submit Enquiry" | Dialog opens with notes textarea |
| 3.6 | Type notes, submit | Toast: "Enquiry submitted successfully" |
| 3.7 | Verify: enquiry auto-assigned to property's broker | Backend assigns `broker_id` from property |

### 3.3 My Enquiries
| Step | Action | Expected |
|------|--------|----------|
| 3.8 | Navigate to `/client/enquiries` | Table shows submitted enquiry with status badge (open = yellow) |
| 3.9 | Click property link | Returns to property detail |

### 3.4 Leave Review (after deal closes)
| Step | Action | Expected |
|------|--------|----------|
| 3.10 | Log in as client who owns a completed deal (`dr.suresh@medicare.org`) | Visit `/client/reviews/new?deal_id=1` |
| 3.11 | Select 5 stars, add comment, submit | Toast: "Review submitted successfully" |
| 3.12 | Try duplicate review | Error: "A review already exists for this deal" |

---

## 4. Broker Portal — 4 minutes

**Goal:** Show the broker's daily workflow.

### 4.1 Dashboard
| Step | Action | Expected |
|------|--------|----------|
| 4.1 | Log in as **Broker** (`rajesh.sharma@estatelink.com`) | Stats: total enquiries, open, in progress, total earnings |
| 4.2 | Recent enquiries list | Shows assigned enquiries with client name, property, status |

### 4.2 Enquiry Management
| Step | Action | Expected |
|------|--------|----------|
| 4.3 | Go to `/broker/enquiries` | Tabbed view: All / Open / In Progress / Closed / Rejected |
| 4.4 | Click "Open" tab | Only open enquiries shown |
| 4.5 | Click "Convert" on an open enquiry | Goes to convert page |

### 4.3 Convert Enquiry → Deal (Core Feature)
| Step | Action | Expected |
|------|--------|----------|
| 4.6 | On convert page, see enquiry summary | Client name, property, status, enquiry date |
| 4.7 | Select deal type: **sale** or **rental** | Rental shows start/end date fields |
| 4.8 | Enter deal value | Commission preview updates |
| 4.9 | Submit | Toast: "Enquiry converted to deal! Commission: ₹X (company) / ₹Y (broker)" |
| 4.10 | Verify DB state | Enquiry status = `closed`, Property status = `sold`/`ongoing_rental`, Deal row created with `company_earning` & `broker_earning` |

**Demo tip:** Show the SQL query to verify earnings match `deal_value × percent / 100`.

### 4.4 List New Property
| Step | Action | Expected |
|------|--------|----------|
| 4.11 | Go to `/broker/properties/new` | Multi-step form: Property Details → Commission & Tenants → Lease Terms (rental only) |
| 4.12 | Fill all fields, toggle "rental" | Step 3 appears with lease type, deposit, duration |
| 4.13 | Select tenant types (multi-select) | Chips toggle |
| 4.14 | Submit | Toast: "Property listed successfully!" |
| 4.15 | Verify in `/broker/properties` | New property appears in broker's table |

### 4.5 My Properties
| Step | Action | Expected |
|------|--------|----------|
| 4.16 | Visit `/broker/properties` | Only THIS broker's properties shown |

### 4.6 My Earnings
| Step | Action | Expected |
|------|--------|----------|
| 4.17 | Visit `/broker/earnings` | Total earnings card, company earnings, completed/ongoing deals table with per-deal earnings |

### 4.7 My Reviews
| Step | Action | Expected |
|------|--------|----------|
| 4.18 | Visit `/broker/reviews` | Average star rating + reviews table with client name, property, rating, comments |

---

## 5. Admin Portal — 3 minutes

**Goal:** Show company-wide oversight.

### 5.1 Admin Dashboard
| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Log in as **Admin** (`admin@estatelink.com`) | Stat cards: properties by status, deals by type/status, company earnings, broker earnings |
| 5.2 | Recent deals table | Last 5 deals with broker/client/property |
| 5.3 | Platform overview | Broker/client/enquiry counts, open enquiries |

### 5.2 Broker Leaderboard
| Step | Action | Expected |
|------|--------|----------|
| 5.4 | Go to `/admin/brokers` | Table from `Broker_Leaderboard_View`: rank, name, deals closed, sales, rentals, volume, earnings, average rating |
| 5.5 | Search brokers | Filter by name |

### 5.3 Manage All Data
| Step | Action | Expected |
|------|--------|----------|
| 5.6 | `/admin/clients` | All clients table |
| 5.7 | `/admin/properties` | All properties with status chips |
| 5.8 | `/admin/enquiries` | All enquiries across brokers with status filter |
| 5.9 | `/admin/deals` | All deals with earnings columns |

### 5.4 Refresh Expired Rentals (Proactive Feature)
| Step | Action | Expected |
|------|--------|----------|
| 5.10 | On dashboard, click "Refresh Expired Rentals" | Confirmation dialog |
| 5.11 | Confirm | Toast: "1 expired rental(s) refreshed" |
| 5.12 | Verify DB | Deal 3 status = `ended`, Property 5 status = `available` |

**Demo tip:** Before the demo, ensure deal 3 has a past `rental_end_date` so the refresh has something to do.

---

## 6. End-to-End Golden Flow (3 minutes)

**Goal:** Demonstrate the complete business lifecycle in one flow.

| # | Role | Action | System Response |
|---|------|--------|-----------------|
| 1 | Client | Register as new client on `/register` | Account created, JWT cookie set |
| 2 | Client | Browse `/properties`, filter to available rentals | Listings render with filters |
| 3 | Client | Click property → "Submit Enquiry" | Enquiry stored, broker auto-assigned |
| 4 | Broker | Login, `/broker/enquiries`, see new enquiry | Enquiry appears in "Open" tab |
| 5 | Broker | Click "Convert", set deal type=rental, value, dates | Commission calculated, deal created, enquiry → closed, property → `ongoing_rental` |
| 6 | Client | Visit `/client/enquiries`, see status changed to `closed` | Status badge updates |
| 7 | Client | Visit `/client/reviews/new?deal_id=<new-deal>`, submit 4★ review | Review stored |
| 8 | Admin | `/admin/dashboard` | New deal reflected in stats and earnings |
| 9 | Admin | `/admin/brokers` → leaderboard | Converting broker moves up the ranking |

**Demo tip:** Pre-create one property and one enquiry so the demo starts mid-flow if time is tight.

---

## 7. Demo Troubleshooting

| Issue | Fix |
|-------|-----|
| Login fails (401) | Verify `.env` has `JWT_SECRET` and DB seed ran with correct bcrypt hash |
| Page shows empty table | Verify dev server is running and DB connection pool is active |
| Convert gives 400 | Enquiry already converted or property not `available` |
| Theme toggle not working | Hard refresh the page (Next.js hydration) |
| Build fails | Run `npx tsc --noEmit` and `npx eslint src/` first |

---

## 8. Quick Commands Reference

```sh
# Start dev server
npm run dev

# Type check
npx tsc --noEmit

# Lint
npx eslint src/

# Production build
npm run build

# MySQL seed (fresh)
MYSQL_PWD='<pw>' mysql -u root < schema/schema.sql
MYSQL_PWD='<pw>' mysql -u root < schema/seed.sql

# Refresh expired rentals (via API)
curl -X POST http://localhost:3000/api/admin/refresh-rentals \
  -H "Cookie: token=<admin_jwt>"
```

---

## 9. Key Talking Points

- **"Single source of truth"** — One DB for listings, enquiries, deals, commissions, reviews.
- **"Automatic commission"** — `company_earning = deal_value × owner_pct / 100`, `broker_earning = deal_value × client_pct / 100`, computed transactionally on enquiry→deal conversion.
- **"Proactive rental lifecycle"** — Admin-triggered `sp_refresh_expired_rentals()` flips expired leases back to `available`.
- **"Role-based everything"** — Client sees only their enquiries; Broker sees only their properties/deals; Admin sees everything.
- **"BCNF-normalized"** — 9 tables, no redundancy, tenant types decomposed into `Property_Tenant_Type` for 1NF/2NF compliance.

---

**Demo duration:** ~15 minutes  
**Presenters:** 1 person can cover all phases; 2 people can split (one narrates, one drives)