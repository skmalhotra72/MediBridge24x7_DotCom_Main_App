import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Menu,
  X,
  Clock,
  Brain,
  TrendingUp,
  Timer,
  DollarSign,
  Heart,
  Star,
  Shield,
  Users,
  Building2,
  Building,
  Stethoscope,
  CheckCircle,
  ArrowRight,
  Globe,
  Zap,
  Target,
  Award,
  MessageSquare,
  FileText,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'features', 'benefits', 'story', 'testimonials'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar
        activeSection={activeSection}
        scrollToSection={scrollToSection}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <section id="home" className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
        <HeroSection />
      </section>

      <section id="features" className="py-20 px-6 bg-slate-900/50">
        <MedhyaSection />
      </section>

      <section id="benefits" className="py-20 px-6">
        <BenefitsSection />
      </section>

      <section className="py-20 px-6 bg-slate-900/50">
        <HowItWorksSection />
      </section>

      <section id="story" className="py-20 px-6">
        <OurStorySection />
      </section>

      <section id="testimonials" className="py-20 px-6 bg-slate-900/50">
        <TestimonialsSection />
      </section>

      <section className="py-20 px-6 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20">
        <FinalCTA />
      </section>

      <Footer />
    </div>
  );
}

function Navbar({
  activeSection,
  scrollToSection,
  mobileMenuOpen,
  setMobileMenuOpen,
}: {
  activeSection: string;
  scrollToSection: (id: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}) {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'benefits', label: 'Benefits' },
    { id: 'story', label: 'Our Story' },
    { id: 'testimonials', label: 'Testimonials' },
  ];

  return (
    <nav className="fixed w-full bg-slate-900/95 backdrop-blur-lg border-b border-slate-800 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">MediBridge</span>
          </div>

          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? 'text-primary'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
            <Link
              to="/login"
              className="px-6 py-2 bg-gradient-to-r from-primary to-primary-600 text-white rounded-lg hover:shadow-xl hover:shadow-primary/50 transition-all font-medium"
            >
              Sign In
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 space-y-3 border-t border-slate-800 pt-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`block w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-primary/20 text-primary'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
            <Link
              to="/login"
              className="block w-full text-center px-4 py-2 bg-gradient-to-r from-primary to-primary-600 text-white rounded-lg font-medium"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

function HeroSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    clinicName: '',
    role: '',
    patientsPerMonth: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Demo booking:', formData);
    alert('Thank you! Our team will contact you shortly to schedule your demo.');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
          <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
  Healthcare That
  <span className="block bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
    Never Sleeps
  </span>
</h1>
              </span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              Meet Medhya — Your 24/7 AI-powered medical assistant built for Indian healthcare. Handle unlimited
              patients across 22+ Indian languages, reduce doctor workload by 70%, and deliver exceptional care around
              the clock.
            </p>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-secondary" />
              <span className="text-slate-300">500+ Indian Clinics</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-secondary" />
              <span className="text-slate-300">50,000+ Indian Patients</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-secondary" />
              <span className="text-slate-300">22+ Indian Languages</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-2xl hover:shadow-primary/50 transition-all font-semibold text-lg flex items-center gap-2"
            >
              Book Demo
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              to="/login"
              className="px-8 py-4 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors font-semibold text-lg border border-slate-700"
            >
              Get Started Free
            </Link>
          </div>

          <div className="flex items-center gap-6 pt-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-slate-900"
                />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-400 mt-1">Rated 4.9/5 by 500+ Indian doctors</p>
            </div>
          </div>
        </div>

        <div id="demo-form" className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
          <h3 className="text-2xl font-bold text-white mb-6">Book Your Free Demo</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name *"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors"
            />
            <input
              type="email"
              placeholder="Email Address *"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors"
            />
            <input
              type="tel"
              placeholder="Phone Number *"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors"
            />
            <input
              type="text"
              placeholder="Clinic Name *"
              required
              value={formData.clinicName}
              onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors"
            />
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors"
            >
              <option value="">Select Your Role *</option>
              <option value="doctor">Doctor</option>
              <option value="clinic_admin">Clinic Administrator</option>
              <option value="practice_manager">Practice Manager</option>
              <option value="other">Other</option>
            </select>
            <select
              required
              value={formData.patientsPerMonth}
              onChange={(e) => setFormData({ ...formData, patientsPerMonth: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors"
            >
              <option value="">Patients per Month *</option>
              <option value="0-100">0-100</option>
              <option value="100-500">100-500</option>
              <option value="500-1000">500-1000</option>
              <option value="1000+">1000+</option>
            </select>
            <button
              type="submit"
              className="w-full px-6 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-xl hover:shadow-primary/50 transition-all font-semibold text-lg"
            >
              Schedule Demo
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function MedhyaSection() {
  const languages = [
    'Hindi',
    'English',
    'Bengali',
    'Telugu',
    'Marathi',
    'Tamil',
    'Gujarati',
    'Urdu',
    'Kannada',
    'Odia',
    'Malayalam',
    'Punjabi',
    'Assamese',
    'Maithili',
    'Sanskrit',
    'Konkani',
    'Nepali',
    'Sindhi',
    'Dogri',
    'Kashmiri',
    'Bodo',
    'Santali',
  ];

  const features = [
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Always On',
      description: '24/7 availability means never missing a patient inquiry',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'Intelligent Automation',
      description: 'AI-powered triage and smart escalation to doctors',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Learns & Improves',
      description: 'Gets smarter with every interaction and adapts to your clinic',
      color: 'from-green-500 to-green-600',
    },
  ];

  const whyDoctorsLove = [
    { icon: <Timer className="w-6 h-6" />, text: 'Saves 15+ Hours Weekly' },
    { icon: <Users className="w-6 h-6" />, text: 'Handles Unlimited Patients' },
    { icon: <Shield className="w-6 h-6" />, text: 'DISHA & IT Act Compliant' },
    { icon: <Target className="w-6 h-6" />, text: 'Works in Tier 2 & 3 Cities' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-16">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-bold text-white">
          Meet Medhya — The Assistant Who Never Sleeps
        </h2>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto">
          Your AI-powered medical assistant built for Indian healthcare. Works 24/7 in 22+ Indian languages, understands Indian medical conditions, and knows Indian healthcare protocols.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 hover:border-slate-600 transition-all hover:transform hover:scale-105"
          >
            <div
              className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 text-white`}
            >
              {feature.icon}
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
            <p className="text-slate-300 leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700 overflow-hidden">
        <h3 className="text-2xl font-bold text-white mb-6 text-center">
          Speaks 22+ Indian Languages Fluently
        </h3>
        <div className="flex gap-4 overflow-hidden">
          <div className="flex gap-4 animate-scroll whitespace-nowrap">
            {[...languages, ...languages].map((lang, idx) => (
              <div
                key={idx}
                className="px-6 py-3 bg-slate-700/50 rounded-lg text-white whitespace-nowrap flex items-center gap-2"
              >
                <Globe className="w-4 h-4 text-primary" />
                {lang}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <h3 className="text-3xl font-bold text-white text-center">
          Why Doctors Love MediBridge
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyDoctorsLove.map((item, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                {item.icon}
              </div>
              <p className="text-white font-semibold">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-y border-slate-800">
        <StatCard number="500+" label="Indian Clinics" />
        <StatCard number="50,000+" label="Indian Patients" />
        <StatCard number="22+" label="Indian Languages" />
        <StatCard number="4.9★" label="Doctor Rating" />
      </div>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2">
        {number}
      </div>
      <div className="text-slate-400 font-medium">{label}</div>
    </div>
  );
}

function BenefitsSection() {
  const benefits = [
    {
      title: 'Save Time',
      description:
        'Automate routine tasks, patient intake, and appointment scheduling. Reclaim 15+ hours every week to focus on what matters — patient care.',
      stat: '15+ Hours',
      statLabel: 'saved every week',
      image: 'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=800&q=80',
      icon: <Timer className="w-12 h-12" />,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Save Money',
      description:
        'Reduce staffing costs, eliminate no-shows, and increase patient throughput. At just ₹5,999/month, MediBridge pays for itself in the first month — less than the cost of one receptionist.',
      stat: '₹40,000+',
      statLabel: 'saved monthly',
      image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80',
      icon: <DollarSign className="w-12 h-12" />,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Save Patient Health',
      description:
        'AI-powered triage understands Indian symptoms and local medical conditions. Immediate escalation for critical cases ensures better outcomes, even in remote areas with limited doctor availability.',
      stat: '24/7 Coverage',
      statLabel: 'even in rural areas',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
      icon: <Heart className="w-12 h-12" />,
      color: 'from-red-500 to-pink-500',
    },
    {
      title: 'Save Reputation',
      description:
        '24/7 availability and instant responses build trust. Happy patients become loyal advocates who refer others to your clinic.',
      stat: '4.9/5',
      statLabel: 'patient satisfaction',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&q=80',
      icon: <Star className="w-12 h-12" />,
      color: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Save Your Peace of Mind',
      description:
        'Sleep soundly knowing your clinic is covered 24/7. Automated workflows, compliance tracking, and intelligent monitoring give you control.',
      stat: '99.9%',
      statLabel: 'system reliability',
      image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800&q=80',
      icon: <Shield className="w-12 h-12" />,
      color: 'from-purple-500 to-indigo-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-16">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-bold text-white">The 5 Saves That Matter</h2>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto">
          MediBridge doesn't just automate — it transforms your entire practice
        </p>
      </div>

      <div className="space-y-24">
        {benefits.map((benefit, idx) => (
          <div
            key={idx}
            className={`grid lg:grid-cols-2 gap-12 items-center ${
              idx % 2 === 1 ? 'lg:flex-row-reverse' : ''
            }`}
          >
            <div className={`space-y-6 ${idx % 2 === 1 ? 'lg:order-2' : ''}`}>
              <div
                className={`w-20 h-20 bg-gradient-to-br ${benefit.color} rounded-2xl flex items-center justify-center text-white`}
              >
                {benefit.icon}
              </div>
              <h3 className="text-4xl font-bold text-white">{benefit.title}</h3>
              <p className="text-xl text-slate-300 leading-relaxed">{benefit.description}</p>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div
                  className={`text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${benefit.color} mb-2`}
                >
                  {benefit.stat}
                </div>
                <div className="text-slate-400">{benefit.statLabel}</div>
              </div>
            </div>
            <div className={`${idx % 2 === 1 ? 'lg:order-1' : ''}`}>
              <div className="relative rounded-2xl overflow-hidden aspect-video border border-slate-700">
                <img
                  src={benefit.image}
                  alt={benefit.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      title: 'Patient → Intake',
      description: 'Patient contacts clinic via chat, phone, or web portal',
      icon: <Users className="w-8 h-8" />,
    },
    {
      number: 2,
      title: 'AI → Triage',
      description: 'Medhya analyzes symptoms and determines urgency level',
      icon: <Brain className="w-8 h-8" />,
    },
    {
      number: 3,
      title: 'Doctor → Consultation',
      description: 'Critical cases escalated to doctor with complete context',
      icon: <Stethoscope className="w-8 h-8" />,
    },
    {
      number: 4,
      title: 'System → Documentation',
      description: 'Auto-generate prescriptions, notes, and lab orders',
      icon: <FileText className="w-8 h-8" />,
    },
    {
      number: 5,
      title: 'Clinic → Follow-up',
      description: 'Automated reminders, reports, and patient engagement',
      icon: <MessageSquare className="w-8 h-8" />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-bold text-white">How MediBridge Works</h2>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto">
          A seamless workflow from patient contact to follow-up
        </p>
      </div>

      <div className="relative">
        <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary transform -translate-y-1/2 opacity-30" />

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
          {steps.map((step, idx) => (
            <div key={idx} className="space-y-4">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 hover:border-primary transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    {step.number}
                  </div>
                  <div className="text-primary">{step.icon}</div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex justify-center lg:hidden">
                  <ChevronRight className="w-6 h-6 text-primary rotate-90 lg:rotate-0" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center pt-8">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-2xl hover:shadow-primary/50 transition-all font-semibold text-lg"
        >
          See It In Action
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}

function OurStorySection() {
  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-bold text-white">Our Story</h2>
        <p className="text-xl text-slate-300">
          Why we built MediBridge — and why it matters
        </p>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700 space-y-8">
        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-slate-300 leading-relaxed">
            It started with a simple observation: Indian doctors were burning out, not because they
            lacked skill or compassion, but because they were drowning in administrative work and language barriers.
          </p>
          <p className="text-slate-300 leading-relaxed">
            Late-night calls in multiple languages. Patients from rural areas struggling to communicate. Hours spent on paperwork instead
            of patient care. We knew Indian healthcare needed a better solution.
          </p>
          <p className="text-slate-300 leading-relaxed">
            So we built Medhya — not just another software tool, but a true AI assistant built for India. An assistant that speaks 22+ Indian languages,
            understands regional medical conditions, works in low-bandwidth areas, and never sleeps.
          </p>
          <p className="text-slate-300 leading-relaxed">
            Today, MediBridge serves over 500 clinics across India — from metros to tier-3 cities — and 50,000 Indian patients. Our mission is to make quality healthcare accessible
            to every Indian, regardless of language or location.
          </p>
        </div>

        <div className="flex justify-center pt-8">
          <div className="relative w-full max-w-2xl aspect-video rounded-xl overflow-hidden border border-slate-700">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80"
              alt="Team working together"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex items-end justify-center p-8">
              <p className="text-white text-lg font-semibold">
                A small team with a big mission
              </p>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <p className="text-slate-400 italic">
            "Technology should empower healthcare professionals, not replace them. That's the
            MediBridge promise."
          </p>
        </div>
      </div>
    </div>
  );
}

function TestimonialsSection() {
  const forWhom = [
    {
      icon: <Stethoscope className="w-8 h-8" />,
      title: 'Solo Practitioners',
      description: 'Perfect for independent doctors who need 24/7 coverage',
    },
    {
      icon: <Building2 className="w-8 h-8" />,
      title: 'Multi-Doctor Clinics',
      description: 'Coordinate care across multiple providers seamlessly',
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Specialty Centers',
      description: 'Customized workflows for dermatology, pediatrics, and more',
    },
    {
      icon: <Building className="w-8 h-8" />,
      title: 'Hospitals',
      description: 'Enterprise-grade solutions for large healthcare systems',
    },
  ];

  const testimonials = [
    {
      name: 'Dr. Priya Sharma',
      role: 'Family Physician, Delhi',
      quote:
        "MediBridge has transformed my practice. Medhya communicates with patients in Hindi, English, and Punjabi — I'm seeing 30% more patients without working longer hours. It handles routine inquiries while I focus on complex cases.",
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
      rating: 5,
    },
    {
      name: 'Dr. Rajesh Kumar',
      role: 'Pediatrician, Mumbai',
      quote:
        "The multilingual support is incredible. Our patients speak Marathi, Hindi, Gujarati, and English. Medhya handles all of them fluently. It's like having a receptionist who speaks every Indian language and never takes a break.",
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80',
      rating: 5,
    },
    {
      name: 'Dr. Anjali Reddy',
      role: 'Dermatologist, Bangalore',
      quote:
        'I was skeptical about AI in Indian healthcare, but MediBridge proved me wrong. It understands Telugu and English perfectly, and even common skin conditions specific to Indian climate. My clinic revenue is up 45% this year at just ₹5,999/month.',
      image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80',
      rating: 5,
    },
    {
      name: 'Dr. Amit Patel',
      role: 'General Physician, Ahmedabad',
      quote:
        'The ROI was immediate. For ₹5,999/month, we saved ₹40,000 in staffing costs. It works perfectly even with our slower internet. The system paid for itself in 2 weeks. Best investment I have made in 25 years of practice in Gujarat.',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80',
      rating: 5,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-16">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-bold text-white">For Whom We Built This</h2>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto">
          MediBridge adapts to your practice, no matter the size or specialty
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {forWhom.map((item, idx) => (
          <div
            key={idx}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 text-center hover:border-primary transition-all"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
              {item.icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
            <p className="text-slate-400">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="space-y-8 pt-12">
        <h3 className="text-4xl font-bold text-white text-center">What Doctors Are Saying</h3>
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, idx) => (
            <div
              key={idx}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 space-y-6"
            >
              <div className="flex gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 leading-relaxed italic">"{testimonial.quote}"</p>
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary"
                />
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-slate-400">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FinalCTA() {
  return (
    <div className="max-w-5xl mx-auto text-center space-y-8">
      <h2 className="text-5xl font-bold text-white">
        Ready to Transform Your Practice?
      </h2>
      <p className="text-xl text-slate-300 max-w-3xl mx-auto">
        Join 500+ Indian clinics across metros, tier-2, and tier-3 cities that are using MediBridge to deliver exceptional patient care
        in 22+ Indian languages while saving time and money.
      </p>
      <div className="flex flex-wrap gap-6 justify-center">
        <button
          onClick={() => document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-10 py-5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-2xl hover:shadow-primary/50 transition-all font-bold text-xl flex items-center gap-3"
        >
          Book Free Demo
          <ArrowRight className="w-6 h-6" />
        </button>
        <Link
          to="/login"
          className="px-10 py-5 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-colors font-bold text-xl"
        >
          Start Free Trial
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-slate-400">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-secondary" />
          <span>No credit card required</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-secondary" />
          <span>14-day free trial</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-secondary" />
          <span>Cancel anytime</span>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-800 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">MediBridge</span>
            </div>
            <p className="text-slate-400 text-sm">
              Healthcare management platform powered by AI for Indian clinics. Works in 22+ Indian languages. Never miss a patient, never burn out.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>
                <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">
                  Features
                </button>
              </li>
              <li>
                <button onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">
                  Benefits
                </button>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>
                <button onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">
                  Our Story
                </button>
              </li>
              <li>
                <button onClick={() => document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">
                  Testimonials
                </button>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  HIPAA Compliance
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
          <p>&copy; 2025 MediBridge. All rights reserved. Built in India, for Indian healthcare professionals. Compliant with DISHA Guidelines & IT Act 2000.</p>
        </div>
      </div>
    </footer>
  );
}
