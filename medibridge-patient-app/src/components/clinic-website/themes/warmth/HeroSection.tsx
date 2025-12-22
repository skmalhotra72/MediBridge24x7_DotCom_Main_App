'use client';

import { Phone, Clock, Star, Shield, Calendar, Navigation, CheckCircle, Users } from 'lucide-react';
import type { ClinicWebsiteData } from '@/lib/clinic-website/types';

interface HeroSectionProps {
  data: ClinicWebsiteData;
}

// Doctor placeholder images
const doctorImages = [
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face',
];

export default function HeroSection({ data }: HeroSectionProps) {
  const { organization, profile, doctors, testimonials } = data;
  
  const avgRating = testimonials.length > 0
    ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
    : '4.8';

  const totalExperience = doctors.reduce((sum, d) => sum + (d.experience_years || 0), 0);
  const avgExperience = doctors.length > 0 ? Math.round(totalExperience / doctors.length) : 15;

  const specializations = doctors.map(d => d.specialization).filter(Boolean);
  const uniqueSpecs = [...new Set(specializations)].slice(0, 3);

  // Get actual doctors only (max 2 for display)
  const displayDoctors = doctors.slice(0, 2).map((doc, index) => ({
    ...doc,
    image: (doc as any).photo_url || doctorImages[index % doctorImages.length],
  }));

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" style={{ minHeight: 'calc(100vh - 140px)' }}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      {/* Decorative Gradient Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-pink-600/10 rounded-full blur-3xl" />

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
              across {uniqueSpecs.length > 0 ? uniqueSpecs.join(' & ') : 'General Medicine, Pediatrics & Child Health'}.
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
                {avgRating} Trusted by {Math.max(testimonials.length * 150, 500)}+
              </span>
              <span className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium">
                <Users className="w-4 h-4" />
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

          {/* Right Side - Floating Bubbles Design (2 Doctors) */}
          <div className="relative hidden lg:flex justify-center items-center h-[520px]">
            
            {/* Decorative ring */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] border border-purple-500/20 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] border border-purple-500/10 rounded-full" />

            {/* First Doctor - Large Bubble Top Right */}
            {displayDoctors[0] && (
              <div className="absolute top-0 right-4 z-20">
                <div className="relative group">
                  <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl shadow-purple-500/30 transition-transform duration-500 group-hover:scale-105 animate-float-slow">
                    <img 
                      src={displayDoctors[0].image}
                      alt={displayDoctors[0].full_name || 'Doctor'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Pulse ring animation */}
                  <div className="absolute inset-0 rounded-full border-2 border-purple-400/50 animate-ping" style={{ animationDuration: '3s' }} />
                  
                  {/* Name tag */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
                    <p className="text-sm font-semibold text-gray-800">{displayDoctors[0].full_name?.split(' ').slice(0, 2).join(' ')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Second Doctor - Large Bubble Bottom Left */}
            {displayDoctors[1] && (
              <div className="absolute bottom-8 left-0 z-20">
                <div className="relative group">
                  <div className="w-52 h-52 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl shadow-purple-500/30 transition-transform duration-500 group-hover:scale-105 animate-float-medium">
                    <img 
                      src={displayDoctors[1].image}
                      alt={displayDoctors[1].full_name || 'Doctor'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Verified badge */}
                  <div className="absolute top-2 right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-3 border-white shadow-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  
                  {/* Name tag for second doctor */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
                    <p className="text-sm font-semibold text-gray-800">{displayDoctors[1].full_name?.split(' ').slice(0, 2).join(' ')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Experience Badge - CENTER of the circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
              <div className="bg-white rounded-2xl p-5 shadow-2xl shadow-purple-500/20 animate-float-slow">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">{avgExperience}+</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">Years</p>
                    <p className="text-sm text-gray-500">Avg. Experience</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Card - Bottom Right */}
            <div className="absolute bottom-24 right-0 z-30 animate-float-medium">
              <div className="bg-white rounded-2xl p-4 shadow-2xl shadow-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-gray-800 text-2xl">{avgRating}</span>
                  <span className="text-sm text-gray-500">{testimonials.length} Reviews</span>
                </div>
              </div>
            </div>

            {/* Additional small floating elements */}
            <div className="absolute top-24 left-32 w-4 h-4 bg-purple-400 rounded-full animate-pulse opacity-60" />
            <div className="absolute bottom-40 right-40 w-3 h-3 bg-violet-400 rounded-full animate-pulse opacity-60" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-1/3 right-2 w-3 h-3 bg-pink-400 rounded-full animate-pulse opacity-60" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse opacity-60" style={{ animationDelay: '1.5s' }} />
          </div>
        </div>
      </div>

      {/* Custom CSS for floating animations */}
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}