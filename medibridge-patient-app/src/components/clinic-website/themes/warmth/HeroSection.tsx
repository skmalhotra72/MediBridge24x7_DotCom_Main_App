'use client';

import { Phone, MapPin, Clock, Star, Shield, Calendar, Navigation } from 'lucide-react';
import type { ClinicWebsiteData } from '@/lib/clinic-website/types';

interface HeroSectionProps {
  data: ClinicWebsiteData;
}

export default function HeroSection({ data }: HeroSectionProps) {
  const { organization, profile, doctors, testimonials } = data;
  
  const avgRating = testimonials.length > 0
    ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
    : '4.9';

  const specializations = doctors.map(d => d.specialization).filter(Boolean);
  const uniqueSpecs = [...new Set(specializations)].slice(0, 4);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" style={{ minHeight: 'calc(100vh - 140px)' }}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      {/* Decorative Gradient Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-8 flex items-center" style={{ minHeight: 'calc(100vh - 140px)' }}>
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          
          {/* Left Content */}
          <div className="text-white">
            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Expert Healthcare,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
                Right When You Need It
              </span>
            </h1>

            {/* Clinic Description */}
            <p className="text-lg text-purple-200 mb-6 max-w-xl leading-relaxed">
              {organization.name} - Your trusted partner in health with experienced specialists 
              across {uniqueSpecs.length > 0 ? uniqueSpecs.join(', ') : 'General Medicine, Pediatrics, and Family Care'}.
            </p>

            {/* Trust Pills */}
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium border border-green-500/30">
                <Shield className="w-4 h-4" />
                24/7
              </span>
              <span className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium">
                9+ Languages
              </span>
              <span className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {avgRating} Trusted by {testimonials.length * 150}+
              </span>
              <span className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium">
                {doctors.length}+ Specialist Doctors
              </span>
            </div>

            {/* CTA Buttons Row 1 */}
            <div className="flex flex-wrap gap-4 mb-4">
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
              >
                <Calendar className="w-5 h-5" />
                Book Appointment
              </a>
              <a
                href="#medibridge"
                className="inline-flex items-center justify-center gap-2 bg-violet-500/20 text-white border border-violet-500/30 px-6 py-3 rounded-lg font-semibold hover:bg-violet-500/30 transition-all"
              >
                Post Consultation Support →
              </a>
            </div>

            {/* CTA Buttons Row 2 */}
            <div className="flex flex-wrap gap-4 mb-4">
              {profile.contact_phone && (
                <a
                  href={'tel:' + profile.contact_phone}
                  className="inline-flex items-center gap-2 text-purple-300 hover:text-white transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  Call Now
                </a>
              )}
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(profile.address || organization.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-300 hover:text-white transition-colors"
              >
                <Navigation className="w-5 h-5" />
                Get Directions
              </a>
              <span className="inline-flex items-center gap-2 text-green-400">
                <Clock className="w-5 h-5" />
                Today: 9:00 AM - 9:00 PM
              </span>
            </div>

            {/* Post-Consultation Support Note */}
            <div className="text-sm text-purple-300 flex items-center gap-2">
              <span>Post consultation support Powered by MediBridge AI</span>
            </div>
          </div>

          {/* Right Side - Doctor Image */}
          <div className="relative hidden lg:flex justify-center items-center">
            <div className="relative">
              {/* Main Doctor Image */}
              <div className="relative w-72 h-80 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20">
                <img 
                  src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=500&h=600&fit=crop&crop=face"
                  alt="Doctor"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 via-transparent to-transparent" />
              </div>

              {/* Second Doctor Image (offset) */}
              <div className="absolute -right-12 top-16 w-56 h-72 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20 border-4 border-slate-900">
                <img 
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=500&fit=crop&crop=face"
                  alt="Doctor"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 via-transparent to-transparent" />
              </div>

              {/* Stats Card */}
              <div className="absolute -left-6 bottom-8 bg-white rounded-2xl p-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">15+</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Years</p>
                    <p className="text-xs text-gray-500">Experience</p>
                  </div>
                </div>
              </div>

              {/* Rating Card */}
              <div className="absolute right-0 -bottom-2 bg-white rounded-2xl p-3 shadow-xl">
                <div className="flex items-center gap-2">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="font-bold text-gray-800 text-sm ml-1">{avgRating}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{testimonials.length} Reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
