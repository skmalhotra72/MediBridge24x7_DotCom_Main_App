'use client';

import { 
  Heart, Users, Clock, Award, Shield, CheckCircle, Star, ArrowRight
} from 'lucide-react';
import type { ClinicWebsiteData } from '@/lib/clinic-website/types';

interface AboutSectionProps {
  data: ClinicWebsiteData;
}

export default function AboutSection({ data }: AboutSectionProps) {
  const { organization, profile, doctors, testimonials } = data;

  const totalPatients = testimonials.length * 150;
  const avgRating = testimonials.length > 0
    ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
    : '4.9';

  const stats = [
    { value: `${totalPatients}+`, label: 'Happy Patients', icon: Users },
    { value: '15+', label: 'Years Experience', icon: Clock },
    { value: `${doctors.length}+`, label: 'Specialist Doctors', icon: Award },
    { value: avgRating, label: 'Patient Rating', icon: Star },
  ];

  const highlights = [
    'Expert doctors with 15+ years experience',
    'Modern diagnostic facilities on-site',
    'Same-day appointments available',
    'All major insurance accepted',
    '24/7 post-consultation AI support',
    'Multilingual patient care (9+ languages)',
  ];

  return (
    <section id="about" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Stats Banner */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-8 md:p-12 mb-20 shadow-xl shadow-orange-500/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <p className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-orange-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* About Content */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Image/Visual */}
          <div className="relative">
            <div className="aspect-square max-w-lg mx-auto relative">
              {/* Background Decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-amber-50 rounded-3xl transform rotate-3" />
              <div className="absolute inset-0 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Clinic Image Placeholder */}
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="text-8xl mb-6">🏥</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{organization.name}</h3>
                  <p className="text-gray-500 mb-4">Caring for families since 2009</p>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                    ))}
                    <span className="ml-2 text-gray-600 font-medium">{avgRating}/5</span>
                  </div>
                </div>
              </div>

              {/* MediBridge Badge */}
              <div className="absolute -bottom-6 -right-6 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-4 shadow-xl text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold">24/7 AI Support</p>
                    <p className="text-sm text-teal-100">Powered by MediBridge</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div>
            <span className="inline-block px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-semibold mb-4">
              About Us
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              A Place Where Your Family{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                Feels at Home
              </span>
            </h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              {profile.about_us || `For over 15 years, ${organization.name} has been the trusted healthcare partner for families in our community. We believe in treating patients like family - with compassion, honesty, and the highest standard of care.`}
            </p>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              What makes us special? Our care doesn't end when you leave the clinic. 
              With <strong>MediBridge 24/7 support</strong>, you get AI-powered assistance 
              to understand your prescription, book tests, and manage your treatment - anytime, in your language.
            </p>

            {/* Highlights Grid */}
            <div className="grid sm:grid-cols-2 gap-3">
              {highlights.map((point, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700 text-sm">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
