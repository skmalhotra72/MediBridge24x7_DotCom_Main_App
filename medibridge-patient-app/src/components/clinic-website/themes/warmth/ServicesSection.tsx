'use client';

import { Video, Stethoscope, TestTube, CheckCircle } from 'lucide-react';
import type { ClinicWebsiteData } from '@/lib/clinic-website/types';

interface ServicesSectionProps {
  data: ClinicWebsiteData;
}

export default function ServicesSection({ data }: ServicesSectionProps) {
  const services = [
    {
      icon: Video,
      title: 'Video Consultation',
      description: 'Consult with our doctors from the comfort of your home at your convenience 24×7.',
      features: [
        'No travel required',
        'Same day appointments available',
        'Prescription provided',
        'Follow-up included',
      ],
      price: '₹500',
      priceLabel: 'Consultation Fee',
      cta: 'Book Video Consultation',
      ctaColor: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      icon: Stethoscope,
      title: 'In-Clinic Visit',
      description: 'Visit our state-of-the-art clinic for comprehensive physical examinations and care.',
      features: [
        'Complete health check',
        'Extended diagnostics available',
        'Same day reports',
        'Follow-up support',
      ],
      price: '₹700',
      priceLabel: 'Consultation Fee',
      cta: 'Book Clinic Visit',
      ctaColor: 'bg-violet-600 hover:bg-violet-700',
    },
    {
      icon: TestTube,
      title: 'Diagnostic Tests',
      description: 'Get blood tests, X-ray, ECG, and other diagnostic tests at our clinic or at your home.',
      features: [
        'Vital, cortisol lab',
        'Same day test delivery',
        'Digital reports in 24 hours',
        'Competitive pricing',
      ],
      price: 'From ₹200',
      priceLabel: '',
      cta: 'Book Diagnostic Tests',
      ctaColor: 'bg-emerald-600 hover:bg-emerald-700',
    },
  ];

  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Book Your Appointment
          </h2>
          <p className="text-gray-600">
            Choose the service you need - we make healthcare accessible
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Icon */}
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <service.icon className="w-7 h-7 text-purple-600" />
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {service.title}
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                {service.description}
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-6 flex-1">
                {service.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Price */}
              <div className="mb-6">
                {service.priceLabel && (
                  <p className="text-xs text-gray-500 uppercase mb-1">{service.priceLabel}</p>
                )}
                <p className="text-2xl font-bold text-gray-900">{service.price}</p>
              </div>

              {/* CTA */}
              <a
                href="#contact"
                className={`w-full inline-flex items-center justify-center gap-2 text-white px-6 py-3 rounded-lg font-semibold transition-colors ${service.ctaColor}`}
              >
                {service.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
