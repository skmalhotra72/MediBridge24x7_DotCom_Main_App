'use client';

import { 
  Phone, Mail, MapPin, Clock, MessageSquare, 
  Award, Stethoscope, Brain, Users, Shield, CheckCircle
} from 'lucide-react';
import type { ClinicWebsiteData } from '@/lib/clinic-website/types';

interface ContactSectionProps {
  data: ClinicWebsiteData;
}

export default function ContactSection({ data }: ContactSectionProps) {
  const { organization, profile, doctors, testimonials } = data;

  const whatsappNumber = profile.social_links?.whatsapp || profile.contact_phone;
  const cleanWhatsapp = whatsappNumber?.replace(/\D/g, '');

  const workingHours = profile.working_hours || {
    monday: '9:00 AM - 9:00 PM',
    tuesday: '9:00 AM - 9:00 PM',
    wednesday: '9:00 AM - 9:00 PM',
    thursday: '9:00 AM - 9:00 PM',
    friday: '9:00 AM - 9:00 PM',
    saturday: '9:00 AM - 5:00 PM',
    sunday: 'Closed',
  };

  const whyChooseUs = [
    { icon: Award, title: '15+ Years of Excellence', description: 'Trusted by thousands of families' },
    { icon: Stethoscope, title: 'Expert Specialists', description: 'Highly qualified doctors across multiple fields' },
    { icon: Shield, title: 'Advanced Diagnostics', description: 'State-of-the-art facilities' },
    { icon: Brain, title: 'AI-Powered Support', description: 'MediBridge 24/7 assistance in your language' },
    { icon: Users, title: `${testimonials.length * 150}+ Happy patients and counting`, description: '' },
    { icon: CheckCircle, title: 'Insurance Accepted', description: 'Cashless claims for most providers' },
  ];

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Visit Us or Get in Touch
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left - Contact Info */}
          <div>
            {/* Address */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">Address</h3>
              <p className="text-gray-600 mb-1">{organization.name}</p>
              <p className="text-gray-600">{profile.address || '123 Health Street, Medical Complex, Gurugram 400001'}</p>
            </div>

            {/* Phone */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">Phone</h3>
              <p className="text-gray-600">{profile.contact_phone || '+91 9876543210'}</p>
              {cleanWhatsapp && (
                <p className="text-gray-600">WhatsApp: +91 {cleanWhatsapp.slice(-10)}</p>
              )}
            </div>

            {/* Email */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600">{profile.contact_email || `contact@${organization.slug || 'clinic'}.com`}</p>
            </div>

            {/* Clinic Hours */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Clinic Hours</h3>
              <div className="space-y-2">
                {Object.entries(workingHours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">{day}</span>
                    <span className={hours === 'Closed' ? 'text-red-500' : 'text-gray-900'}>
                      {hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 24/7 Emergency */}
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-8">
              <h3 className="font-semibold text-red-700 mb-1">24/7 Emergency</h3>
              <p className="text-sm text-red-600">
                For emergencies, contact our 24/7 support line or WhatsApp us anytime.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {profile.contact_phone && (
                <a
                  href={`tel:${profile.contact_phone}`}
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call Now
                </a>
              )}
              {cleanWhatsapp && (
                <a
                  href={`https://wa.me/${cleanWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Right - Why Choose Us */}
          <div>
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Why Choose {organization.name}?
              </h3>
              <div className="space-y-4">
                {whyChooseUs.map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      {item.description && (
                        <p className="text-sm text-gray-500">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            <div className="mt-8 rounded-2xl overflow-hidden border border-gray-200">
              {profile.address ? (
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(profile.address)}&output=embed`}
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  loading="lazy"
                  title="Location Map"
                />
              ) : (
                <div className="h-64 bg-gray-100 flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
