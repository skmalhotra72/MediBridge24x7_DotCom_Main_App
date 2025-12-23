'use client';

import { useEffect, useState } from 'react';
import { 
  Calendar, Phone, MessageSquare, Shield, Award, Users, Activity, Zap, 
  Star, MapPin, Clock, ArrowRight, Sparkles,
  Heart, Brain, Stethoscope
} from 'lucide-react';
import type { ClinicWebsiteData } from '@/lib/clinic-website/types';

interface HeroSectionProps {
  data: ClinicWebsiteData;
  patientPortalUrl?: string;
}

export default function HeroSection({ data, patientPortalUrl }: HeroSectionProps) {
  const { organization, doctors } = data;
  const [currentSlide, setCurrentSlide] = useState(0);

  // Default patient portal URL if not provided
  const portalUrl = patientPortalUrl || `/${organization.slug || 'city-general-hospital'}`;

  // Hero slides with stunning hospital imagery
  const heroSlides = [
    {
      image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=1920&q=80',
      title: 'Where Precision Medicine',
      subtitle: 'Meets Human Care',
      description: 'India\'s most advanced robotic surgery center with AI-powered diagnostics',
    },
    {
      image: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1920&q=80',
      title: 'Robotic Surgery',
      subtitle: 'Excellence',
      description: '7,500+ successful robotic procedures with 99.2% success rate',
    },
    {
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1920&q=80',
      title: 'World-Class',
      subtitle: 'Specialists',
      description: '200+ internationally trained doctors from 15+ countries',
    },
  ];

  // Auto-rotate slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const totalDoctors = doctors?.length || 200;
  const avgExperience = doctors?.length 
    ? Math.round(doctors.reduce((sum, d) => sum + (d.experience_years || 0), 0) / doctors.length)
    : 22;

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Video/Image Background with Parallax */}
      <div className="absolute inset-0">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover transform scale-105 hover:scale-110 transition-transform duration-[20000ms]"
            />
          </div>
        ))}
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E13]/95 via-[#0B0E13]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E13] via-transparent to-[#0B0E13]/50" />
        
        {/* Animated Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,217,200,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,200,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Floating Medical Icons - 3D Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-[15%] animate-bounce" style={{ animationDuration: '6s' }}>
          <div className="w-20 h-20 rounded-2xl bg-cyan-500/20 backdrop-blur-xl border border-cyan-500/30 flex items-center justify-center rotate-12 shadow-[0_0_40px_rgba(0,217,200,0.3)]">
            <Heart className="w-10 h-10 text-cyan-400" />
          </div>
        </div>
        <div className="absolute top-1/3 right-[8%] animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 backdrop-blur-xl border border-teal-500/30 flex items-center justify-center -rotate-6 shadow-[0_0_30px_rgba(20,184,166,0.3)]">
            <Brain className="w-8 h-8 text-teal-400" />
          </div>
        </div>
        <div className="absolute top-1/2 right-[20%] animate-bounce" style={{ animationDuration: '4s', animationDelay: '2s' }}>
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 backdrop-blur-xl border border-purple-500/30 flex items-center justify-center rotate-6 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
            <Stethoscope className="w-7 h-7 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="container mx-auto px-4 pt-32 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="max-w-2xl">
              {/* Live Badge */}
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 mb-8 backdrop-blur-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-cyan-400 text-sm font-medium">Now Open 24/7 — Emergency Services Active</span>
              </div>

              {/* Dynamic Headlines */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.1] mb-6">
                <span className="text-white block">{heroSlides[currentSlide].title}</span>
                <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  {heroSlides[currentSlide].subtitle}
                </span>
              </h1>

              {/* Description */}
              <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-xl">
                {heroSlides[currentSlide].description}
              </p>

              {/* Trust Indicators Row */}
              <div className="flex flex-wrap gap-6 mb-10">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Award className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">JCI Accredited</div>
                    <div className="text-xs text-gray-400">International Standard</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Star className="w-5 h-5 text-cyan-400 fill-cyan-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">4.9/5 Rating</div>
                    <div className="text-xs text-gray-400">50,000+ Reviews</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">24/7 Care</div>
                    <div className="text-xs text-gray-400">Always Available</div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-12">
                <a
                  href="#contact"
                  className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold overflow-hidden bg-gradient-to-r from-cyan-500 to-teal-500 text-[#0B0E13] shadow-[0_0_30px_rgba(0,217,200,0.4)] hover:shadow-[0_0_50px_rgba(0,217,200,0.6)] transition-all duration-300"
                >
                  <Calendar className="w-5 h-5" />
                  Book Appointment
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>

                {/* Post Consultation Support - Links to Patient Portal */}
                <a
                  href={portalUrl}
                  className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold
                    bg-white/5 backdrop-blur-sm text-white border border-white/20
                    hover:bg-white/10 hover:border-cyan-500/50 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                  </div>
                  Post Consultation Support
                </a>
              </div>

              {/* Emergency Banner */}
              <div className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 font-medium">24/7 Emergency:</span>
                <a href="tel:+911140009999" className="text-white font-bold text-lg hover:text-red-400 transition-colors">
                  +91-11-4000-9999
                </a>
              </div>
            </div>

            {/* Right Side - Stats Cards */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Main Stats Card */}
                <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-[0_0_60px_rgba(0,217,200,0.1)]">
                  {/* Glow effect */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/30 rounded-full blur-[80px]" />
                  <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-teal-500/30 rounded-full blur-[80px]" />
                  
                  <div className="relative">
                    <h3 className="text-xl font-semibold text-white mb-6">Why Choose Us</h3>
                    
                    <div className="space-y-6">
                      {/* Stat Item */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-[0_0_30px_rgba(0,217,200,0.4)]">
                          <Activity className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-white">50,000+</div>
                          <div className="text-gray-400">Successful Surgeries</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                          <Users className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-white">{totalDoctors}+</div>
                          <div className="text-gray-400">Expert Specialists</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                          <MapPin className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-white">85+</div>
                          <div className="text-gray-400">Countries Served</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                          <Zap className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-white">99.2%</div>
                          <div className="text-gray-400">Success Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -top-6 -right-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)] rotate-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-white" />
                    <span className="text-white font-bold">Newsweek Top 100</span>
                  </div>
                </div>

                {/* Floating Doctor Card */}
                <div className="absolute -bottom-6 -left-6 p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg -rotate-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face"
                      alt="Doctor"
                      className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500"
                    />
                    <div>
                      <div className="text-white font-medium text-sm">Dr. Vikram Sharma</div>
                      <div className="text-cyan-400 text-xs">Chief of Robotic Surgery</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all duration-500 ${
              index === currentSlide 
                ? 'w-12 bg-gradient-to-r from-cyan-400 to-teal-400' 
                : 'w-2 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 right-8 z-20 hidden md:flex flex-col items-center gap-2">
        <span className="text-gray-500 text-xs uppercase tracking-widest rotate-90 origin-center translate-y-8">Scroll</span>
        <div className="w-6 h-10 rounded-full border-2 border-gray-600 flex items-start justify-center p-1 mt-8">
          <div className="w-1.5 h-3 bg-cyan-400 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}