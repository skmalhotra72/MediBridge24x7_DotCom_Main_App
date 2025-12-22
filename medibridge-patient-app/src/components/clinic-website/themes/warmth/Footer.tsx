'use client';

import { Facebook, Instagram, Twitter, Youtube, ExternalLink, Heart } from 'lucide-react';
import type { ClinicWebsiteData } from '@/lib/clinic-website/types';

interface FooterProps {
  data: ClinicWebsiteData;
}

export default function Footer({ data }: FooterProps) {
  const { organization, profile } = data;
  const currentYear = new Date().getFullYear();
  
  // Use relative URL for patient portal (same domain)
  const patientPortalUrl = `/${organization.slug || 'demo-clinic'}`;

  const quickLinks = [
    { name: 'Home', href: '#' },
    { name: 'Doctors', href: '#doctors' },
    { name: 'Services', href: '#services' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'Contact', href: '#contact' },
    { name: 'Privacy Policy', href: '#' },
  ];

  const serviceLinks = [
    { name: 'Video Consultation', href: '#services' },
    { name: 'In-Clinic Visit', href: '#services' },
    { name: 'Diagnostic Tests', href: '#services' },
    { name: 'General Medicine', href: '#doctors' },
    { name: 'Cardiology', href: '#doctors' },
    { name: 'Dermatology', href: '#doctors' },
  ];

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: profile.social_links?.facebook || '#' },
    { name: 'Instagram', icon: Instagram, href: profile.social_links?.instagram || '#' },
    { name: 'Twitter', icon: Twitter, href: profile.social_links?.twitter || '#' },
    { name: 'YouTube', icon: Youtube, href: profile.social_links?.youtube || '#' },
  ];

  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">{organization.name.charAt(0)}</span>
              </div>
              <div>
                <span className="font-bold text-lg">{organization.name}</span>
                <p className="text-xs text-slate-400">Expert Care. Compassionate Service.</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              {profile.tagline || 'Your trusted healthcare partner providing quality medical care with 24/7 AI-powered post-consultation support.'}
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-800 hover:bg-purple-600 rounded-lg flex items-center justify-center transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Services</h4>
            <ul className="space-y-3">
              {serviceLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-6">Contact</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>{profile.address || '123 Health Street, Gurugram'}</li>
              <li>{profile.contact_phone || '+91 9876543210'}</li>
              <li>{profile.contact_email || `contact@${organization.slug || 'clinic'}.com`}</li>
            </ul>

            {/* Patient Portal Link */}
            <div className="mt-6">
              <a
                href={patientPortalUrl}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Patient Portal
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              © {currentYear} {organization.name}. All rights reserved.
            </p>
            
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-500 flex items-center gap-1">
                Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for our patients
              </span>
              <span className="text-slate-700">|</span>
              <span className="text-purple-400">
                Powered by MediBridge24x7
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
