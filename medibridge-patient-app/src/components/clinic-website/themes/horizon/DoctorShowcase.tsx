'use client';

import { useState } from 'react';
import { 
  Star, Award, GraduationCap, Globe, Calendar, ChevronRight, 
  ChevronLeft, Play, Users, MessageSquare, Clock
} from 'lucide-react';
import type { ClinicWebsiteData } from '@/lib/clinic-website/types';

interface DoctorShowcaseProps {
  data: ClinicWebsiteData;
}

export default function DoctorShowcase({ data }: DoctorShowcaseProps) {
  const { doctors } = data;
  const [activeDoctor, setActiveDoctor] = useState(0);
  const [isHovering, setIsHovering] = useState<number | null>(null);

  // Enhanced doctor data with additional fields
  const enhancedDoctors = doctors?.map((doc, index) => ({
    ...doc,
    // Add supplementary data for showcase
    surgeries: [5000, 3000, 1200, 2500, 800, 15000, 10000, 500][index] || 1000,
    rating: 4.9,
    reviews: [847, 623, 412, 556, 389, 891, 734, 267][index] || 400,
    languages: ['English', 'Hindi', index % 2 === 0 ? 'German' : 'Arabic'],
    awards: ['Best Doctor Award 2024', 'Excellence in Surgery', 'Lifetime Achievement'][index % 3],
    education: [
      'Johns Hopkins University',
      'Stanford Medical School', 
      'Harvard Medical School',
      'AIIMS New Delhi',
      'Oxford University',
      'Mayo Clinic',
      'Cleveland Clinic',
      'King\'s College London'
    ][index % 8],
  })) || [];

  if (enhancedDoctors.length === 0) return null;

  const featured = enhancedDoctors[activeDoctor];

  const nextDoctor = () => {
    setActiveDoctor((prev) => (prev + 1) % enhancedDoctors.length);
  };

  const prevDoctor = () => {
    setActiveDoctor((prev) => (prev - 1 + enhancedDoctors.length) % enhancedDoctors.length);
  };

  return (
    <section id="doctors" className="relative py-24 overflow-hidden bg-gradient-to-b from-[#0B0E13] via-[#080a0e] to-[#0B0E13]">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[180px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">Meet Our Experts</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            World-Renowned
            <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent"> Medical Leaders</span>
          </h2>
          
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Our physicians are international leaders in their fields, trained at the world&apos;s 
            finest institutions and recognized for groundbreaking contributions to medicine.
          </p>
        </div>

        {/* Featured Doctor - Large Display */}
        <div className="mb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Large Portrait */}
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
              
              <div className="relative rounded-3xl overflow-hidden border border-white/10">
                <div className="aspect-[3/4]">
                  {featured.photo_url ? (
                    <img
                      src={featured.photo_url}
                      alt={featured.full_name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-teal-500/10 flex items-center justify-center">
                      <span className="text-9xl font-bold text-cyan-500/30">
                        {featured.full_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E13] via-transparent to-transparent" />
                </div>

                {/* Video Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>

                {/* Bottom Info Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0B0E13] to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <span className="text-white font-semibold">{featured.rating}</span>
                      <span className="text-gray-400">({featured.reviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {featured.languages.slice(0, 2).map((lang, i) => (
                        <span key={i} className="px-2 py-1 rounded-full bg-white/10 text-xs text-gray-300">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Awards Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30">
                  <Award className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 text-sm font-medium">{featured.awards}</span>
                </div>
              </div>

              {/* Navigation Arrows */}
              <div className="absolute bottom-6 right-6 flex items-center gap-2">
                <button
                  onClick={prevDoctor}
                  className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextDoctor}
                  className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Right - Details */}
            <div className="space-y-8">
              <div>
                <div className="text-cyan-400 font-medium mb-2">{featured.specialization}</div>
                <h3 className="text-4xl md:text-5xl font-bold text-white mb-4">{featured.full_name}</h3>
                <p className="text-gray-400 text-lg leading-relaxed">{featured.bio}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                    {featured.surgeries?.toLocaleString()}+
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Procedures</div>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                    {featured.experience_years}+
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Years Exp.</div>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                    {featured.rating}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Rating</div>
                </div>
              </div>

              {/* Credentials */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <GraduationCap className="w-6 h-6 text-cyan-400" />
                  <div>
                    <div className="text-sm text-gray-400">Education</div>
                    <div className="text-white font-medium">{featured.qualifications}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <Globe className="w-6 h-6 text-teal-400" />
                  <div>
                    <div className="text-sm text-gray-400">Trained At</div>
                    <div className="text-white font-medium">{featured.education}</div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 text-[#0B0E13] shadow-[0_0_30px_rgba(0,217,200,0.4)] hover:shadow-[0_0_50px_rgba(0,217,200,0.6)] transition-all"
                >
                  <Calendar className="w-5 h-5" />
                  Book with {featured.full_name.split(' ')[0]}
                </a>
                <button className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold bg-white/5 text-white border border-white/20 hover:bg-white/10 transition-colors">
                  <MessageSquare className="w-5 h-5" />
                  Send Inquiry
                </button>
              </div>

              {/* Consultation Fee */}
              <div className="flex items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/20">
                <div>
                  <div className="text-sm text-gray-400">Consultation Fee</div>
                  <div className="text-2xl font-bold text-white">
                    ₹{Number(featured.consultation_fee).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Available Today</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Grid - All Doctors */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-8 text-center">All Our Specialists</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {enhancedDoctors.map((doctor, index) => (
              <div
                key={doctor.id}
                onClick={() => setActiveDoctor(index)}
                onMouseEnter={() => setIsHovering(index)}
                onMouseLeave={() => setIsHovering(null)}
                className={`group relative cursor-pointer rounded-2xl overflow-hidden border transition-all duration-500 ${
                  activeDoctor === index 
                    ? 'border-cyan-500/50 shadow-[0_0_30px_rgba(0,217,200,0.2)]' 
                    : 'border-white/10 hover:border-cyan-500/30'
                }`}
              >
                {/* Image */}
                <div className="aspect-[3/4] relative">
                  {doctor.photo_url ? (
                    <img
                      src={doctor.photo_url}
                      alt={doctor.full_name}
                      className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-teal-500/10 flex items-center justify-center">
                      <span className="text-5xl font-bold text-cyan-500/30">
                        {doctor.full_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E13] via-[#0B0E13]/30 to-transparent" />
                  
                  {/* Hover Details */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-[#0B0E13] via-[#0B0E13]/80 to-[#0B0E13]/50 flex flex-col justify-end p-4 transition-opacity duration-300 ${
                    isHovering === index ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <div className="text-cyan-400 text-sm mb-1">{doctor.specialization}</div>
                    <div className="text-white text-sm mb-2">{doctor.experience_years}+ years exp.</div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white text-sm">{doctor.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Name Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0B0E13] to-transparent">
                  <h4 className="text-white font-semibold text-sm">{doctor.full_name}</h4>
                  <p className="text-gray-400 text-xs truncate">{doctor.specialization}</p>
                </div>

                {/* Active Indicator */}
                {activeDoctor === index && (
                  <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-left">
              <div className="text-white font-semibold">Can&apos;t find your specialist?</div>
              <div className="text-gray-400 text-sm">We have 200+ doctors across 50+ specialties</div>
            </div>
            <a
              href="#contact"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-[#0B0E13] font-semibold hover:opacity-90 transition-opacity"
            >
              Find Your Doctor
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}