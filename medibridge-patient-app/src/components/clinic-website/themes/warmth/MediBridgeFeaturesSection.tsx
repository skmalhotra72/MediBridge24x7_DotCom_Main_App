'use client';

import { 
  FileText, Globe, TestTube, Bell, Calendar, MessageSquare, ArrowRight 
} from 'lucide-react';
import type { ClinicWebsiteData } from '@/lib/clinic-website/types';

interface MediBridgeFeaturesSectionProps {
  data: ClinicWebsiteData;
}

export default function MediBridgeFeaturesSection({ data }: MediBridgeFeaturesSectionProps) {
  const { organization } = data;
  
  // Use relative URL for patient portal (same domain)
  const patientPortalUrl = `/${organization.slug || 'demo-clinic'}`;

  const features = [
    {
      icon: FileText,
      title: 'Prescription Decoded',
      description: 'MediBridge instantly explains complex medical terms, dosages, and medication schedules - in Hindi, Tamil, or your preferred language.',
    },
    {
      icon: Globe,
      title: 'Your Language, Your Comfort',
      description: 'Get healthcare guidance in 9+ Indian languages. No more confusion, no more language barriers.',
    },
    {
      icon: TestTube,
      title: 'Test Booking Made Easy',
      description: 'MediBridge compares lab prices and helps you book tests at the best rates near you.',
    },
    {
      icon: Bell,
      title: 'Smart Reminders',
      description: 'Never miss a dose or follow-up. Get gentle WhatsApp reminders for medicines and appointments.',
    },
    {
      icon: Calendar,
      title: 'Follow-up Tracking',
      description: 'Track all your appointments, test results, and health records in one place, available 24/7 with no limits.',
    },
    {
      icon: MessageSquare,
      title: '24/7 Support',
      description: 'Questions at 2 AM? Our AI assistant is always available to help you understand your health better.',
    },
  ];

  return (
    <section id="medibridge" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-6">
          <p className="text-sm text-purple-600 font-semibold mb-2">
            Post consultation Support - Powered by MediBridge AI
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            From Confusion to Confidence
          </h2>
          <p className="text-gray-600">
            After your consultation at {organization.name}, our AI assistant makes sure you understand 
            your treatment completely - in your language, available 24/7 on WhatsApp
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center p-6"
            >
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Walk out of your consultation with complete clarity. Upload your prescription and let MediBridge guide you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={patientPortalUrl}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Upload Prescription
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold transition-colors"
            >
              Learn more about MediBridge
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
