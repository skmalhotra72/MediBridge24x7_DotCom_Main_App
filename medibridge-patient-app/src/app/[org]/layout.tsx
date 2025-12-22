import { Metadata } from 'next';
import { createSupabaseServer } from '@/lib/supabase/server';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ org: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { org } = await params;
  const supabase = await createSupabaseServer();

  // Get organization name for title
  const { data: organization } = await supabase
    .from('organizations')
    .select('name')
    .eq('slug', org)
    .single();

  const orgName = organization?.name || org
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${orgName} | MediBridge Patient Portal`,
    description: `AI-powered healthcare companion for ${orgName}. Get instant prescription analysis, medicine information, and personalized health guidance.`,
  };
}

export default async function OrgLayout({ children }: LayoutProps) {
  // CRITICAL: No wrapper elements, no headers - pages handle their own full-screen layouts
  // This prevents the double header issue
  return children;
}
