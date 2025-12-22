'use client';

import { 
  Globe, Plane, Building, Languages, CreditCard, HeartHandshake,
  MapPin, Phone, Mail, MessageSquare, CheckCircle, ArrowRight,
  Users, Clock, Shield, Star
} from 'lucide-react';

export default function InternationalServices() {
  const regions = [
    { name: 'Middle East', countries: ['UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Oman'], patients: '15,000+' },
    { name: 'Africa', countries: ['Nigeria', 'Kenya', 'Tanzania', 'Ethiopia', 'Ghana'], patients: '8,000+' },
    { name: 'CIS Countries', countries: ['Russia', 'Kazakhstan', 'Uzbekistan', 'Ukraine'], patients: '5,000+' },
    { name: 'South Asia', countries: ['Bangladesh', 'Nepal', 'Sri Lanka', 'Afghanistan'], patients: '12,000+' },
    { name: 'Southeast Asia', countries: ['Myanmar', 'Indonesia', 'Vietnam', 'Thailand'], patients: '4,000+' },
    { name: 'Others', countries: ['UK', 'USA', 'Australia', 'Canada'], patients: '3,000+' },
  ];

  const services = [
    {
      icon: Plane,
      title: 'Travel Assistance',
      description: 'Visa support, flight booking, airport pickup in luxury vehicles',
      color: 'cyan',
    },
    {
      icon: Building,
      title: 'Accommodation',
      description: 'Premium hotels, hospital suites, serviced apartments near campus',
      color: 'purple',
    },
    {
      icon: Languages,
      title: '15+ Languages',
      description: 'Dedicated interpreters for Arabic, Russian, French, Swahili & more',
      color: 'teal',
    },
    {
      icon: CreditCard,
      title: 'Cost Transparency',
      description: 'Upfront pricing, international insurance, flexible payment options',
      color: 'amber',
    },
    {
      icon: HeartHandshake,
      title: 'Personal Concierge',
      description: 'Dedicated coordinator from inquiry to post-treatment follow-up',
      color: 'rose',
    },
    {
      icon: Shield,
      title: 'Global Standards',
      description: 'JCI accredited, internationally trained physicians, world-class protocols',
      color: 'green',
    },
  ];

  const colorClasses: Record<string, string> = {
    cyan: 'from-cyan-500 to-cyan-600 text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    purple: 'from-purple-500 to-purple-600 text-purple-400 bg-purple-500/10 border-purple-500/30',
    teal: 'from-teal-500 to-teal-600 text-teal-400 bg-teal-500/10 border-teal-500/30',
    amber: 'from-amber-500 to-amber-600 text-amber-400 bg-amber-500/10 border-amber-500/30',
    rose: 'from-rose-500 to-rose-600 text-rose-400 bg-rose-500/10 border-rose-500/30',
    green: 'from-green-500 to-green-600 text-green-400 bg-green-500/10 border-green-500/30',
  };

  const journeySteps = [
    { step: '01', title: 'Inquiry', description: 'Send medical records online' },
    { step: '02', title: 'Assessment', description: 'AI-powered preliminary evaluation' },
    { step: '03', title: 'Consultation', description: 'Video call with specialist' },
    { step: '04', title: 'Planning', description: 'Treatment plan & cost estimate' },
    { step: '05', title: 'Travel', description: 'Visa, flights, accommodation arranged' },
    { step: '06', title: 'Treatment', description: 'World-class care with concierge' },
    { step: '07', title: 'Recovery', description: 'Post-treatment monitoring' },
    { step: '08', title: 'Follow-up', description: 'Telemedicine & home care coordination' },
  ];

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-[#0B0E13] via-[#080a0e] to-[#0B0E13]">
      {/* Background */}
      <div className="absolute inset-0">
        {/* World map background - stylized dots */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(0,217,200,0.5) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[180px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">International Patient Services</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            World-Class Care,
            <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent"> Indian Hospitality</span>
          </h2>
          
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Every year, thousands of patients from 85+ countries trust us with their health. 
            Our dedicated International Patient Services team ensures a seamless experience from inquiry to recovery.
          </p>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {[
            { value: '85+', label: 'Countries', icon: Globe },
            { value: '50,000+', label: 'International Patients', icon: Users },
            { value: '15+', label: 'Languages', icon: Languages },
            { value: '24/7', label: 'Support', icon: Clock },
          ].map((stat, index) => (
            <div key={index} className="relative group p-6 rounded-2xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-colors overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <stat.icon className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Patient Journey */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-white text-center mb-10">Your Journey With Us</h3>
          
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500/0 via-cyan-500/50 to-cyan-500/0 -translate-y-1/2" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {journeySteps.map((item, index) => (
                <div key={index} className="relative group">
                  <div className="text-center">
                    {/* Step Number */}
                    <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-[#0B0E13] font-bold text-lg mb-3 shadow-[0_0_20px_rgba(0,217,200,0.3)] group-hover:shadow-[0_0_30px_rgba(0,217,200,0.5)] transition-shadow">
                      {item.step}
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-1">{item.title}</h4>
                    <p className="text-gray-400 text-xs">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {services.map((service, index) => {
            const colors = colorClasses[service.color].split(' ');
            return (
              <div 
                key={index}
                className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${colors[0]} ${colors[1]} opacity-0 group-hover:opacity-5 transition-opacity`} />
                
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors[0]} ${colors[1]} flex items-center justify-center mb-4 shadow-lg`}>
                  <service.icon className="w-7 h-7 text-white" />
                </div>
                
                <h4 className="text-xl font-semibold text-white mb-2">{service.title}</h4>
                <p className="text-gray-400">{service.description}</p>
              </div>
            );
          })}
        </div>

        {/* Regions Served */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-white text-center mb-10">Patients from Around the World</h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map((region, index) => (
              <div key={index} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">{region.name}</h4>
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-medium">
                    {region.patients}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {region.countries.map((country, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-sm">
                      {country}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920&q=80"
              alt="International Services"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E13] via-[#0B0E13]/90 to-[#0B0E13]/70" />
          </div>
          
          <div className="relative px-8 py-16 md:py-20 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Planning Your Medical Journey?
              </h3>
              <p className="text-gray-300 mb-6">
                Our International Patient Coordinators are available 24/7 to answer your questions 
                and help plan your treatment in India.
              </p>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Free medical opinion within 48 hours</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Transparent cost estimates upfront</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">No hidden charges or surprises</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
              <h4 className="text-xl font-semibold text-white mb-6">Contact International Services</h4>
              
              <div className="space-y-4">
                <a href="tel:+911140004001" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Call Us (24/7)</div>
                    <div className="text-white font-semibold">+91-11-4000-4001</div>
                  </div>
                </a>

                <a href="https://wa.me/911140004001" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">WhatsApp</div>
                    <div className="text-white font-semibold">Chat Now</div>
                  </div>
                </a>

                <a href="mailto:international@citygeneralhospital.com" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Email</div>
                    <div className="text-white font-semibold">international@citygeneralhospital.com</div>
                  </div>
                </a>
              </div>

              <a
                href="#contact"
                className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-[#0B0E13] font-semibold hover:opacity-90 transition-opacity"
              >
                Request Free Consultation
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}