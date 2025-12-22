import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getClinicWebsiteData, getAllPublishedClinicSlugs } from '@/lib/clinic-website/queries';
import { generateClinicMetadata } from '@/components/clinic-website/shared/SEOHead';
import WarmthTemplate from '@/components/clinic-website/themes/warmth/index';

interface ClinicPageProps {
  params: Promise<{
    slug: string;
  }>;
}

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
  
  return <WarmthTemplate data={data} />;
}

export const revalidate = 3600;