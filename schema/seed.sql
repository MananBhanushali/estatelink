-- ============================================================================
-- EstateLink - Seed Fixtures (Phase I & II)
-- Course: Database Management Systems (Experiment 7, Div: A2)
-- Realistic test fixtures covering all 9 tables, roles, and lifecycle transitions
-- ============================================================================

USE estatelink_db;

-- Disable foreign key checks for clean fixture insertion
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE Reviews;
TRUNCATE TABLE Deals;
TRUNCATE TABLE Enquiries;
TRUNCATE TABLE Leases;
TRUNCATE TABLE Property_Tenant_Type;
TRUNCATE TABLE Properties;
TRUNCATE TABLE Commission;
TRUNCATE TABLE Clients;
TRUNCATE TABLE Brokers;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 1. Seed: Brokers
-- ============================================================================
INSERT INTO Brokers (broker_id, name, email, phone, join_date) VALUES
(1, 'Rajesh Sharma', 'rajesh.sharma@estatelink.com', '+91 98201 12345', '2023-01-15'),
(2, 'Priya Patel', 'priya.patel@estatelink.com', '+91 98202 23456', '2023-03-20'),
(3, 'Amit Verma', 'amit.verma@estatelink.com', '+91 98203 34567', '2023-06-10'),
(4, 'Sneha Iyer', 'sneha.iyer@estatelink.com', '+91 98204 45678', '2023-09-01');

-- ============================================================================
-- 2. Seed: Clients (Covering all ENUM client_types)
-- ============================================================================
INSERT INTO Clients (client_id, name, email, phone, client_type) VALUES
(1, 'Rohan Mehta', 'rohan.mehta@gmail.com', '+91 91234 56780', 'student'),
(2, 'Vikram Malhotra', 'vikram.m@techcorp.in', '+91 92345 67891', 'bachelor'),
(3, 'Arjun & Riya Rao', 'arjun.rao@finworld.com', '+91 93456 78902', 'married_couple'),
(4, 'Dr. Suresh Nair', 'dr.suresh@medicare.org', '+91 94567 89013', 'family'),
(5, 'Ananya Sen', 'ananya.sen@designstudio.io', '+91 95678 90124', 'bachelor'),
(6, 'Sunita Gupta', 'sunita.gupta@outlook.com', '+91 96789 01235', 'family');

-- ============================================================================
-- 3. Seed: Commission Rules (Associated per Broker)
-- ============================================================================
INSERT INTO Commission (commission_id, owner_brokerage_percent, client_brokerage_percent, broker_id) VALUES
(1, 2.00, 2.00, 1), -- Broker 1: Standard Sale (2% Owner, 2% Client)
(2, 1.00, 1.00, 1), -- Broker 1: Rental Split (1% Owner, 1% Client)
(3, 2.50, 2.00, 2), -- Broker 2: Luxury Sale (2.5% Owner, 2% Client)
(4, 1.50, 1.50, 2), -- Broker 2: Rental Split (1.5% Owner, 1.5% Client)
(5, 2.00, 1.50, 3), -- Broker 3: Standard Sale (2% Owner, 1.5% Client)
(6, 1.00, 1.00, 3), -- Broker 3: Rental Split (1% Owner, 1% Client)
(7, 2.00, 2.00, 4), -- Broker 4: Sale Split (2% Owner, 2% Client)
(8, 1.25, 1.25, 4); -- Broker 4: Rental Split (1.25% Owner, 1.25% Client)

-- ============================================================================
-- 4. Seed: Properties (Mix of Sale & Rental across prime metro locations)
-- ============================================================================
INSERT INTO Properties (property_id, owner_name, owner_contact, location, square_feet, bedrooms, value, status, broker_id, commission_id) VALUES
(1, 'Harish Mehta', '+91 98111 00001', 'Bandra West, Mumbai - 400050', 1450, 3, 38500000.00, 'sold', 1, 1),
(2, 'Nandita Kapoor', '+91 98111 00002', 'Powai, Mumbai - 400076', 950, 2, 65000.00, 'available', 1, 2),
(3, 'Ramesh Shah', '+91 98111 00003', 'Andheri East, Mumbai - 400069', 620, 1, 38000.00, 'ongoing_rental', 2, 4),
(4, 'Kavita Chawla', '+91 98111 00004', 'Worli Sea Face, Mumbai - 400018', 2200, 4, 92000000.00, 'available', 2, 3),
(5, 'Deepak Singhania', '+91 98111 00005', 'Juhu Tara Road, Mumbai - 400049', 1800, 3, 140000.00, 'ongoing_rental', 3, 6),
(6, 'Meera Deshmukh', '+91 98111 00006', 'Thane West, Mumbai - 400601', 820, 2, 9500000.00, 'available', 3, 5),
(7, 'Alok Goel', '+91 98111 00007', 'Lower Parel, Mumbai - 400013', 550, 1, 48000.00, 'available', 4, 8),
(8, 'Geeta Merchant', '+91 98111 00008', 'Khar West, Mumbai - 400052', 1200, 2, 75000.00, 'ongoing_rental', 4, 8),
(9, 'Sanjay Agarwal', '+91 98111 00009', 'Santacruz West, Mumbai - 400054', 1650, 3, 44000000.00, 'available', 1, 1),
(10, 'Preeti Joshi', '+91 98111 00010', 'Malad West, Mumbai - 400064', 700, 2, 32000.00, 'available', 2, 4);

-- ============================================================================
-- 5. Seed: Property_Tenant_Type (Decomposed Multivalued 1NF/2NF Mapping)
-- ============================================================================
INSERT INTO Property_Tenant_Type (property_id, tenant_type) VALUES
(2, 'family'),
(2, 'bachelor'),
(3, 'bachelor'),
(3, 'student'),
(5, 'family'),
(5, 'bachelor'),
(7, 'bachelor'),
(7, 'student'),
(7, 'family'),
(8, 'family'),
(8, 'bachelor'),
(10, 'student'),
(10, 'bachelor'),
(10, 'family');

-- ============================================================================
-- 6. Seed: Leases (Rental terms for rental properties)
-- ============================================================================
INSERT INTO Leases (lease_id, lease_type, security_deposit, duration_months, property_id) VALUES
(1, 'long-term', 130000.00, 11, 2),
(2, 'long-term', 76000.00, 11, 3),
(3, 'long-term', 300000.00, 12, 5),
(4, 'short-term', 100000.00, 6, 7),
(5, 'long-term', 150000.00, 11, 8),
(6, 'long-term', 64000.00, 11, 10);

-- ============================================================================
-- 7. Seed: Enquiries (Various lifecycle stages: open, in_progress, closed, rejected)
-- ============================================================================
INSERT INTO Enquiries (enquiry_id, client_id, property_id, broker_id, enquiry_date, status, notes) VALUES
(1, 4, 1, 1, '2024-01-05', 'closed', 'Family client made full offer on Bandra 3BHK. Deal concluded.'),
(2, 2, 3, 2, '2024-02-20', 'closed', 'Tech professional bachelor rented Andheri 1BHK.'),
(3, 6, 5, 3, '2023-07-25', 'closed', 'Corporate executive family lease for Juhu 3BHK.'),
(4, 3, 8, 4, '2024-04-20', 'closed', 'Couple signed 11-month lease for Khar 2BHK.'),
(5, 1, 2, 1, '2024-10-01', 'open', 'Student seeking rental sharing options near Powai.'),
(6, 5, 7, 4, '2024-10-02', 'in_progress', 'Designer interested in Lower Parel 1BHK. Inspection scheduled.'),
(7, 3, 4, 2, '2024-10-03', 'in_progress', 'Evaluating mortgage options for Worli Sea Face luxury flat.'),
(8, 2, 10, 2, '2024-09-15', 'rejected', 'Client decided location was too far from current office.');

-- ============================================================================
-- 8. Seed: Deals (Sales & Rentals)
-- Note on Deal #3: rental_end_date is in the PAST ('2024-07-31') while status is 'ongoing'.
-- This serves as the benchmark test fixture for the proactive rental expiry engine!
-- ============================================================================
INSERT INTO Deals (
    deal_id, enquiry_id, property_id, broker_id, client_id, 
    deal_type, deal_date, deal_value, rental_start_date, rental_end_date, 
    deal_status, company_earning, broker_earning
) VALUES
(
    1, 1, 1, 1, 4, 
    'sale', '2024-01-10', 38500000.00, NULL, NULL, 
    'completed', 770000.00, 770000.00
),
(
    2, 2, 3, 2, 2, 
    'rental', '2024-03-01', 38000.00, '2024-03-01', '2027-02-28', 
    'ongoing', 570.00, 570.00
),
(
    3, 3, 5, 3, 6, 
    'rental', '2023-08-01', 140000.00, '2023-08-01', '2024-07-31', 
    'ongoing', 1400.00, 1400.00
),
(
    4, 4, 8, 4, 3, 
    'rental', '2024-05-01', 75000.00, '2024-05-01', '2027-04-30', 
    'ongoing', 937.50, 937.50
);

-- ============================================================================
-- 9. Seed: Reviews (Verified reviews linked to completed deals)
-- ============================================================================
INSERT INTO Reviews (review_id, client_id, broker_id, deal_id, rating, comments, review_date) VALUES
(1, 4, 1, 1, 5, 'Rajesh Sharma was outstanding throughout the entire Bandra purchase. Seamless documentation, transparent negotiations, and absolute professionalism.', '2024-01-15'),
(2, 2, 2, 2, 4, 'Priya helped me close the Andheri lease within 48 hours. Very responsive on paperwork and clear communication with the owner.', '2024-03-05');
