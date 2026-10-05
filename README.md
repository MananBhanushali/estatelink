# EstateLink 🏢

**Modern Real Estate Brokerage Management Platform — Sales & Rentals**

[![DBMS Project](https://img.shields.io/badge/Course-DBMS%20Phase%20I%20%26%20II-blue.svg)](#academic-project--team)
[![Database](https://img.shields.io/badge/Database-MySQL-00758F.svg)](#database-design--normalization)
[![Framework](https://img.shields.io/badge/Frontend-Next.js-black.svg)](#technology-stack)
[![Normalization](https://img.shields.io/badge/Schema-BCNF%20Normalized-success.svg)](#normalization-guarantees)
[![Auth](https://img.shields.io/badge/Auth-JWT%20RBAC-orange.svg)](#user-roles--capabilities)

---

## 📖 Table of Contents

- [Overview & Problem Statement](#-overview--problem-statement)
- [Key Features & Business Logic](#-key-features--business-logic)
- [User Roles & Capabilities](#-user-roles--capabilities)
- [Database Design & Normalization](#-database-design--normalization)
  - [Relational Schema (9 Tables)](#relational-schema-9-tables)
  - [Normalization Guarantees](#normalization-guarantees)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [API Overview](#-api-overview)
- [Academic Project & Team](#-academic-project--team)
- [Documentation Links](#-documentation-links)

---

## 🌟 Overview & Problem Statement

Small to mid-sized real estate brokerages frequently manage property listings, customer enquiries, broker allocations, and rental tenures across disparate spreadsheets, chat logs, and manual paperwork. This fragmentation leads to:

- **Ghost & Stale Listings**: Sold or rented properties remain advertised long after transactions conclude.
- **Unmanaged Rental Lifecycles**: Leases expire without notification, leaving properties unmarketed and owners losing revenue.
- **Disputed Brokerage Splits**: Manual commission calculations cause friction between brokerage firms and individual agents.
- **Lost Enquiries**: Lack of central pipeline visibility makes lead tracking and agent performance measurement impossible.

**EstateLink** is a centralized, role-based database management platform designed to unify brokerage operations. It bridges clients, brokers, and brokerage administrators through automated commission tracking, real-time listing availability, and proactive lease lifecycle management.

---

## ⚡ Key Features & Business Logic

### 1. Automated Commission Engine
- Brokerage commission rules (`COMMISSION`) are defined per broker and associated directly with property listings.
- When an enquiry converts into a closed deal (`DEALS`), the system dynamically calculates:
  - **Company Earnings**: `deal_value × owner_brokerage_percent / 100` (collected from property owner)
  - **Broker Earnings**: `deal_value × client_brokerage_percent / 100` (collected from client)
- Eliminates manual calculation errors and provides verifiable auditability.

### 2. Proactive Rental Lifecycle & Expiry Refresh
- Properties under active leases transition automatically to `ongoing_rental` with an associated `rental_end_date`.
- The system includes a batch refresh engine that scans active rentals:
  ```sql
  -- Reactivate properties whose lease tenure has completed
  UPDATE Properties
  SET status = 'available'
  WHERE property_id IN (
    SELECT property_id FROM Deals
    WHERE deal_status = 'ongoing' AND rental_end_date < CURRENT_DATE
  );

  -- Finalize concluded deals
  UPDATE Deals
  SET deal_status = 'ended'
  WHERE deal_status = 'ongoing' AND rental_end_date < CURRENT_DATE;
  ```
- Ensures vacant properties instantly return to the public marketplace without manual broker intervention.

### 3. Normalized Multivalued Tenant Suitability Matching
- Properties accommodate diverse tenant demographics (e.g., students, bachelors, families).
- Normalized via a dedicated relation (`Property_Tenant_Type`) to eliminate update anomalies and enable exact multi-criteria filtering.

### 4. Verified Deal Reviews
- Clients can post ratings (1–5 stars) and feedback only after completing a verified deal (`DEALS`), establishing an authentic, transparent broker leaderboard.

---

## 👥 User Roles & Capabilities

| Role | Target Persona | Primary Responsibilities & UI Features |
|---|---|---|
| **Admin** | Brokerage Firm Owner / Management | • Complete visibility into all properties, brokers, clients, and deals.<br>• Company-wide gross revenue and broker earnings analytics.<br>• Broker performance leaderboard (closed deals, commission generated, rating).<br>• Trigger batch rental expiry maintenance routines. |
| **Broker** | Licensed Real Estate Agent | • List properties with customized commission splits and lease terms.<br>• Pipeline management: track and update assigned client enquiries.<br>• Enquiry-to-deal conversion workflow.<br>• Personal revenue dashboard and client reviews. |
| **Client** | Buyer or Prospective Tenant | • Public property discovery filtered by budget, location, square footage, and tenant eligibility.<br>• One-click enquiry submission with broker assignment.<br>• Personal enquiry status tracker.<br>• Rate and review brokers upon deal completion. |

---

## 🗄️ Database Design & Normalization

The data layer is built on the rigorous academic design formulated in **Phase 1 (Experiment 7)**. Starting from 8 conceptual ER entities, the relational model is decomposed into **9 normalized tables** satisfying **Boyce-Codd Normal Form (BCNF)**.

### Relational Schema (9 Tables)

1. **`Brokers`**: `(broker_id PK, name, email UNIQUE, phone, join_date)`
2. **`Clients`**: `(client_id PK, name, email UNIQUE, phone, client_type)`
3. **`Commission`**: `(commission_id PK, owner_brokerage_percent, client_brokerage_percent, broker_id FK -> Brokers)`
4. **`Properties`**: `(property_id PK, square_feet, bedrooms, owner_name, owner_contact, location, status, value, broker_id FK -> Brokers, commission_id FK -> Commission)`
5. **`Property_Tenant_Type`**: `(property_id FK -> Properties, tenant_type)` — **Composite PK: `(property_id, tenant_type)`**
6. **`Leases`**: `(lease_id PK, lease_type, security_deposit, duration_months, property_id FK -> Properties)`
7. **`Enquiries`**: `(enquiry_id PK, enquiry_date, status, notes, client_id FK -> Clients, property_id FK -> Properties, broker_id FK -> Brokers)`
8. **`Deals`**: `(deal_id PK, deal_type, deal_date, deal_value, deal_status, rental_start_date, rental_end_date, client_id FK -> Clients, property_id FK -> Properties, broker_id FK -> Brokers, enquiry_id FK -> Enquiries UNIQUE)`
9. **`Reviews`**: `(review_id PK, rating, comments, review_date, client_id FK -> Clients, broker_id FK -> Brokers, deal_id FK -> Deals UNIQUE)`

### Normalization Guarantees

- **First Normal Form (1NF)**: All column values are atomic. The multivalued attribute `eligible_tenant_type` from the ER design is decomposed into `Property_Tenant_Type`. Composite address attributes (`location`) are unified, and calculated attributes are not stored as standalone redundant columns.
- **Second Normal Form (2NF)**: Eliminates partial key dependencies. The only composite primary key exists in `Property_Tenant_Type(property_id, tenant_type)`, which is an all-key table with no dependent non-key columns.
- **Third Normal Form (3NF)**: Eliminates transitive functional dependencies ($X \to Y \to Z$). Commission percentage slabs are isolated in `Commission` rather than duplicated across individual properties. Deal earnings depend on `deal_value` and commission percentages, remaining derived attributes.
- **Boyce-Codd Normal Form (BCNF)**: For every functional dependency $X \to Y$, determinant $X$ is a candidate key, eliminating data redundancies across inserts, updates, and deletions.

## 💻 Technology Stack

- **Frontend**: [Next.js](https://nextjs.org/) (React, App Router, Server/Client Components)
- **Styling**: Vanilla CSS Design Tokens (Responsive layout, polished dark/light mode, micro-animations)
- **Backend & APIs**: Next.js API Routes (RESTful JSON architecture)
- **Database**: [MySQL 8.0+](https://www.mysql.com/) with relational integrity, foreign key constraints, and transactional deal conversions
- **Authentication**: Stateless JSON Web Tokens (JWT) with role-based claim verification (`Admin`, `Broker`, `Client`)

---

## 📂 Project Structure

```text
estatelink/
├── docs/
│   ├── phase1.pdf        # Academic Phase 1 submission (ER design, normalization proofs)
│   └── PRD.md            # Detailed product requirements, schema specs & API endpoints
├── src/                  # Next.js Application Source (Pages, Components, API Handlers)
│   ├── app/              # App router pages (client, broker, and admin portals)
│   ├── components/       # Reusable UI components (tables, listing cards, metric pills)
│   └── lib/              # Database connection pool (MySQL) and authentication helpers
├── schema/               # Database DDL scripts and test seed fixtures
├── public/               # Static assets & icons
├── README.md             # Project documentation & setup guide (this file)
└── package.json          # Project dependencies & npm scripts
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or newer)
- [MySQL Server](https://dev.mysql.com/downloads/) (v8.0 or newer)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/MananBhanushali/estatelink.git
cd estatelink
```

### 2. Configure Environment Variables
Create a `.env.local` file in the project root:
```env
# Database Credentials
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=estatelink_db
DB_PORT=3306

# Authentication
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Initialize MySQL Database
Execute the database schema creation and seed files:
```bash
mysql -u root -p < schema/schema.sql
mysql -u root -p < schema/seed.sql
```

### 4. Install Dependencies & Run
```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📡 API Overview

| Route | Method | Access | Description |
|---|---|---|---|
| `/api/auth/login` | `POST` | Public | Authenticates user and issues role-based JWT |
| `/api/properties` | `GET` | Public | Query listings with filter parameters (`location`, `budget`, `tenant_type`) |
| `/api/properties` | `POST` | Broker | Creates a new property listing with commission rules |
| `/api/enquiries` | `POST` | Client | Submits a property enquiry |
| `/api/enquiries` | `GET` | Broker/Client | Fetches enquiries scoped by broker or client ID |
| `/api/enquiries/:id/convert` | `POST` | Broker | Atomically converts enquiry to a closed deal and computes commission |
| `/api/admin/refresh-rentals` | `POST` | Admin | Executes batch rental expiration update |
| `/api/admin/dashboard` | `GET` | Admin | Retrieves company totals, deal counts, and gross revenue |
| `/api/reviews` | `POST` | Client | Submits a verified review for a completed deal |

---

## 🎓 Academic Project & Team

This project was conceived and developed as part of the **Database Management Systems (DBMS)** curriculum under **Experiment 7 (Phase I & II)**:

- **Case Study**: EstateLink — Real Estate Brokerage Management
- **Division**: A2
- **Project Members**:
  - **Aatman Bhansali** (UID: `2025300022`)
  - **Manan Bhanushali** (UID: `2025300024`)
  - **Siddhesh Chandanpat** (UID: `2025300033`)

---

## 🔗 Documentation Links

- Detailed Engineering & Product Specification: [docs/PRD.md](file:///Users/manan/Projects/estatelink/docs/PRD.md)
- Phase 1 Requirement Analysis & ER Design Report: [docs/phase1.pdf](file:///Users/manan/Projects/estatelink/docs/phase1.pdf)
