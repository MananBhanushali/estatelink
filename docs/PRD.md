# Product Requirements Document: EstateLink

**A property brokerage management platform — sales & rentals**

Version 1.0 — Database Management Systems course project (team of 3)  
**Phase 1 Case Study:** Real Estate Brokerage Management (Experiment 7, Div: A2)  
**Authors:** Aatman Bhansali (2025300022), Manan Bhanushali (2025300024), Siddhesh Chandanpat (2025300033)

---

## 1. Overview

### 1.1 Problem

Small and mid-sized real estate brokerages manage listings, client enquiries, and deal closures through spreadsheets, WhatsApp, and paper agreements. This causes:

- Properties shown as available after they're already sold or rented
- No visibility into enquiry volume or follow-up per broker
- Manual, error-prone commission calculation between company and broker
- Rentals not tracked to term — properties stay off-market long after a lease ends
- No way to measure broker performance

### 1.2 Solution

EstateLink is a centralized web application where a brokerage company manages:
- Property listings (for sale or rental)
- Brokers and the properties/clients they handle
- Client enquiries and their conversion into closed deals
- Automatic commission calculation (company's cut from the owner, broker's cut from the client)
- Automatic rental lifecycle tracking (a property becomes available again once a lease ends)
- Client reviews of brokers after a deal closes

### 1.3 Scope constraint

This is a course project MVP, target **under 20 hours of combined build time** across a 3-person team. Favor simple, working CRUD flows and one or two standout features (automatic commission calc, automatic rental-expiry status update) over breadth. Skip payment gateways, real-time chat, or anything requiring third-party paid APIs.

---

## 2. User roles

| Role | Description | Key capabilities |
|---|---|---|
| **Admin** (company) | Manages the overall business | View all properties, brokers, clients, deals; run the rental-expiry refresh; view company-wide and per-broker earnings dashboards |
| **Broker** | Works under the company | Lists properties; views/manages enquiries assigned to them; converts an enquiry into a deal; views their own earnings and reviews |
| **Client** | Property seeker | Browses available listings filtered by type/location/budget/tenant eligibility; submits enquiries; leaves a review after a deal closes |

For the MVP, a simple role-based login (Admin / Broker / Client) is sufficient — no need for complex permission systems.

---

## 3. Data model & relational schema

Based on the ER modeling and normalization (1NF, 2NF, 3NF, BCNF) from **Phase 1 (Experiment 7)**, the database consists of **8 core entities** mapped to **9 normalized relational tables**. All primary keys are auto-incrementing integers unless noted.

### 3.1 Brokers
| Column | Type | Constraints |
|---|---|---|
| broker_id | INT | PK, auto-increment |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(100) | NOT NULL, UNIQUE |
| phone | VARCHAR(20) | |
| join_date | DATE | DEFAULT CURRENT_DATE |

### 3.2 Clients
| Column | Type | Constraints |
|---|---|---|
| client_id | INT | PK, auto-increment |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(100) | NOT NULL, UNIQUE |
| phone | VARCHAR(20) | |
| client_type | ENUM('student','bachelor','married_couple','family') | NOT NULL |

### 3.3 Commission
*(Defines brokerage rules earned by brokers and applied to property listings)*
| Column | Type | Constraints |
|---|---|---|
| commission_id | INT | PK, auto-increment |
| owner_brokerage_percent | DECIMAL(5,2) | NOT NULL — % company collects from the owner |
| client_brokerage_percent | DECIMAL(5,2) | NOT NULL — % broker collects from the client |
| broker_id | INT | FK → Brokers.broker_id |

### 3.4 Properties
*(Represents property listings for sale or rent. Tenant type is normalized into `Property_Tenant_Type` to satisfy 1NF & 2NF)*
| Column | Type | Constraints |
|---|---|---|
| property_id | INT | PK, auto-increment |
| owner_name | VARCHAR(100) | NOT NULL |
| owner_contact | VARCHAR(20) | |
| location | VARCHAR(150) | NOT NULL (Composite in ER: area, city, pincode; stored as text) |
| square_feet | INT | |
| bedrooms | INT | Nullable — property layout filter |
| value | DECIMAL(12,2) | NOT NULL — sale price or monthly rent, in Rs |
| status | ENUM('available','sold','ongoing_rental') | DEFAULT 'available' |
| broker_id | INT | FK → Brokers.broker_id |
| commission_id | INT | FK → Commission.commission_id |

### 3.5 Property_Tenant_Type
*(Created via 1NF & 2NF decomposition to resolve multivalued attribute `eligible_tenant_type` from ER diagram)*
| Column | Type | Constraints |
|---|---|---|
| property_id | INT | FK → Properties.property_id |
| tenant_type | ENUM('student','bachelor','family') | NOT NULL |
| **Primary Key** | (property_id, tenant_type) | Composite PK |

### 3.6 Leases
| Column | Type | Constraints |
|---|---|---|
| lease_id | INT | PK, auto-increment |
| lease_type | VARCHAR(50) | e.g., 'short-term', 'long-term' |
| security_deposit | DECIMAL(12,2) | |
| duration_months | INT | Duration of the lease in months |
| property_id | INT | FK → Properties.property_id |

> Only properties listed for rental need a Leases record.

### 3.7 Enquiries
| Column | Type | Constraints |
|---|---|---|
| enquiry_id | INT | PK, auto-increment |
| client_id | INT | FK → Clients.client_id |
| property_id | INT | FK → Properties.property_id |
| broker_id | INT | FK → Brokers.broker_id |
| enquiry_date | DATE | DEFAULT CURRENT_DATE |
| status | ENUM('open','in_progress','closed','rejected') | DEFAULT 'open' |
| notes | TEXT | |

### 3.8 Deals
*(Records completed sales and ongoing/ended rentals. Converts 1:1 from an enquiry)*
| Column | Type | Constraints |
|---|---|---|
| deal_id | INT | PK, auto-increment |
| enquiry_id | INT | FK → Enquiries.enquiry_id, UNIQUE (1:1) |
| property_id | INT | FK → Properties.property_id |
| broker_id | INT | FK → Brokers.broker_id |
| client_id | INT | FK → Clients.client_id |
| deal_type | ENUM('sale','rental') | NOT NULL |
| deal_date | DATE | DEFAULT CURRENT_DATE |
| deal_value | DECIMAL(12,2) | NOT NULL — snapshot of property value at deal time |
| rental_start_date | DATE | Nullable — only for rentals |
| rental_end_date | DATE | Nullable — only for rentals |
| deal_status | ENUM('completed','ongoing','ended') | DEFAULT 'completed' for sales, 'ongoing' for active rentals |
| company_earning | DECIMAL(12,2) | *Derived attribute* per Phase 1 3NF (`deal_value × owner_brokerage_percent / 100`). Can be materialized or computed via views. |
| broker_earning | DECIMAL(12,2) | *Derived attribute* per Phase 1 3NF (`deal_value × client_brokerage_percent / 100`). Can be materialized or computed via views. |

### 3.9 Reviews
| Column | Type | Constraints |
|---|---|---|
| review_id | INT | PK, auto-increment |
| client_id | INT | FK → Clients.client_id |
| broker_id | INT | FK → Brokers.broker_id (links review to the closing broker) |
| deal_id | INT | FK → Deals.deal_id, UNIQUE (1 review per closed deal) |
| rating | INT | CHECK (rating BETWEEN 1 AND 5) |
| comments | TEXT | |
| review_date | DATE | DEFAULT CURRENT_DATE |

### 3.10 Relationships summary (ER & Relational Mapping)

| Relationship | Entities | Cardinality | Meaning in Phase 1 |
|---|---|---|---|
| `earns` | Brokers → Commission | 1 : N | A broker earns commission rules |
| `generates` | Commission → Properties | 1 : N | A commission rule applies to properties |
| `has` | Brokers → Properties | 1 : N | A broker manages many properties |
| `handles` | Brokers → Enquiries | 1 : N | A broker handles many enquiries |
| `closes` | Brokers → Deals | 1 : N | A broker closes many deals |
| `receives` | Properties → Enquiries | 1 : N | A property receives many enquiries |
| `involves` | Properties → Deals | 1 : N | A property is involved in deals |
| `has` | Properties → Leases | 1 : N | A rental property has lease terms |
| `applies_to` | Properties → Property_Tenant_Type | 1 : N | A property specifies eligible tenant types (1NF/2NF) |
| `submits` | Clients → Enquiries | 1 : N | A client submits many enquiries |
| `converts` | Enquiries → Deals | 1 : 1 | An enquiry is converted into a deal (UNIQUE FK) |
| `enters` | Clients → Deals | 1 : N | A client enters deals |
| `writes` | Clients → Reviews | 1 : N | A client writes reviews for completed deals |

---

### 3.11 Normalization analysis (Summary from Phase 1)

- **1NF**: Every column holds atomic values. The multivalued ER attribute `eligible_tenant_type` is decomposed into the separate table `Property_Tenant_Type`. Composite attribute `location` is stored as an atomic text string. Derived attributes (`broker_earning`, `company_earning`) are not independently stored as redundant columns.
- **2NF**: In 1NF and no non-key attribute depends on part of a composite key. The only composite key exists in `Property_Tenant_Type(property_id, tenant_type)` which is an all-key table.
- **3NF**: In 2NF with no transitive dependencies ($X \to Y \to Z$). Commission percentages reside only in `Commission` and are referenced by `Properties(commission_id)`. Earnings depend on `deal_value` and commission percentages, so they are derived.
- **BCNF**: Every determinant in all functional dependencies is a candidate key. All tables satisfy BCNF.

---

## 4. Core business logic

### 4.1 Enquiry → Deal conversion
When a broker converts an enquiry into a closed deal:
1. Create a row in `Deals`, linked to the source `enquiry_id`.
2. Look up `Commission` for the property (join `Properties` with `Commission` on `Properties.commission_id = Commission.commission_id`) to get `owner_brokerage_percent` and `client_brokerage_percent`.
3. Compute `company_earning = deal_value * owner_brokerage_percent / 100` and `broker_earning = deal_value * client_brokerage_percent / 100`.
4. Set `Enquiries.status = 'closed'`.
5. Update `Properties.status`:
   - If `deal_type = 'sale'` → `status = 'sold'`
   - If `deal_type = 'rental'` → `status = 'ongoing_rental'`, set `Deals.deal_status = 'ongoing'`

### 4.2 Rental expiry refresh (the "trigger" feature)
A scheduled job or an admin-triggered action runs:
```sql
UPDATE Properties
SET status = 'available'
WHERE property_id IN (
  SELECT property_id FROM Deals
  WHERE deal_status = 'ongoing' AND rental_end_date < CURRENT_DATE
);

UPDATE Deals
SET deal_status = 'ended'
WHERE deal_status = 'ongoing' AND rental_end_date < CURRENT_DATE;
```
For the MVP, implement this as a backend endpoint (e.g. `POST /admin/refresh-rentals`) the admin can trigger manually, or wire it to a simple cron/scheduled task if time allows.

### 4.3 Commission & tenant types at listing time
When a broker lists a new property:
- A `Commission` row is associated or created (`owner_brokerage_percent`, `client_brokerage_percent`, `broker_id`) and linked via `Properties.commission_id`.
- Eligible tenant types are inserted into `Property_Tenant_Type` (`property_id`, `tenant_type`) to satisfy 1NF & 2NF.
- If it's a rental, a `Leases` row is also created (`lease_type`, `duration_months`, `security_deposit`, `property_id`).

---

## 5. Features by role

### 5.1 Client-facing
- Browse available properties — filter by location, budget, bedrooms, tenant eligibility, sale/rental
- View property detail page
- Submit an enquiry on a property
- View their own enquiry history and status
- Leave a review for a broker after a deal closes

### 5.2 Broker-facing
- Dashboard: enquiries assigned to them, grouped by status
- List a new property (with commission and, if rental, lease details)
- Convert an enquiry into a deal
- View their own closed deals and total earnings
- View reviews left about them

### 5.3 Admin-facing
- Dashboard: total properties, available/sold/rented counts, total company earnings
- Broker leaderboard: deals closed and earnings per broker
- Run the rental-expiry refresh action
- View/manage all brokers, clients, properties, enquiries, deals

---

## 6. Suggested pages / routes

| Page | Route | Role |
|---|---|---|
| Property listings | `/properties` | Client, public |
| Property detail | `/properties/:id` | Client, public |
| Submit enquiry | `/properties/:id/enquire` | Client |
| My enquiries | `/my-enquiries` | Client |
| Broker dashboard | `/broker/dashboard` | Broker |
| List a property | `/broker/properties/new` | Broker |
| Convert enquiry to deal | `/broker/enquiries/:id/convert` | Broker |
| My earnings | `/broker/earnings` | Broker |
| Admin dashboard | `/admin/dashboard` | Admin |
| Broker leaderboard | `/admin/brokers` | Admin |
| Refresh rentals | `/admin/refresh-rentals` (action) | Admin |

---

## 7. Suggested API endpoints (REST)

```
# Auth
POST   /api/auth/login
POST   /api/auth/register

# Properties
GET    /api/properties?location=&type=&tenant_type=&min_budget=&max_budget=
GET    /api/properties/:id
POST   /api/properties                (broker)
PATCH  /api/properties/:id            (broker/admin)

# Commission & Leases
POST   /api/properties/:id/commission (broker, at listing time)
POST   /api/properties/:id/lease      (broker, rentals only)

# Enquiries
POST   /api/enquiries                 (client)
GET    /api/enquiries?broker_id=      (broker)
GET    /api/enquiries?client_id=      (client)
PATCH  /api/enquiries/:id             (broker — update status)

# Deals
POST   /api/enquiries/:id/convert     (broker — creates a Deal)
GET    /api/deals?broker_id=
GET    /api/deals/:id

# Reviews
POST   /api/reviews                   (client)
GET    /api/reviews?broker_id=

# Admin
GET    /api/admin/dashboard
GET    /api/admin/brokers/leaderboard
POST   /api/admin/refresh-rentals
```

---

## 8. Tech stack 

MySQL, Nextjs, JWT Auth


## 9. Suggested build order (for a 3-person team, ~20 hrs total)

1. **Hour 0–2:** Set up repo, DB schema (all 9 tables + FKs), seed data for Brokers/Clients/Properties/Property_Tenant_Type
2. **Hour 2–6:** Backend CRUD for Properties, Commission, Leases, Enquiries
3. **Hour 6–10:** Backend logic for enquiry→deal conversion (commission calc) and rental-expiry refresh
4. **Hour 10–14:** Frontend — client browsing/enquiry flow, broker dashboard
5. **Hour 14–17:** Frontend — admin dashboard, broker leaderboard, earnings views
6. **Hour 17–20:** Seed realistic demo data, test the full enquiry → deal → commission → rental-expiry flow end to end, polish

### Suggested 3-person split
- **Person A:** Database schema, all backend models/queries, commission calculation logic, rental-expiry endpoint
- **Person B:** Backend auth, enquiry/deal API routes, admin dashboard backend
- **Person C:** Frontend (client browsing + broker dashboard + admin dashboard), API integration

---

## 10. Notes for the coding agent

- Build the database schema first, exactly as specified in Section 3 — do not add, remove, or rename columns without flagging it.
- Implement Section 4.1 and 4.2 as actual working logic, not just UI — these are the features that make the DBMS concepts (joins, computed values, batch updates) visible in the demo.
- Keep the UI functional and simple — this is a database systems project, not a design project. Clear tables, forms, and dashboards are sufficient.
- Use parameterized queries / an ORM to avoid SQL injection, but don't over-engineer the backend architecture — a flat set of route handlers is fine for this scope.