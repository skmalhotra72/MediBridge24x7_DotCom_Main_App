import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getClinicWebsiteData, getAllPublishedClinicSlugs } from '@/lib/clinic-website/queries';
import { generateClinicMetadata } from '@/components/clinic-website/shared/SEOHead';

// Import both themes
import WarmthTemplate from '@/components/clinic-website/themes/warmth/index';
import HorizonTemplate from '@/components/clinic-website/themes/horizon/index';

interface ClinicPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Theme mapping - add more clinics here as needed
const THEME_MAP: Record<string, 'warmth' | 'horizon'> = {
  'demo-clinic': 'warmth',
  'city-general-hospital': 'horizon',
};

// Default theme for clinics not in the map
const DEFAULT_THEME = 'warmth';

export async function generateMetadata({ params }: ClinicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getClinicWebsiteData(slug);
  
  if (!data) {
    return {
      title: 'Clinic Not Found',
    };
  }
  
  return generateClinicMetadata(data);
}

export async function generateStaticParams() {
  const slugs = await getAllPublishedClinicSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function ClinicPage({ params }: ClinicPageProps) {
  const { slug } = await params;
  const data = await getClinicWebsiteData(slug);
  
  if (!data) {
    notFound();
  }
  
  // Determine which theme to use
  const theme = THEME_MAP[slug] || DEFAULT_THEME;
  
  // Render the appropriate theme
  switch (theme) {
    case 'horizon':
      return <HorizonTemplate data={data} />;
    case 'warmth':
    default:
      return <WarmthTemplate data={data} />;
  }
}

export const revalidate = 3600;