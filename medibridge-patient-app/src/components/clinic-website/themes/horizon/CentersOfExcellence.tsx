'use client';

import { useState } from 'react';
import { 
  Bot, Brain, Heart, Ribbon, Zap, Leaf, Ambulance, Globe,
  ArrowRight, Users, Award, Clock, ChevronRight
} from 'lucide-react';
import type { ClinicWebsiteData } from '@/lib/clinic-website/types';

interface CentersOfExcellenceProps {
  data: ClinicWebsiteData;
}

export default function CentersOfExcellence({ data }: CentersOfExcellenceProps) {
  const [activeCenter, setActiveCenter] = useState(0);

  const centers = [
    {
      id: 0,
      name: 'Robotic Surgery Center',
      icon: Bot,
      image: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1200&q=80',
      heroImage: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1920&q=80',
      color: 'cyan',
      tagline: 'Precision Beyond Human Limits',
      description: 'Home to India\'s largest robotic surgery program with da Vinci Xi systems performing complex procedures through incisions smaller than a coin.',
      stats: [
        { value: '7,500+', label: 'Robotic Surgeries' },
        { value: '99.2%', label: 'Success Rate' },
        { value: '47%', label: 'Faster Recovery' },
      ],
      procedures: ['Prostatectomy', 'Hysterectomy', 'Cardiac Bypass', 'Kidney Surgery', 'Colorectal', 'Bariatric'],
      doctors: 15,
    },
    {
      id: 1,
      name: 'AI Diagnostics Hub',
      icon: Brain,
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80',
      heroImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&q=80',
      color: 'purple',
      tagline: 'Intelligence That Saves Lives',
      description: 'Our AI-powered diagnostic platform analyzes medical images with superhuman accuracy, detecting cancers and abnormalities 40% earlier than traditional methods.',
      stats: [
        { value: '99.7%', label: 'Accuracy' },
        { value: '40%', label: 'Earlier Detection' },
        { value: '500+', label: 'Conditions' },
      ],
      procedures: ['AI Radiology', 'Digital Pathology', 'Predictive Analytics', 'Genomic Analysis', 'Cancer Screening', 'Cardiac Risk'],
      doctors: 20,
    },
    {
      id: 2,
      name: 'Cardiac Sciences Institute',
      icon: Heart,
      image: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=1200&q=80',
      heroImage: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=1920&q=80',
      color: 'rose',
      tagline: 'Every Heartbeat Matters',
      description: 'From robotic cardiac surgery to complex heart transplants, our cardiac team has saved over 25,000 lives with a door-to-balloon time of just 45 minutes.',
      stats: [
        { value: '25,000+', label: 'Lives Saved' },
        { value: '45 min', label: 'Door-to-Balloon' },
        { value: '98.5%', label: 'Success Rate' },
      ],
      procedures: ['Robotic CABG', 'Valve Repair', 'Heart Transplant', 'TAVR', 'Angioplasty', 'Ablation'],
      doctors: 35,
    },
    {
      id: 3,
      name: 'Cancer Center of Excellence',
      icon: Ribbon,
      image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1200&q=80',
      heroImage: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=1920&q=80',
      color: 'amber',
      tagline: 'Hope. Treatment. Cure.',
      description: 'Comprehensive cancer care combining robotic surgery, precision radiation, immunotherapy, and personalized treatment protocols with 5-year survival rates exceeding global benchmarks.',
      stats: [
        { value: '15,000+', label: 'Patients Treated' },
        { value: '23%', label: 'Better Survival' },
        { value: '50+', label: 'Clinical Trials' },
      ],
      procedures: ['Robotic Oncology', 'Immunotherapy', 'Proton Therapy', 'Bone Marrow Transplant', 'HIPEC', 'CyberKnife'],
      doctors: 40,
    },
    {
      id: 4,
      name: 'Neurosciences Center',
      icon: Zap,
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&q=80',
      heroImage: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=1920&q=80',
      color: 'teal',
      tagline: 'Unlocking the Mind\'s Potential',
      description: 'Pioneering awake brain surgery, deep brain stimulation, and AI-guided neurosurgery. India\'s first center for brain-computer interface research.',
      stats: [
        { value: '5,000+', label: 'Neurosurgeries' },
        { value: '1st', label: 'In India - BCI' },
        { value: '99%', label: 'Precision Rate' },
      ],
      procedures: ['Awake Surgery', 'Deep Brain Stimulation', 'Spine Robotics', 'Epilepsy Surgery', 'Stroke Treatment', 'Gamma Knife'],
      doctors: 25,
    },
    {
      id: 5,
      name: 'Organ Transplant Program',
      icon: Leaf,
      image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=1200&q=80',
      heroImage: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=1920&q=80',
      color: 'green',
      tagline: 'The Gift of Life',
      description: 'One of Asia\'s largest transplant programs with over 2,500 successful transplants. Our living donor program ensures shorter wait times and better outcomes.',
      stats: [
        { value: '2,500+', label: 'Transplants' },
        { value: '96%', label: 'Success Rate' },
        { value: '24/7', label: 'Retrieval Team' },
      ],
      procedures: ['Liver Transplant', 'Kidney Transplant', 'Heart Transplant', 'Lung Transplant', 'Pediatric Transplant', 'Multi-Organ'],
      doctors: 30,
    },
    {
      id: 6,
      name: 'Emergency & Trauma',
      icon: Ambulance,
      image: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=1200&q=80',
      heroImage: 'https://images.unsplash.com/photo-1612277795421-9bc7706a4a34?w=1920&q=80',
      color: 'red',
      tagline: 'Every Second Counts',
      description: 'Level 1 Trauma Center with air ambulance, 12-minute average response time, and the fastest door-to-surgery capabilities in the region.',
      stats: [
        { value: '12 min', label: 'Response Time' },
        { value: '50,000+', label: 'Emergencies/Year' },
        { value: '24/7', label: 'Specialists' },
      ],
      procedures: ['Trauma Surgery', 'Stroke Response', 'Cardiac Emergency', 'Burn Care', 'Polytrauma', 'Air Ambulance'],
      doctors: 45,
    },
    {
      id: 7,
      name: 'International Patient Services',
      icon: Globe,
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80',
      heroImage: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920&q=80',
      color: 'blue',
      tagline: 'World-Class Care, Indian Hospitality',
      description: 'Dedicated concierge services for patients from 85+ countries. From visa assistance to luxury accommodation, we handle everything.',
      stats: [
        { value: '85+', label: 'Countries' },
        { value: '15+', label: 'Languages' },
        { value: 'VIP', label: 'Concierge' },
      ],
      procedures: ['Medical Visa', 'Airport Transfer', 'Interpreter Services', 'Accommodation', 'Telemedicine', 'Post-Care'],
      doctors: 10,
    },
  ];

  const colorClasses: Record<string, { gradient: string; glow: string; text: string; bg: string; border: string }> = {
    cyan: { gradient: 'from-cyan-500 to-cyan-600', glow: 'shadow-[0_0_60px_rgba(0,217,200,0.3)]', text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
    purple: { gradient: 'from-purple-500 to-purple-600', glow: 'shadow-[0_0_60px_rgba(168,85,247,0.3)]', text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    rose: { gradient: 'from-rose-500 to-rose-600', glow: 'shadow-[0_0_60px_rgba(244,63,94,0.3)]', text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
    amber: { gradient: 'from-amber-500 to-amber-600', glow: 'shadow-[0_0_60px_rgba(245,158,11,0.3)]', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    teal: { gradient: 'from-teal-500 to-teal-600', glow: 'shadow-[0_0_60px_rgba(20,184,166,0.3)]', text: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30' },
    green: { gradient: 'from-green-500 to-green-600', glow: 'shadow-[0_0_60px_rgba(34,197,94,0.3)]', text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    red: { gradient: 'from-red-500 to-red-600', glow: 'shadow-[0_0_60px_rgba(239,68,68,0.3)]', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    blue: { gradient: 'from-blue-500 to-blue-600', glow: 'shadow-[0_0_60px_rgba(59,130,246,0.3)]', text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  };

  const current = centers[activeCenter];
  const colors = colorClasses[current.color];

  return (
    <section id="services" className="relative py-24 overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 transition-opacity duration-1000">
          <img
            src={current.heroImage}
            alt={current.name}
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0E13] via-[#0B0E13]/90 to-[#0B0E13]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <Award className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">Centers of Excellence</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            Specialized Care,
            <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent"> Exceptional Outcomes</span>
          </h2>
        </div>

        {/* Centers Navigation - Scrollable on mobile */}
        <div className="mb-12 -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-3 min-w-max pb-4">
            {centers.map((center, index) => {
              const centerColors = colorClasses[center.color];
              return (
                <button
                  key={center.id}
                  onClick={() => setActiveCenter(index)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    activeCenter === index
                      ? `bg-gradient-to-r ${centerColors.gradient} text-white ${centerColors.glow}`
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <center.icon className="w-5 h-5" />
                  {center.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left - Large Image Card */}
          <div className="relative group">
            <div className={`absolute -inset-1 bg-gradient-to-r ${colors.gradient} rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity`} />
            
            <div className="relative rounded-3xl overflow-hidden border border-white/10">
              <div className="aspect-[4/3]">
                <img
                  src={current.image}
                  alt={current.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E13] via-[#0B0E13]/50 to-transparent" />
              </div>

              {/* Overlay Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${colors.bg} ${colors.border} border mb-4`}>
                  <current.icon className={`w-4 h-4 ${colors.text}`} />
                  <span className={`text-sm font-medium ${colors.text}`}>{current.name}</span>
                </div>
                
                <h3 className="text-3xl font-bold text-white mb-2">{current.tagline}</h3>
                
                {/* Stats Row */}
                <div className="flex items-center gap-6 mt-6">
                  {current.stats.map((stat, index) => (
                    <div key={index}>
                      <div className={`text-2xl font-bold ${colors.text}`}>{stat.value}</div>
                      <div className="text-xs text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctors Badge */}
              <div className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <Users className="w-4 h-4 text-white" />
                <span className="text-white font-medium">{current.doctors} Specialists</span>
              </div>
            </div>
          </div>

          {/* Right - Details */}
          <div className="space-y-8">
            <div>
              <p className="text-gray-300 text-lg leading-relaxed">{current.description}</p>
            </div>

            {/* Procedures Grid */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Specialties & Procedures</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {current.procedures.map((procedure, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-xl ${colors.bg} border ${colors.border} hover:scale-105 transition-transform cursor-pointer`}
                  >
                    <span className="text-white text-sm font-medium">{procedure}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-4">
              <a
                href="#contact"
                className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold bg-gradient-to-r ${colors.gradient} text-white ${colors.glow} hover:opacity-90 transition-all`}
              >
                Book Consultation
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#doctors"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold bg-white/5 text-white border border-white/20 hover:bg-white/10 transition-colors"
              >
                <Users className="w-5 h-5" />
                Meet Our Doctors
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-gray-400">JCI Accredited</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-400">24/7 Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* All Centers Quick Links */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
          {centers.slice(0, 8).map((center, index) => {
            const centerColors = colorClasses[center.color];
            return (
              <button
                key={center.id}
                onClick={() => setActiveCenter(index)}
                className={`group relative p-6 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-all overflow-hidden ${
                  activeCenter === index ? `border-2 ${centerColors.border}` : ''
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${centerColors.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <center.icon className={`w-8 h-8 ${centerColors.text} mb-3`} />
                <h4 className="text-white font-semibold mb-1">{center.name.split(' ')[0]}</h4>
                <p className="text-xs text-gray-400">{center.stats[0].value} {center.stats[0].label}</p>
                <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}