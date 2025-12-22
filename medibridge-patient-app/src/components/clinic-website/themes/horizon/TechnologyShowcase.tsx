'use client';

import { useState } from 'react';
import { Bot, Cpu, Scan, Microscope, Heart, Brain, Zap, ArrowRight, Play, CheckCircle } from 'lucide-react';

export default function TechnologyShowcase() {
  const [activeEquipment, setActiveEquipment] = useState(0);

  const equipment = [
    {
      id: 0,
      name: 'da Vinci Xi Surgical System',
      category: 'Robotic Surgery',
      image: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1200&q=80',
      icon: Bot,
      color: 'cyan',
      stats: [
        { label: 'Procedures', value: '7,500+' },
        { label: 'Success Rate', value: '99.2%' },
        { label: 'Recovery', value: '47% Faster' },
      ],
      features: [
        '3D HD visualization with 10x magnification',
        'Wristed instruments with 540° rotation',
        'Tremor filtration for precision',
        'Minimally invasive incisions',
      ],
      description: 'The da Vinci Xi represents the pinnacle of robotic-assisted surgery, enabling our surgeons to perform complex procedures with unprecedented precision through tiny incisions.',
    },
    {
      id: 1,
      name: '3 Tesla MRI Scanner',
      category: 'Diagnostic Imaging',
      image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&q=80',
      icon: Scan,
      color: 'purple',
      stats: [
        { label: 'Field Strength', value: '3T' },
        { label: 'Scan Time', value: '50% Less' },
        { label: 'Resolution', value: 'Ultra HD' },
      ],
      features: [
        'Sub-millimeter image resolution',
        'Advanced neuroimaging capabilities',
        'Cardiac MRI with motion correction',
        'AI-enhanced image processing',
      ],
      description: 'Our state-of-the-art 3T MRI delivers exceptional image clarity for accurate diagnosis, with patient comfort features including wider bore and quieter operation.',
    },
    {
      id: 2,
      name: 'AI Diagnostic Platform',
      category: 'Artificial Intelligence',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80',
      icon: Brain,
      color: 'teal',
      stats: [
        { label: 'Accuracy', value: '99.7%' },
        { label: 'Detection', value: '40% Faster' },
        { label: 'Conditions', value: '500+' },
      ],
      features: [
        'Real-time pathology analysis',
        'Early cancer detection algorithms',
        'Predictive health analytics',
        'Integration with all imaging systems',
      ],
      description: 'Our proprietary AI platform augments physician expertise, analyzing medical images and data to detect abnormalities that might escape the human eye.',
    },
    {
      id: 3,
      name: 'Hybrid OR Suite',
      category: 'Operating Rooms',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&q=80',
      icon: Heart,
      color: 'rose',
      stats: [
        { label: 'Suites', value: '12' },
        { label: 'Imaging', value: 'Real-time' },
        { label: 'Integration', value: '360°' },
      ],
      features: [
        'Integrated angiography systems',
        'Intraoperative CT/MRI capability',
        'Advanced neuronavigation',
        'HEPA-filtered laminar airflow',
      ],
      description: 'Our hybrid operating suites combine traditional surgical environments with advanced imaging, enabling complex procedures that once required multiple surgeries.',
    },
    {
      id: 4,
      name: 'Linear Accelerator',
      category: 'Cancer Treatment',
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80',
      icon: Zap,
      color: 'amber',
      stats: [
        { label: 'Precision', value: 'Sub-mm' },
        { label: 'Sessions', value: '15,000+' },
        { label: 'Types', value: 'All Cancers' },
      ],
      features: [
        'Image-guided radiation therapy',
        'Stereotactic radiosurgery capable',
        'Real-time tumor tracking',
        'Minimal damage to healthy tissue',
      ],
      description: 'Our latest linear accelerators deliver precisely targeted radiation therapy, effectively treating tumors while preserving surrounding healthy tissue.',
    },
  ];

  const colorClasses = {
    cyan: {
      gradient: 'from-cyan-500 to-cyan-600',
      glow: 'shadow-[0_0_60px_rgba(0,217,200,0.4)]',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      glow: 'shadow-[0_0_60px_rgba(168,85,247,0.4)]',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    teal: {
      gradient: 'from-teal-500 to-teal-600',
      glow: 'shadow-[0_0_60px_rgba(20,184,166,0.4)]',
      border: 'border-teal-500/30',
      text: 'text-teal-400',
      bg: 'bg-teal-500/10',
    },
    rose: {
      gradient: 'from-rose-500 to-rose-600',
      glow: 'shadow-[0_0_60px_rgba(244,63,94,0.4)]',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
    },
    amber: {
      gradient: 'from-amber-500 to-amber-600',
      glow: 'shadow-[0_0_60px_rgba(245,158,11,0.4)]',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  };

  const current = equipment[activeEquipment];
  const colors = colorClasses[current.color as keyof typeof colorClasses];

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-[#0a0d12] to-[#0B0E13]">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-0 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[200px] -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[180px] -translate-y-1/2" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">Cutting-Edge Technology</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            Medical Technology
            <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent"> Reimagined</span>
          </h2>
          
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Our ₹500 Crore investment in state-of-the-art medical technology ensures you receive 
            the most advanced care available anywhere in the world.
          </p>
        </div>

        {/* Equipment Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {equipment.map((item, index) => {
            const itemColors = colorClasses[item.color as keyof typeof colorClasses];
            return (
              <button
                key={item.id}
                onClick={() => setActiveEquipment(index)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium transition-all duration-500 ${
                  activeEquipment === index
                    ? `bg-gradient-to-r ${itemColors.gradient} text-white ${itemColors.glow}`
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="hidden sm:inline">{item.name.split(' ')[0]}</span>
                <span className="sm:hidden">{item.category}</span>
              </button>
            );
          })}
        </div>

        {/* Main Equipment Display */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Image with 3D Effect */}
          <div className="relative group">
            {/* Rotating glow effect */}
            <div className={`absolute -inset-4 bg-gradient-to-r ${colors.gradient} rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700`} />
            
            {/* Main image container */}
            <div className="relative rounded-3xl overflow-hidden border border-white/10">
              <div className="aspect-[4/3] relative">
                <img
                  src={current.image}
                  alt={current.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E13] via-transparent to-transparent" />
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${colors.gradient} flex items-center justify-center ${colors.glow} cursor-pointer transform hover:scale-110 transition-transform`}>
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
              </div>

              {/* Stats overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center justify-around">
                  {current.stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className={`text-2xl md:text-3xl font-bold ${colors.text}`}>{stat.value}</div>
                      <div className="text-xs text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className={`absolute -top-4 -right-4 px-4 py-2 rounded-xl bg-gradient-to-r ${colors.gradient} ${colors.glow}`}>
              <span className="text-white text-sm font-bold">{current.category}</span>
            </div>
          </div>

          {/* Right - Content */}
          <div className="space-y-8">
            <div>
              <div className={`inline-flex items-center gap-2 ${colors.text} mb-4`}>
                <current.icon className="w-6 h-6" />
                <span className="text-sm font-medium uppercase tracking-wider">{current.category}</span>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {current.name}
              </h3>
              
              <p className="text-gray-400 text-lg leading-relaxed">
                {current.description}
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Key Capabilities</h4>
              <div className="grid sm:grid-cols-2 gap-3">
                {current.features.map((feature, index) => (
                  <div 
                    key={index}
                    className={`flex items-start gap-3 p-4 rounded-xl ${colors.bg} border ${colors.border}`}
                  >
                    <CheckCircle className={`w-5 h-5 ${colors.text} flex-shrink-0 mt-0.5`} />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-4">
              <a
                href="#contact"
                className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold bg-gradient-to-r ${colors.gradient} text-white ${colors.glow} hover:opacity-90 transition-opacity`}
              >
                Schedule Consultation
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold bg-white/5 text-white border border-white/20 hover:bg-white/10 transition-colors"
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </a>
            </div>
          </div>
        </div>

        {/* Technology Stats Banner */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '₹500 Cr', label: 'Technology Investment', icon: Cpu },
            { value: '50+', label: 'Advanced Equipment', icon: Microscope },
            { value: '12', label: 'Modular OT Suites', icon: Heart },
            { value: '100%', label: 'Digital Integration', icon: Zap },
          ].map((stat, index) => (
            <div 
              key={index}
              className="relative group p-6 rounded-2xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-colors"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <stat.icon className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}