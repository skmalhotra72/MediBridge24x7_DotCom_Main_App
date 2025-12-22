// src/components/clinic-website/shared/SEOHead.tsx
// SEO metadata component for clinic websites

import { Metadata } from 'next';
import type { ClinicWebsiteData } from '@/lib/clinic-website/types';

// ============================================
// Generate Metadata for Clinic Website
// ============================================
export function generateClinicMetadata(data: ClinicWebsiteData): Metadata {
  const { organization, profile } = data;
  
  const title = profile.seo_title || `${organization.name} - Healthcare Services`;
  const description = profile.seo_description || 
    `${organization.name} - ${profile.tagline || 'Quality healthcare for you and your family'}`;
  
  return {
    title,
    description,
    keywords: [
      organization.name,
      'clinic',
      'doctor',
      'healthcare',
      'medical',
      profile.address || '',
    ].filter(Boolean).join(', '),
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: organization.name,
      images: profile.hero_image_url ? [
        {
          url: profile.hero_image_url,
          width: 1200,
          height: 630,
          alt: organization.name,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: profile.hero_image_url ? [profile.hero_image_url] : [],
    },
    robots: {
      index: profile.is_published,
      follow: profile.is_published,
    },
  };
}

// ============================================
// JSON-LD Structured Data for Medical Business
// ============================================
export function generateClinicJsonLd(data: ClinicWebsiteData): string {
  const { organization, profile, doctors, testimonials } = data;
  
  // Calculate average rating
  const avgRating = testimonials.length > 0 
    ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
    : null;

  // Build employee array
  const employeeList = doctors.map((doctor) => ({
    '@type': 'Physician',
    name: doctor.full_name,
    medicalSpecialty: doctor.specialization,
    description: doctor.bio,
  }));

  // Build opening hours
  const openingHoursList = profile.working_hours
    ? Object.entries(profile.working_hours)
        .filter(([, hours]) => hours && hours !== 'Closed')
        .map(([day, hours]) => `${day.slice(0, 2).toUpperCase()} ${hours}`)
    : [];

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: organization.name,
    description: profile.seo_description || profile.tagline,
    url: `https://${organization.slug}.medibridge24x7.com`,
    telephone: profile.contact_phone,
    email: profile.contact_email,
  };

  if (profile.address) {
    jsonLd.address = {
      '@type': 'PostalAddress',
      streetAddress: profile.address,
    };
  }

  if (openingHoursList.length > 0) {
    jsonLd.openingHours = openingHoursList;
  }

  if (employeeList.length > 0) {
    jsonLd.employee = employeeList;
  }

  if (avgRating && testimonials.length > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating,
      reviewCount: testimonials.length,
    };
  }

  return JSON.stringify(jsonLd);
}

// ============================================
// Script Component for JSON-LD
// ============================================
interface ClinicJsonLdScriptProps {
  data: ClinicWebsiteData;
}

export function ClinicJsonLdScript({ data }: ClinicJsonLdScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: generateClinicJsonLd(data) }}
    />
  );
}