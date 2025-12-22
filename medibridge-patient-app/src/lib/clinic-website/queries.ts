// src/lib/clinic-website/queries.ts
// Supabase queries for white-label clinic websites

import { createClient } from '@supabase/supabase-js';
import type {
  ClinicWebsiteData,
  ClinicProfile,
  DoctorProfile,
  Testimonial,
  Organization,
} from './types';

// ============================================
// Supabase Client (for server-side fetching)
// ============================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// Get Organization by Slug
// ============================================
export async function getOrganizationBySlug(
  slug: string
): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching organization:', error);
    return null;
  }

  return data as Organization;
}

// ============================================
// Get Clinic Profile by Organization ID
// ============================================
export async function getClinicProfile(
  organizationId: string
): Promise<ClinicProfile | null> {
  const { data, error } = await supabase
    .from('clinic_profiles')
    .select('*')
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    console.error('Error fetching clinic profile:', error);
    return null;
  }

  return data as ClinicProfile;
}

// ============================================
// Get Doctors by Organization ID
// ============================================
export async function getDoctors(
  organizationId: string
): Promise<DoctorProfile[]> {
  const { data, error } = await supabase
    .from('doctor_profiles')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }

  return data as DoctorProfile[];
}

// ============================================
// Get Testimonials by Organization ID
// ============================================
export async function getTestimonials(
  organizationId: string,
  featuredOnly: boolean = false
): Promise<Testimonial[]> {
  let query = supabase
    .from('testimonials')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_approved', true)
    .order('review_date', { ascending: false });

  if (featuredOnly) {
    query = query.eq('is_featured', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }

  return data as Testimonial[];
}

// ============================================
// Get Complete Clinic Website Data
// ============================================
export async function getClinicWebsiteData(
  slug: string
): Promise<ClinicWebsiteData | null> {
  // Step 1: Get organization by slug
  const organization = await getOrganizationBySlug(slug);
  
  if (!organization) {
    console.error('Organization not found for slug:', slug);
    return null;
  }

  // Step 2: Get clinic profile
  const profile = await getClinicProfile(organization.id);
  
  if (!profile) {
    console.error('Clinic profile not found for organization:', organization.id);
    return null;
  }

  // Step 3: Check if website is published
  if (!profile.is_published) {
    console.error('Clinic website is not published:', slug);
    return null;
  }

  // Step 4: Get doctors and testimonials in parallel
  const [doctors, testimonials] = await Promise.all([
    getDoctors(organization.id),
    getTestimonials(organization.id),
  ]);

  // Step 5: Return complete data
  return {
    organization,
    profile,
    doctors,
    testimonials,
  };
}

// ==
// ============================================
// Get All Published Clinic Slugs (for static generation)
// ============================================
export async function getAllPublishedClinicSlugs(): Promise<string[]> {
  const { data, error } = await supabase
    .from('clinic_profiles')
    .select('organization_id')
    .eq('is_published', true);

  if (error || !data) {
    console.error('Error fetching published clinic slugs:', error);
    return [];
  }

  // Get organization slugs
  const orgIds = data.map((item: { organization_id: string }) => item.organization_id);
  
  if (orgIds.length === 0) {
    return [];
  }

  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('slug')
    .in('id', orgIds);

  if (orgError || !orgs) {
    console.error('Error fetching organization slugs:', orgError);
    return [];
  }

  return orgs.map((org: { slug: string }) => org.slug);
}