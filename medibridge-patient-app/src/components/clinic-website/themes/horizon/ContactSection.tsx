'use client';

import { useState } from 'react';
import { 
  Phone, Mail, MapPin, Clock, Send, MessageSquare, 
  Globe, Plane, CheckCircle, AlertCircle, Calendar,
  User, FileText, ArrowRight
} from 'lucide-react';
import type { ClinicWebsiteData } from '@/lib/clinic-website/types';

interface ContactSectionProps {
  data: ClinicWebsiteData;
}

export default function ContactSection({ data }: ContactSectionProps) {
  const { organization, profile } = data;
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    department: '',
    appointmentType: 'in-person',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setFormStatus('success');
    setTimeout(() => {
      setFormStatus('idle');
      setFormData({ name: '', email: '', phone: '', country: '', department: '', appointmentType: 'in-person', message: '' });
    }, 3000);
  };

  const departments = [
    'Robotic Surgery',
    'AI Diagnostics',
    'Cardiac Sciences',
    'Cancer Center',
    'Neurosciences',
    'Organ Transplant',
    'Emergency Care',
    'International Services',
    'Executive Health',
    'Orthopedics',
    'General Medicine',
    'Other',
  ];

  return (
    <section id="contact" className="relative py-24 overflow-hidden bg-gradient-to-b from-[#0B0E13] to-[#080a0e]">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[180px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">Book Your Visit</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            Start Your
            <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent"> Healing Journey</span>
          </h2>
          
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Ready to experience world-class healthcare? Our team responds within 30 minutes. 
            For emergencies, call our 24/7 hotline immediately.
          </p>
        </div>

        {/* Emergency Banner */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500/20 to-red-500/10 border border-red-500/30 p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-[60px]" />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">24/7 Emergency Services</h3>
                  <p className="text-gray-400 text-sm">Immediate medical assistance available round the clock</p>
                </div>
              </div>
              <a 
                href="tel:+911140009999"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-red-500 text-white font-bold text-lg hover:bg-red-600 transition-colors shadow-[0_0_30px_rgba(239,68,68,0.4)]"
              >
                <Phone className="w-6 h-6" />
                +91-11-4000-9999
              </a>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Contact Form - 3 columns */}
          <div className="lg:col-span-3">
            <div className="relative rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-[80px]" />

              <div className="relative">
                <h3 className="text-2xl font-semibold text-white mb-2">Request an Appointment</h3>
                <p className="text-gray-400 mb-8">Fill out the form below and we&apos;ll get back to you within 30 minutes.</p>

                {formStatus === 'success' ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-green-400" />
                    </div>
                    <h4 className="text-2xl font-semibold text-white mb-2">Request Received!</h4>
                    <p className="text-gray-400">Our team will contact you within 30 minutes during working hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Row 1: Name & Email */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                            placeholder="Your full name"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                            placeholder="you@email.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Phone & Country */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                            placeholder="+91 XXXXX XXXXX"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="text"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                            placeholder="Your country"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Department / Service</label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                      >
                        <option value="" className="bg-[#121721]">Select a department</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept} className="bg-[#121721]">{dept}</option>
                        ))}
                      </select>
                    </div>

                    {/* Appointment Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Appointment Type</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['in-person', 'video', 'second-opinion'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData({ ...formData, appointmentType: type })}
                            className={`p-4 rounded-xl border text-sm font-medium transition-all ${
                              formData.appointmentType === type
                                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            {type === 'in-person' && '🏥 In-Person'}
                            {type === 'video' && '📹 Video Call'}
                            {type === 'second-opinion' && '📋 Second Opinion'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Your Message</label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                        <textarea
                          rows={4}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all resize-none"
                          placeholder="Tell us about your healthcare needs, symptoms, or any specific requirements..."
                        />
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={formStatus === 'submitting'}
                      className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-lg font-semibold
                        bg-gradient-to-r from-cyan-500 to-teal-500 text-[#0B0E13]
                        hover:from-cyan-400 hover:to-teal-400 
                        shadow-[0_0_30px_rgba(0,217,200,0.3)] hover:shadow-[0_0_50px_rgba(0,217,200,0.5)]
                        transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {formStatus === 'submitting' ? (
                        <>
                          <div className="w-5 h-5 border-2 border-[#0B0E13]/30 border-t-[#0B0E13] rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Submit Request
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Contact Info - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Contact Cards */}
            <div className="grid gap-4">
              <a href={`tel:${profile.contact_phone}`} className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                    <Phone className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">General Enquiry</div>
                    <div className="text-white font-semibold text-lg">{profile.contact_phone || '+91-11-4000-4000'}</div>
                  </div>
                </div>
              </a>

              <a href={`mailto:${profile.contact_email}`} className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-teal-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/20 flex items-center justify-center group-hover:bg-teal-500/30 transition-colors">
                    <Mail className="w-6 h-6 text-teal-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Email Us</div>
                    <div className="text-white font-semibold">{profile.contact_email || 'care@citygeneralhospital.com'}</div>
                  </div>
                </div>
              </a>

              <a href={`https://wa.me/${profile.social_links?.whatsapp?.replace(/[^0-9]/g, '')}`} className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-green-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                    <MessageSquare className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">WhatsApp</div>
                    <div className="text-white font-semibold">Chat Instantly</div>
                  </div>
                </div>
              </a>

              <a href="tel:+911140004001" className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                    <Plane className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">International Patients</div>
                    <div className="text-white font-semibold">+91-11-4000-4001</div>
                  </div>
                </div>
              </a>
            </div>

            {/* Location */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Location</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {profile.address || 'City General Hospital, Sector 44, Institutional Area, Gurugram, Haryana 122003, India'}
                  </p>
                  <a 
                    href={profile.google_maps_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-cyan-400 text-sm mt-3 hover:text-cyan-300 transition-colors"
                  >
                    Get Directions
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Working Hours */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-3">Working Hours</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">OPD Timings</span>
                      <span className="text-white">8:00 AM - 8:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Emergency</span>
                      <span className="text-green-400 font-medium">24/7 Available</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pharmacy</span>
                      <span className="text-green-400 font-medium">24/7 Available</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Diagnostics</span>
                      <span className="text-white">6:00 AM - 10:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}