'use client';

import { useState, useEffect } from 'react';
import { 
  Menu, X, Phone, MessageSquare, LayoutDashboard, Globe, 
  ChevronDown, Search, Calendar, Heart
} from 'lucide-react';
import type { ClinicWebsiteData } from '@/lib/clinic-website/types';

// Import all sections
import HeroSection from './HeroSection';
import HospitalGallery from './HospitalGallery';
import TechnologyShowcase from './TechnologyShowcase';
import CentersOfExcellence from './CentersOfExcellence';
import DoctorShowcase from './DoctorShowcase';
import VideoTestimonials from './VideoTestimonials';
import InternationalServices from './InternationalServices';
import ContactSection from './ContactSection';
import Footer from './Footer';

// Shared components
import WhatsAppButton from '../../shared/WhatsAppButton';
import { ClinicJsonLdScript } from '../../shared/SEOHead';

interface HorizonTemplateProps {
  data: ClinicWebsiteData;
}

export default function HorizonTemplate({ data }: HorizonTemplateProps) {
  const { organization, profile } = data;
  const whatsappNumber = profile.social_links?.whatsapp || profile.contact_phone;
  const patientPortalUrl = `/${organization.slug || 'city-general-hospital'}`;

  return (
    <div className="min-h-screen bg-[#0B0E13] text-white">
      <ClinicJsonLdScript data={data} />
      <Header data={data} patientPortalUrl={patientPortalUrl} />
      
      <main>
        {/* Pass patientPortalUrl to HeroSection for Post Consultation Support button */}
        <HeroSection data={data} patientPortalUrl={patientPortalUrl} />
        <HospitalGallery />
        <TechnologyShowcase />
        <CentersOfExcellence data={data} />
        <DoctorShowcase data={data} />
        <VideoTestimonials data={data} />
        <InternationalServices />
        <ContactSection data={data} />
      </main>
      
      <Footer data={data} />
      <WhatsAppButton clinicName={data.clinicProfile?.clinic_name || data.organization.name} />
    </div>
  );
}

// Premium Header Component
interface HeaderProps {
  data: ClinicWebsiteData;
  patientPortalUrl: string;
}

function Header({ data, patientPortalUrl }: HeaderProps) {
  const { organization, profile } = data;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Staff Portal URL - Dynamic based on environment
  const clinicPortalUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5173/login'
    : 'https://admin.medibridge24x7.com/login';

  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Facilities', href: '#facilities' },
    { name: 'Technology', href: '#technology' },
    { name: 'Centers', href: '#services' },
    { name: 'Doctors', href: '#doctors' },
    { name: 'Stories', href: '#testimonials' },
    { name: 'International', href: '#international' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <>
      {/* Top Announcement Bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? '-translate-y-full' : 'translate-y-0'
      }`}>
        <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-center py-2 px-4">
          <p className="text-sm">
            <span className="font-semibold">🏥 24/7 Emergency:</span> +91-11-4000-9999 | 
            <span className="font-semibold"> International:</span> +91-11-4000-4001
          </p>
        </div>
      </div>

      {/* Main Header */}
      <header className={`fixed left-0 right-0 z-40 transition-all duration-500 ${
        isScrolled 
          ? 'top-0 bg-[#0B0E13]/95 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-b border-white/5' 
          : 'top-10 bg-transparent'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <a href="#" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-[0_0_30px_rgba(0,217,200,0.4)] group-hover:shadow-[0_0_40px_rgba(0,217,200,0.6)] transition-shadow">
                  <span className="text-[#0B0E13] font-bold text-xl">
                    {organization.name.charAt(0)}
                  </span>
                </div>
                {/* Animated ring */}
                <div className="absolute inset-0 rounded-xl border-2 border-cyan-400/30 animate-ping" style={{ animationDuration: '3s' }} />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-xl text-white block leading-tight">
                  {organization.name}
                </span>
                <span className="text-[10px] text-cyan-400 tracking-widest uppercase">
                  Advanced Healthcare • AI Powered
                </span>
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="relative px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors group"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-teal-400 group-hover:w-3/4 transition-all duration-300" />
                </a>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search - Hidden on mobile */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="hidden md:flex w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Language - Hidden on mobile */}
              <button className="hidden md:flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <Globe className="w-4 h-4" />
                <span className="text-sm">EN</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* Staff Portal - Hidden on mobile and tablet */}
              <a
                href={clinicPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium 
                  bg-teal-500/10 text-teal-400 border border-teal-500/30
                  hover:bg-teal-500/20 hover:border-teal-500/50 transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                Staff Portal
              </a>

              {/* Patient Portal - VISIBLE ON ALL SCREENS (Primary CTA) */}
              <a
                href={patientPortalUrl}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium
                  bg-cyan-500/10 text-cyan-400 border border-cyan-500/30
                  hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden xs:inline">Patient</span> Portal
              </a>

              {/* Book Now - Hidden on small mobile, visible on larger screens */}
              <a
                href="#contact"
                className="hidden sm:inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-sm font-semibold
                  bg-gradient-to-r from-cyan-500 to-teal-500 text-[#0B0E13]
                  shadow-[0_0_20px_rgba(0,217,200,0.3)] hover:shadow-[0_0_30px_rgba(0,217,200,0.5)]
                  transition-all transform hover:scale-105"
              >
                <Calendar className="w-4 h-4" />
                Book Now
              </a>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="xl:hidden p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Search Overlay */}
        {showSearch && (
          <div className="absolute top-full left-0 right-0 bg-[#0B0E13]/95 backdrop-blur-xl border-b border-white/10 p-4">
            <div className="container mx-auto">
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search doctors, treatments, services..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-cyan-500/50 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        <div className={`xl:hidden transition-all duration-300 overflow-hidden ${
          isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="bg-[#0B0E13]/95 backdrop-blur-xl border-t border-white/5">
            <nav className="container mx-auto px-4 py-6">
              <ul className="space-y-1">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-3 px-4 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                {/* Staff Portal - Mobile */}
                <a
                  href={clinicPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-teal-500/10 text-teal-400 border border-teal-500/30 px-4 py-3 rounded-xl font-medium"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Staff Portal
                </a>
                {/* Patient Portal - Mobile */}
                <a
                  href={patientPortalUrl}
                  className="w-full flex items-center justify-center gap-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-4 py-3 rounded-xl font-medium"
                >
                  <MessageSquare className="w-5 h-5" />
                  Patient Portal
                </a>
                <a
                  href="#contact"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-[#0B0E13] px-4 py-3 rounded-xl font-semibold"
                >
                  <Calendar className="w-5 h-5" />
                  Book Appointment
                </a>
              </div>
              
              {/* Emergency Contact */}
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm font-medium">24/7 Emergency</p>
                <a href="tel:+911140009999" className="text-white text-xl font-bold">
                  +91-11-4000-9999
                </a>
              </div>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}