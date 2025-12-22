// src/lib/clinic-website/types.ts
// Type definitions for white-label clinic websites

// ============================================
// Service Type
// ============================================
export interface ClinicService {
    name: string;
    icon: string;
    description: string;
  }
  
  // ============================================
  // Working Hours Type
  // ============================================
  export interface WorkingHours {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  }
  
  // ============================================
  // Social Links Type
  // ============================================
  export interface SocialLinks {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    whatsapp?: string;
  }
  
  // ============================================
  // Custom Colors Type
  // ============================================
  export interface CustomColors {
    primary?: string;
    secondary?: string;
    accent?: string;
    surface?: string;
  }
  
  // ============================================
  // Clinic Profile Type
  // ============================================
  export interface ClinicProfile {
    id: string;
    organization_id: string;
    theme_id: string;
    hero_image_url: string | null;
    tagline: string | null;
    about_us: string | null;
    services: ClinicService[];
    custom_colors: CustomColors;
    contact_email: string | null;
    contact_phone: string | null;
    address: string | null;
    google_maps_url: string | null;
    working_hours: WorkingHours;
    social_links: SocialLinks;
    is_published: boolean;
    custom_domain: string | null;
    seo_title: string | null;
    seo_description: string | null;
    created_at: string;
    updated_at: string;
  }
  
  // ============================================
  // Doctor Profile Type
  // ============================================
  export interface DoctorProfile {
    id: string;
    organization_id: string;
    full_name: string;
    specialization: string | null;
    qualifications: string | null;
    experience_years: number | null;
    photo_url: string | null;
    bio: string | null;
    awards: string[];
    certifications: string[];
    languages_spoken: string[];
    consultation_fee: number | null;
    available_days: string[];
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  // ============================================
  // Testimonial Type
  // ============================================
  export interface Testimonial {
    id: string;
    organization_id: string;
    patient_name: string;
    patient_photo_url: string | null;
    rating: number;
    review_text: string;
    treatment_type: string | null;
    review_date: string;
    is_featured: boolean;
    is_approved: boolean;
    created_at: string;
  }
  
  // ============================================
  // Organization Type (extended)
  // ============================================
  export interface Organization {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    logo_url: string | null;
    is_public: boolean;
    created_at: string;
  }
  
  // ============================================
  // Complete Clinic Data (for website rendering)
  // ============================================
  export interface ClinicWebsiteData {
    organization: Organization;
    profile: ClinicProfile;
    doctors: DoctorProfile[];
    testimonials: Testimonial[];
  }
  
  // ============================================
  // Theme Configuration
  // ============================================
  export interface ThemeConfig {
    id: string;
    name: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      surface: string;
      text: string;
      textMuted: string;
    };
    fonts: {
      heading: string;
      body: string;
    };
  }
  
  // ============================================
  // WARMTH Theme Default Config
  // ============================================
  export const WARMTH_THEME: ThemeConfig = {
    id: 'warmth',
    name: 'Warmth',
    colors: {
      primary: '#f97316',    // Orange
      secondary: '#78716c',  // Warm Gray
      accent: '#ea580c',     // Dark Orange
      surface: '#fffbeb',    // Warm Cream
      text: '#1c1917',       // Stone 900
      textMuted: '#78716c',  // Stone 500
    },
    fonts: {
      heading: 'Nunito, sans-serif',
      body: 'Lato, sans-serif',
    },
  };