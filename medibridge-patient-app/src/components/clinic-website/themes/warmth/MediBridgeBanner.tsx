'use client';

import { ArrowRight } from 'lucide-react';
import type { ClinicWebsiteData } from '@/lib/clinic-website/types';

interface MediBridgeBannerProps {
  data: ClinicWebsiteData;
}

export default function MediBridgeBanner({ data }: MediBridgeBannerProps) {
  const { organization } = data;
  
  // Use relative URL for patient portal (same domain)
  const patientPortalUrl = `/${organization.slug || 'demo-clinic'}`;

  return (
    <section className="bg-slate-900 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Content */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-1">
              Post-Consultation Support - Powered by MediBridge AI
            </h3>
            <p className="text-slate-400 text-sm">
              Don't understand your prescription? Get instant explanations, find nearby labs, 
              and book follow-ups - all through WhatsApp. Available 24/7 in your language.
            </p>
          </div>

          {/* Right CTAs */}
          <div className="flex flex-wrap gap-3">
            <a
              href={patientPortalUrl}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              Upload Prescription
            </a>
            <a
              href="#medibridge"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              Learn about MediBridge
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
