'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Phone, MessageSquare, LayoutDashboard } from 'lucide-react';
import type { ClinicWebsiteData } from '@/lib/clinic-website/types';
import HeroSection from './HeroSection';
import MediBridgeBanner from './MediBridgeBanner';
import DoctorSection from './DoctorSection';
import ServicesSection from './ServicesSection';
import MediBridgeFeaturesSection from './MediBridgeFeaturesSection';
import TestimonialsSection from './TestimonialsSection';
import ContactSection from './ContactSection';
import Footer from './Footer';
import WhatsAppButton from '../../shared/WhatsAppButton';
import { ClinicJsonLdScript } from '../../shared/SEOHead';

interface WarmthTemplateProps {
  data: ClinicWebsiteData;
}

export default function WarmthTemplate({ data }: WarmthTemplateProps) {
  const { organization, profile } = data;
  const whatsappNumber = profile.social_links?.whatsapp || profile.contact_phone;
  
  // Use relative URL for patient portal (same domain)
  const patientPortalUrl = `/${organization.slug || 'demo-clinic'}`;

  return (
    <div className="min-h-screen bg-white">
      <ClinicJsonLdScript data={data} />
      <Header data={data} patientPortalUrl={patientPortalUrl} />
      <main>
        <HeroSection data={data} />
        <MediBridgeBanner data={data} />
        <DoctorSection data={data} />
        <ServicesSection data={data} />
        <MediBridgeFeaturesSection data={data} />
        <TestimonialsSection data={data} />
        <ContactSection data={data} />
      </main>
      <Footer data={data} />
      {whatsappNumber && <WhatsAppButton phoneNumber={whatsappNumber} />}
    </div>
  );
}

interface HeaderProps {
  data: ClinicWebsiteData;
  patientPortalUrl: string;
}

function Header({ data, patientPortalUrl }: HeaderProps) {
  const { organization, profile } = data;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Clinic Portal Login URL (redirects to portal after login)
  const clinicPortalUrl = 'http://localhost:5173/login';
  
  const navLinks = [
    { name: 'Our Doctors', href: '#doctors' },
    { name: 'Services', href: '#services' },
    { name: 'General Care', href: '#medibridge' },
    { name: 'Reviews', href: '#testimonials' },
    { name: 'Website Admin', href: `/${organization.slug}/auth?redirect=admin` },
  ];

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white shadow-lg' 
          : 'bg-slate-900/80 backdrop-blur-md'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="#" className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                isScrolled 
                  ? 'bg-gradient-to-br from-purple-500 to-violet-600' 
                  : 'bg-white/20'
              }`}>
                <span className="text-white font-bold">
                  {organization.name.charAt(0)}
                </span>
              </div>
              <div>
                <span className={`font-bold block ${isScrolled ? 'text-gray-900' : 'text-white'}`}>
                  {organization.name}
                </span>
                <span className={`text-xs ${isScrolled ? 'text-purple-600' : 'text-purple-300'}`}>
                  Powered by MediBridge
                </span>
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isScrolled 
                      ? 'text-gray-700 hover:text-purple-600' 
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {link.name}
                </a>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              {/* Clinic Portal - Links to MediBridge Login Page */}
              <a
                href={clinicPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isScrolled
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Clinic Portal
              </a>

              {/* Patient Portal - Uses relative URL */}
              <a
                href={patientPortalUrl}
                className={`hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isScrolled
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Patient Portal
              </a>

              {/* Call Now */}
              {profile.contact_phone && (
                <a
                  href={`tel:${profile.contact_phone}`}
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">Call Now</span>
                </a>
              )}

              {/* Mobile Menu */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`lg:hidden p-2 rounded-lg ${
                  isScrolled ? 'text-gray-900' : 'text-white'
                }`}
                aria-label="Menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-t shadow-lg">
            <nav className="container mx-auto px-4 py-4">
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-3 px-4 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg font-medium"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t space-y-3">
                {/* Clinic Portal - Mobile */}
                <a
                  href={clinicPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-3 rounded-lg font-medium"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Clinic Portal (Staff Login)
                </a>
                {/* Patient Portal - Mobile */}
                <a
                  href={patientPortalUrl}
                  className="w-full inline-flex items-center justify-center gap-2 bg-purple-100 text-purple-700 px-4 py-3 rounded-lg font-medium"
                >
                  <MessageSquare className="w-5 h-5" />
                  Patient Portal
                </a>
                {profile.contact_phone && (
                  <a
                    href={`tel:${profile.contact_phone}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg font-medium"
                  >
                    <Phone className="w-5 h-5" />
                    Call Now: {profile.contact_phone}
                  </a>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

export { WARMTH_THEME } from '@/lib/clinic-website/types';