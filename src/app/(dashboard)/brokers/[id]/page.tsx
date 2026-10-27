import type { Metadata } from "next";
import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import {
  BrokerProfileView,
  BrokerProfileData,
  BrokerStatsData,
  BrokerPropertyData,
  BrokerDealData,
} from "@/components/brokers/broker-profile-view";

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const brokerId = Number(id);
  if (!Number.isInteger(brokerId)) {
    return {
      title: "Broker Profile · EstateLink",
    };
  }

  const [brokers] = await pool.query<RowDataPacket[]>(
    "SELECT name FROM Brokers WHERE broker_id = ?",
    [brokerId]
  );
  const name = brokers[0]?.name || `Broker #${id}`;
  return {
    title: `${name} · Broker Profile · EstateLink`,
    description: `View ${name}'s verified broker profile, performance stats, listed properties, and client reviews on EstateLink.`,
  };
}

// Allow blocking prerender so params can be awaited and live data fetched.
export const instant = false;

export default async function BrokerProfilePage({
  params,
}: DetailPageProps) {
  const { id } = await params;
  const brokerId = Number(id);
  if (!Number.isInteger(brokerId)) {
    notFound();
  }

  const [brokers] = await pool.query<RowDataPacket[]>(
    "SELECT broker_id, name, email, phone, join_date FROM Brokers WHERE broker_id = ?",
    [brokerId]
  );
  if (brokers.length === 0) {
    notFound();
  }
  const broker = brokers[0] as unknown as BrokerProfileData;

  const [[statsRow]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(DISTINCT d.deal_id) AS total_deals,
            COALESCE(SUM(d.deal_value), 0) AS total_volume,
            COALESCE(SUM(d.broker_earning), 0) AS total_earnings,
            (SELECT COUNT(*) FROM Properties p WHERE p.broker_id = ?) AS total_properties,
            (SELECT ROUND(AVG(rating), 2) FROM Reviews WHERE broker_id = ?) AS average_rating,
            (SELECT COUNT(*) FROM Reviews WHERE broker_id = ?) AS total_reviews
     FROM Deals d WHERE d.broker_id = ?`,
    [brokerId, brokerId, brokerId, brokerId]
  );

  const stats: BrokerStatsData = {
    total_deals: Number(statsRow?.total_deals || 0),
    total_volume: Number(statsRow?.total_volume || 0),
    total_earnings: Number(statsRow?.total_earnings || 0),
    total_properties: Number(statsRow?.total_properties || 0),
    average_rating: Number(statsRow?.average_rating || 0),
    total_reviews: Number(statsRow?.total_reviews || 0),
  };

  const [reviewsRows] = await pool.query<RowDataPacket[]>(
    `SELECT r.review_id, r.rating, r.comments, r.review_date, c.name AS client_name
     FROM Reviews r
     JOIN Clients c ON r.client_id = c.client_id
     WHERE r.broker_id = ?
     ORDER BY r.review_id DESC`,
    [brokerId]
  );
  const reviews = reviewsRows.map((r) => ({
    review_id: Number(r.review_id),
    rating: Number(r.rating),
    comments: r.comments as string | null,
    review_date: String(r.review_date),
    client_name: String(r.client_name),
  }));

  const [propertiesRows] = await pool.query<RowDataPacket[]>(
    `SELECT p.property_id, p.owner_name, p.owner_contact, p.location,
            p.square_feet, p.bedrooms, p.value, p.status,
            (SELECT COUNT(*) FROM Enquiries e WHERE e.property_id = p.property_id) AS enquiry_count,
            (EXISTS (SELECT 1 FROM Leases l WHERE l.property_id = p.property_id) OR p.status = 'ongoing_rental') AS is_rental
     FROM Properties p
     WHERE p.broker_id = ?
     ORDER BY p.property_id DESC`,
    [brokerId]
  );
  const properties: BrokerPropertyData[] = propertiesRows.map((p) => ({
    property_id: Number(p.property_id),
    owner_name: String(p.owner_name),
    owner_contact: p.owner_contact as string | null,
    location: String(p.location),
    square_feet: p.square_feet ? Number(p.square_feet) : null,
    bedrooms: p.bedrooms ? Number(p.bedrooms) : null,
    value: Number(p.value),
    status: String(p.status),
    enquiry_count: Number(p.enquiry_count || 0),
    is_rental: Boolean(p.is_rental),
  }));

  const [dealsRows] = await pool.query<RowDataPacket[]>(
    `SELECT d.deal_id, d.deal_type, d.deal_value, d.deal_status, d.deal_date,
            d.broker_earning, d.company_earning,
            c.name AS client_name, p.location AS property_location, p.property_id
     FROM Deals d
     JOIN Clients c ON d.client_id = c.client_id
     JOIN Properties p ON d.property_id = p.property_id
     WHERE d.broker_id = ?
     ORDER BY d.deal_date DESC`,
    [brokerId]
  );
  const deals: BrokerDealData[] = dealsRows.map((d) => ({
    deal_id: Number(d.deal_id),
    deal_type: String(d.deal_type),
    deal_value: Number(d.deal_value),
    deal_status: String(d.deal_status),
    deal_date: String(d.deal_date),
    broker_earning: Number(d.broker_earning || 0),
    company_earning: Number(d.company_earning || 0),
    client_name: String(d.client_name),
    property_location: String(d.property_location),
    property_id: Number(d.property_id),
  }));

  return (
    <BrokerProfileView
      broker={broker}
      stats={stats}
      reviews={reviews}
      properties={properties}
      deals={deals}
    />
  );
}
