-- ============================================================================
-- EstateLink - Relational Database Schema
-- Course: Database Management Systems (Phase I & II)
-- 9 Normalized Tables (1NF, 2NF, 3NF, BCNF)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS estatelink_db;
USE estatelink_db;

-- ----------------------------------------------------------------------------
-- Drop existing views, procedures, and tables in reverse dependency order
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS Broker_Leaderboard_View;
DROP VIEW IF EXISTS Deal_Earnings_View;
DROP VIEW IF EXISTS Available_Properties_View;

DROP TRIGGER IF EXISTS trg_auto_set_property_status_on_deal;
DROP PROCEDURE IF EXISTS sp_refresh_expired_rentals;

DROP TABLE IF EXISTS Reviews;
DROP TABLE IF EXISTS Deals;
DROP TABLE IF EXISTS Enquiries;
DROP TABLE IF EXISTS Leases;
DROP TABLE IF EXISTS Property_Tenant_Type;
DROP TABLE IF EXISTS Properties;
DROP TABLE IF EXISTS Commission;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Clients;
DROP TABLE IF EXISTS Brokers;

-- ============================================================================
-- 1. Brokers
-- ============================================================================
CREATE TABLE Brokers (
    broker_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    join_date DATE DEFAULT (CURRENT_DATE)
);

-- ============================================================================
-- Auth: Users (login credentials mapped to Brokers/Clients)
-- ============================================================================
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'broker', 'client') NOT NULL,
    ref_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. Clients
-- ============================================================================
CREATE TABLE Clients (
    client_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    client_type ENUM('student', 'bachelor', 'married_couple', 'family') NOT NULL
);

-- ============================================================================
-- 3. Commission
-- ============================================================================
CREATE TABLE Commission (
    commission_id INT AUTO_INCREMENT PRIMARY KEY,
    owner_brokerage_percent DECIMAL(5,2) NOT NULL,
    client_brokerage_percent DECIMAL(5,2) NOT NULL,
    broker_id INT NOT NULL,
    CONSTRAINT chk_owner_brokerage_percent CHECK (owner_brokerage_percent >= 0.00 AND owner_brokerage_percent <= 100.00),
    CONSTRAINT chk_client_brokerage_percent CHECK (client_brokerage_percent >= 0.00 AND client_brokerage_percent <= 100.00),
    CONSTRAINT fk_commission_broker FOREIGN KEY (broker_id) 
        REFERENCES Brokers(broker_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- ============================================================================
-- 4. Properties
-- ============================================================================
CREATE TABLE Properties (
    property_id INT AUTO_INCREMENT PRIMARY KEY,
    owner_name VARCHAR(100) NOT NULL,
    owner_contact VARCHAR(20),
    location VARCHAR(150) NOT NULL,
    square_feet INT,
    bedrooms INT,
    value DECIMAL(12,2) NOT NULL,
    status ENUM('available', 'sold', 'ongoing_rental') DEFAULT 'available',
    broker_id INT NOT NULL,
    commission_id INT NOT NULL,
    CONSTRAINT chk_property_value CHECK (value > 0),
    CONSTRAINT chk_property_sqft CHECK (square_feet IS NULL OR square_feet > 0),
    CONSTRAINT chk_property_bedrooms CHECK (bedrooms IS NULL OR bedrooms >= 0),
    CONSTRAINT fk_properties_broker FOREIGN KEY (broker_id) 
        REFERENCES Brokers(broker_id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_properties_commission FOREIGN KEY (commission_id) 
        REFERENCES Commission(commission_id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
);

-- ============================================================================
-- 5. Property_Tenant_Type (Multivalued decomposition for 1NF/2NF)
-- ============================================================================
CREATE TABLE Property_Tenant_Type (
    property_id INT NOT NULL,
    tenant_type ENUM('student', 'bachelor', 'family') NOT NULL,
    PRIMARY KEY (property_id, tenant_type),
    CONSTRAINT fk_tenant_type_property FOREIGN KEY (property_id) 
        REFERENCES Properties(property_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- ============================================================================
-- 6. Leases (Rental terms for rental properties)
-- ============================================================================
CREATE TABLE Leases (
    lease_id INT AUTO_INCREMENT PRIMARY KEY,
    lease_type VARCHAR(50),
    security_deposit DECIMAL(12,2),
    duration_months INT,
    property_id INT NOT NULL,
    CONSTRAINT chk_lease_duration CHECK (duration_months IS NULL OR duration_months > 0),
    CONSTRAINT chk_lease_deposit CHECK (security_deposit IS NULL OR security_deposit >= 0),
    CONSTRAINT fk_leases_property FOREIGN KEY (property_id) 
        REFERENCES Properties(property_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- ============================================================================
-- 7. Enquiries
-- ============================================================================
CREATE TABLE Enquiries (
    enquiry_id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    property_id INT NOT NULL,
    broker_id INT NOT NULL,
    enquiry_date DATE DEFAULT (CURRENT_DATE),
    status ENUM('open', 'in_progress', 'closed', 'rejected') DEFAULT 'open',
    notes TEXT,
    CONSTRAINT uq_client_property UNIQUE (client_id, property_id),
    CONSTRAINT fk_enquiries_client FOREIGN KEY (client_id) 
        REFERENCES Clients(client_id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_enquiries_property FOREIGN KEY (property_id) 
        REFERENCES Properties(property_id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_enquiries_broker FOREIGN KEY (broker_id) 
        REFERENCES Brokers(broker_id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
);

-- ============================================================================
-- 8. Deals
-- ============================================================================
CREATE TABLE Deals (
    deal_id INT AUTO_INCREMENT PRIMARY KEY,
    enquiry_id INT NOT NULL UNIQUE,
    property_id INT NOT NULL,
    broker_id INT NOT NULL,
    client_id INT NOT NULL,
    deal_type ENUM('sale', 'rental') NOT NULL,
    deal_date DATE DEFAULT (CURRENT_DATE),
    deal_value DECIMAL(12,2) NOT NULL,
    rental_start_date DATE NULL,
    rental_end_date DATE NULL,
    deal_status ENUM('completed', 'ongoing', 'ended') DEFAULT 'completed',
    company_earning DECIMAL(12,2) NULL,
    broker_earning DECIMAL(12,2) NULL,
    CONSTRAINT chk_deal_value CHECK (deal_value > 0),
    CONSTRAINT chk_deal_rental_dates CHECK (
        deal_type != 'rental' OR 
        (rental_start_date IS NOT NULL AND (rental_end_date IS NULL OR rental_end_date >= rental_start_date))
    ),
    CONSTRAINT fk_deals_enquiry FOREIGN KEY (enquiry_id) 
        REFERENCES Enquiries(enquiry_id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_deals_property FOREIGN KEY (property_id) 
        REFERENCES Properties(property_id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_deals_broker FOREIGN KEY (broker_id) 
        REFERENCES Brokers(broker_id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_deals_client FOREIGN KEY (client_id) 
        REFERENCES Clients(client_id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
);

-- ============================================================================
-- 9. Reviews
-- ============================================================================
CREATE TABLE Reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    broker_id INT NOT NULL,
    deal_id INT NOT NULL UNIQUE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    review_date DATE DEFAULT (CURRENT_DATE),
    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT fk_reviews_client FOREIGN KEY (client_id) 
        REFERENCES Clients(client_id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_reviews_broker FOREIGN KEY (broker_id) 
        REFERENCES Brokers(broker_id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_reviews_deal FOREIGN KEY (deal_id) 
        REFERENCES Deals(deal_id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
);

-- ============================================================================
-- Performance Indexes
-- ============================================================================
CREATE INDEX idx_properties_status ON Properties(status);
CREATE INDEX idx_properties_location ON Properties(location);
CREATE INDEX idx_properties_value ON Properties(value);
CREATE INDEX idx_properties_broker ON Properties(broker_id);
CREATE INDEX idx_enquiries_status ON Enquiries(status);
CREATE INDEX idx_enquiries_broker ON Enquiries(broker_id);
CREATE INDEX idx_enquiries_client ON Enquiries(client_id);
CREATE INDEX idx_deals_status ON Deals(deal_status);
CREATE INDEX idx_deals_broker ON Deals(broker_id);
CREATE INDEX idx_deals_dates ON Deals(deal_status, rental_end_date);
CREATE INDEX idx_reviews_broker ON Reviews(broker_id);

-- ============================================================================
-- Views
-- ============================================================================

-- 1. Deal Earnings View (Dynamic commission calculation per 3NF derivation)
CREATE OR REPLACE VIEW Deal_Earnings_View AS
SELECT 
    d.deal_id,
    d.enquiry_id,
    d.deal_type,
    d.deal_status,
    d.deal_date,
    d.deal_value,
    d.rental_start_date,
    d.rental_end_date,
    b.broker_id,
    b.name AS broker_name,
    c.client_id,
    c.name AS client_name,
    p.property_id,
    p.location AS property_location,
    comm.owner_brokerage_percent,
    comm.client_brokerage_percent,
    ROUND((d.deal_value * comm.owner_brokerage_percent / 100), 2) AS calculated_company_earning,
    ROUND((d.deal_value * comm.client_brokerage_percent / 100), 2) AS calculated_broker_earning,
    d.company_earning AS materialized_company_earning,
    d.broker_earning AS materialized_broker_earning
FROM Deals d
-- [JOIN]: Inner join Properties — Links each deal to its transacted property to access location and associated commission ID
JOIN Properties p ON d.property_id = p.property_id
-- [JOIN]: Inner join Commission — Retrieves owner and client brokerage percentage cuts configured for the property to calculate earnings dynamically
JOIN Commission comm ON p.commission_id = comm.commission_id
-- [JOIN]: Inner join Brokers — Denormalizes broker details (id, name) responsible for closing the deal
JOIN Brokers b ON d.broker_id = b.broker_id
-- [JOIN]: Inner join Clients — Denormalizes client details (id, name) of the customer who completed the transaction
JOIN Clients c ON d.client_id = c.client_id;

-- 2. Broker Leaderboard View
CREATE OR REPLACE VIEW Broker_Leaderboard_View AS
SELECT 
    b.broker_id,
    b.name AS broker_name,
    b.email AS broker_email,
    b.phone AS broker_phone,
    b.join_date,
    -- [AGGREGATE FUNCTION]: COUNT(DISTINCT) — Calculates total unique deals closed by each broker, avoiding inflated counts caused by multiple joined reviews
    COUNT(DISTINCT d.deal_id) AS total_deals_closed,
    -- [AGGREGATE FUNCTION]: Conditional SUM — Tallies only closed property sales (deal_type = 'sale'), defaulting to 0 via COALESCE if none exist
    COALESCE(SUM(CASE WHEN d.deal_type = 'sale' THEN 1 ELSE 0 END), 0) AS sales_closed,
    -- [AGGREGATE FUNCTION]: Conditional SUM — Tallies only closed rental leases (deal_type = 'rental'), defaulting to 0 via COALESCE if none exist
    COALESCE(SUM(CASE WHEN d.deal_type = 'rental' THEN 1 ELSE 0 END), 0) AS rentals_closed,
    -- [AGGREGATE FUNCTION]: SUM — Computes the gross monetary volume of all transactions closed by the broker (defaults to 0 if no deals)
    COALESCE(SUM(d.deal_value), 0) AS total_deal_volume,
    -- [AGGREGATE FUNCTION]: SUM — Computes cumulative commission earnings accrued by the broker across closed deals
    COALESCE(SUM(d.broker_earning), 0) AS total_broker_earnings,
    -- [AGGREGATE FUNCTION]: SUM — Computes total brokerage revenue contributed to the company by the broker
    COALESCE(SUM(d.company_earning), 0) AS total_company_contribution,
    -- [AGGREGATE FUNCTION]: AVG — Computes average client rating score (1-5 scale) across all reviews received by the broker
    ROUND(AVG(r.rating), 2) AS average_rating,
    -- [AGGREGATE FUNCTION]: COUNT(DISTINCT) — Counts total unique client reviews received by each broker without Cartesian product inflation
    COUNT(DISTINCT r.review_id) AS total_reviews
FROM Brokers b
-- [JOIN]: LEFT JOIN Deals — Preserves all registered brokers in leaderboard rankings even if they have not yet closed any deals (returns 0 instead of omitting them)
LEFT JOIN Deals d ON b.broker_id = d.broker_id
-- [JOIN]: LEFT JOIN Reviews — Preserves brokers who have not yet received client ratings/reviews, preventing exclusion from the leaderboard
LEFT JOIN Reviews r ON b.broker_id = r.broker_id
GROUP BY b.broker_id, b.name, b.email, b.phone, b.join_date;

-- 3. Available Properties View
CREATE OR REPLACE VIEW Available_Properties_View AS
SELECT 
    p.property_id,
    p.owner_name,
    p.owner_contact,
    p.location,
    p.square_feet,
    p.bedrooms,
    p.value,
    p.status,
    p.broker_id,
    b.name AS broker_name,
    b.email AS broker_email,
    b.phone AS broker_phone,
    p.commission_id,
    comm.owner_brokerage_percent,
    comm.client_brokerage_percent,
    l.lease_id,
    l.lease_type,
    l.security_deposit,
    l.duration_months,
    -- [AGGREGATE FUNCTION]: GROUP_CONCAT — Combines normalized 1NF/2NF tenant criteria rows into a single comma-separated list per property
    GROUP_CONCAT(DISTINCT ptt.tenant_type ORDER BY ptt.tenant_type SEPARATOR ', ') AS eligible_tenant_types
FROM Properties p
-- [JOIN]: INNER JOIN Brokers — Links property listing to its assigned broker to display agent name and contact information
JOIN Brokers b ON p.broker_id = b.broker_id
-- [JOIN]: INNER JOIN Commission — Links property listing to its commission tier to expose owner and client brokerage percentage cuts
JOIN Commission comm ON p.commission_id = comm.commission_id
-- [JOIN]: LEFT JOIN Leases — Includes rental lease terms (deposit, duration) if applicable; uses LEFT JOIN so properties for sale (without leases) are not omitted
LEFT JOIN Leases l ON p.property_id = l.property_id
-- [JOIN]: LEFT JOIN Property_Tenant_Type — Includes allowed tenant types; uses LEFT JOIN so properties without specific tenant restrictions are not omitted
LEFT JOIN Property_Tenant_Type ptt ON p.property_id = ptt.property_id
GROUP BY p.property_id, p.owner_name, p.owner_contact, p.location, p.square_feet, p.bedrooms, 
         p.value, p.status, p.broker_id, b.name, b.email, b.phone, p.commission_id, 
         comm.owner_brokerage_percent, comm.client_brokerage_percent, 
         l.lease_id, l.lease_type, l.security_deposit, l.duration_months;

-- ============================================================================
-- Stored Procedure: Proactive Rental Expiry Refresh Engine
-- ============================================================================
DELIMITER //

CREATE PROCEDURE sp_refresh_expired_rentals()
BEGIN
    -- Reactivate properties whose lease tenure has completed
    UPDATE Properties
    SET status = 'available'
    -- [SUBQUERY]: Uncorrelated subquery dynamically selects property IDs from Deals that are currently 'ongoing' but have passed their rental_end_date.
    -- Used here to filter Properties without joining tables directly in the UPDATE statement, ensuring a decoupled and safe bulk status transition.
    WHERE property_id IN (
        SELECT property_id FROM Deals
        WHERE deal_status = 'ongoing' AND rental_end_date < CURRENT_DATE
    );

    -- Finalize concluded deals
    UPDATE Deals
    SET deal_status = 'ended'
    WHERE deal_status = 'ongoing' AND rental_end_date < CURRENT_DATE;
END //

DELIMITER ;

-- ============================================================================
-- Trigger: Auto-Sync Property Status on Deal Insert
-- ============================================================================
-- PURPOSE:
--   Whenever a new row is inserted into the Deals table, this AFTER INSERT
--   trigger automatically updates the corresponding property's status:
--     • deal_type = 'sale'   → Properties.status = 'sold'
--     • deal_type = 'rental' → Properties.status = 'ongoing_rental'
--
-- WHY AFTER INSERT (not BEFORE INSERT):
--   The trigger fires AFTER the Deals row is successfully committed, so the
--   property update is guaranteed to happen only when the deal actually exists.
--   Using BEFORE INSERT would risk updating the property even if the deal
--   INSERT later failed a constraint check.
--
-- WHY THIS IS BETTER THAN APPLICATION-LAYER UPDATES:
--   Without this trigger the API route had to run separate UPDATE queries
--   (plus "heal" queries for legacy records) every time deals were fetched.
--   The trigger enforces consistency at the database level — regardless of
--   which application, script, or direct SQL session inserts the deal row.
-- ============================================================================
DELIMITER //

CREATE TRIGGER trg_auto_set_property_status_on_deal
AFTER INSERT ON Deals
FOR EACH ROW
BEGIN
    -- [TRIGGER BODY]: Branch on the deal type of the newly inserted row.
    -- NEW.deal_type — refers to the value in the row just inserted.
    -- NEW.property_id — the property that must be updated.
    IF NEW.deal_type = 'sale' THEN
        -- Mark property as permanently sold.
        UPDATE Properties
        SET status = 'sold'
        WHERE property_id = NEW.property_id;
    ELSEIF NEW.deal_type = 'rental' THEN
        -- Mark property as occupied under an active rental.
        UPDATE Properties
        SET status = 'ongoing_rental'
        WHERE property_id = NEW.property_id;
    END IF;
END //

DELIMITER ;
