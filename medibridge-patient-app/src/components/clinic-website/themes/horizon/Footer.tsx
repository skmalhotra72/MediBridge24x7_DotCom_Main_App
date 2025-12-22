'use client';

import { 
  Phone, Mail, MapPin, Clock, Heart, Shield, Award, Globe,
  Facebook, Twitter, Instagram, Linkedin, Youtube, ArrowRight,
  Stethoscope, Brain, Ribbon, Zap, Building2
} from 'lucide-react';
import type { ClinicWebsiteData } from '@/lib/clinic-website/types';

interface FooterProps {
  data: ClinicWebsiteData;
}

export default function Footer({ data }: FooterProps) {
  const { organization, profile } = data;
  const currentYear = new Date().getFullYear();

  const specialties = [
    { name: 'Robotic Surgery', icon: '🤖' },
    { name: 'AI Diagnostics', icon: '🧠' },
    { name: 'Cardiac Sciences', icon: '❤️' },
    { name: 'Cancer Care', icon: '🎗️' },
    { name: 'Neurosciences', icon: '⚡' },
    { name: 'Organ Transplant', icon: '🌿' },
    { name: 'Orthopedics', icon: '🦴' },
    { name: 'Pediatrics', icon: '👶' },
  ];

  const quickLinks = [
    { name: 'About Us', href: '#about' },
    { name: 'Our Doctors', href: '#doctors' },
    { name: 'Facilities', href: '#facilities' },
    { name: 'Patient Stories', href: '#testimonials' },
    { name: 'International Services', href: '#international' },
    { name: 'Careers', href: '#careers' },
    { name: 'News & Media', href: '#news' },
    { name: 'Contact Us', href: '#contact' },
  ];

  const patientResources = [
    { name: 'Book Appointment', href: '#contact' },
    { name: 'Find a Doctor', href: '#doctors' },
    { name: 'Health Packages', href: '#packages' },
    { name: 'Insurance & TPA', href: '#insurance' },
    { name: 'Patient Portal', href: '#portal' },
    { name: 'Medical Records', href: '#records' },
    { name: 'Second Opinion', href: '#second-opinion' },
    { name: 'FAQs', href: '#faqs' },
  ];

  const accreditations = [
    { name: 'JCI', fullName: 'Joint Commission International' },
    { name: 'NABH', fullName: 'National Accreditation Board' },
    { name: 'NABL', fullName: 'National Accreditation Board for Testing' },
    { name: 'ISO', fullName: 'ISO 9001:2015 Certified' },
  ];

  return (
    <footer className="relative bg-[#050709] text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[200px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[180px]" />
      </div>

      {/* Newsletter Section */}
      <div className="relative border-b border-white/5">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Stay Updated with
              <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent"> Health Insights</span>
            </h3>
            <p className="text-gray-400 mb-8">
              Subscribe to our newsletter for health tips, medical breakthroughs, and hospital updates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
              />
              <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-[#0B0E13] font-semibold hover:from-cyan-400 hover:to-teal-400 transition-all shadow-[0_0_20px_rgba(0,217,200,0.3)]">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="relative container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column - Spans 2 on large */}
          <div className="col-span-2 lg:col-span-2">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-[0_0_30px_rgba(0,217,200,0.4)]">
                <span className="text-[#0B0E13] font-bold text-2xl">
                  {organization.name.charAt(0)}
                </span>
              </div>
              <div>
                <span className="font-bold text-xl text-white block">{organization.name}</span>
                <span className="text-xs text-cyan-400 tracking-wider uppercase">Advanced Healthcare</span>
              </div>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {profile.tagline || 'Where Precision Medicine Meets Human Care'} — India&apos;s most advanced 
              multi-specialty hospital featuring robotic surgery, AI diagnostics, and world-class specialists 
              serving patients from 85+ countries.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <a href={`tel:${profile.contact_phone}`} className="flex items-center gap-3 text-gray-400 hover:text-cyan-400 transition-colors">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{profile.contact_phone || '+91-11-4000-4000'}</span>
              </a>
              <a href={`mailto:${profile.contact_email}`} className="flex items-center gap-3 text-gray-400 hover:text-cyan-400 transition-colors">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{profile.contact_email || 'care@citygeneralhospital.com'}</span>
              </a>
              <div className="flex items-start gap-3 text-gray-400">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{profile.address || 'Sector 44, Gurugram, Haryana'}</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {[
                { icon: Facebook, href: profile.social_links?.facebook || '#', color: 'hover:bg-blue-500/20 hover:text-blue-400' },
                { icon: Twitter, href: profile.social_links?.twitter || '#', color: 'hover:bg-sky-500/20 hover:text-sky-400' },
                { icon: Instagram, href: profile.social_links?.instagram || '#', color: 'hover:bg-pink-500/20 hover:text-pink-400' },
                { icon: Linkedin, href: profile.social_links?.linkedin || '#', color: 'hover:bg-blue-600/20 hover:text-blue-400' },
                { icon: Youtube, href: profile.social_links?.youtube || '#', color: 'hover:bg-red-500/20 hover:text-red-400' },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 transition-all ${social.color}`}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm text-gray-400 hover:text-cyan-400 transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Specialties */}
          <div>
            <h4 className="font-semibold text-white mb-4">Specialties</h4>
            <ul className="space-y-2">
              {specialties.map((specialty, index) => (
                <li key={index}>
                  <a href="#services" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2">
                    <span>{specialty.icon}</span>
                    {specialty.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Patient Resources */}
          <div>
            <h4 className="font-semibold text-white mb-4">Patient Resources</h4>
            <ul className="space-y-2">
              {patientResources.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm text-gray-400 hover:text-cyan-400 transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Emergency & Hours */}
          <div>
            <h4 className="font-semibold text-white mb-4">Emergency</h4>
            
            {/* Emergency Box */}
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
              <div className="text-red-400 text-sm font-medium mb-1">24/7 Emergency</div>
              <a href="tel:+911140009999" className="text-white font-bold text-lg hover:text-red-400 transition-colors">
                +91-11-4000-9999
              </a>
            </div>

            {/* Working Hours */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span>OPD: 8 AM - 8 PM</span>
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span>Emergency: 24/7</span>
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span>Pharmacy: 24/7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Accreditations */}
        <div className="mt-16 pt-8 border-t border-white/5">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <span className="text-gray-500 text-sm">Accredited by:</span>
            {accreditations.map((acc, index) => (
              <div key={index} className="group relative">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <span className="text-white font-semibold">{acc.name}</span>
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 rounded-lg bg-white text-[#0B0E13] text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {acc.fullName}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-white/5">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-gray-500 text-sm text-center md:text-left">
              © {currentYear} {organization.name}. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Cookie Policy</a>
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Disclaimer</a>
            </div>

            {/* Powered By */}
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span>Powered by</span>
              <a 
                href="https://medibridge24x7.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
              >
                <Heart className="w-4 h-4 fill-cyan-400" />
                MediBridge24x7
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}