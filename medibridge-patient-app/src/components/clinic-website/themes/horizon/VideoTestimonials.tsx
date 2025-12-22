'use client';

import { useState } from 'react';
import { Play, Star, Quote, ChevronLeft, ChevronRight, MapPin, Calendar, X } from 'lucide-react';
import type { ClinicWebsiteData } from '@/lib/clinic-website/types';

interface VideoTestimonialsProps {
  data: ClinicWebsiteData;
}

export default function VideoTestimonials({ data }: VideoTestimonialsProps) {
  const { testimonials } = data;
  const [activeVideo, setActiveVideo] = useState<number | null>(null);
  const [activeStory, setActiveStory] = useState(0);

  // Enhanced testimonials with video placeholders
  const videoStories = [
    {
      id: 1,
      name: 'Rajendra Malhotra',
      location: 'New Delhi, India',
      treatment: 'Robotic Prostate Surgery',
      doctor: 'Dr. Vikram Sharma',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      thumbnail: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80',
      quote: 'I was terrified when diagnosed with prostate cancer. The robotic surgery meant I was walking the next day. Three months later, I\'m cancer-free and back to playing golf.',
      rating: 5,
      date: 'October 2024',
      recovery: '2 days',
    },
    {
      id: 2,
      name: 'Ahmed Al-Mansouri',
      location: 'Dubai, UAE',
      treatment: 'Robotic Cardiac Surgery',
      doctor: 'Dr. Rajesh Kapoor',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      thumbnail: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80',
      quote: 'I flew from Dubai specifically for Dr. Kapoor\'s expertise. The International Patient team arranged everything - visa, airport pickup, luxury suite. The care matched any hospital in Europe.',
      rating: 5,
      date: 'September 2024',
      recovery: '5 days',
    },
    {
      id: 3,
      name: 'Sunita Krishnan',
      location: 'Chennai, India',
      treatment: 'AI-Powered Cancer Detection',
      doctor: 'Dr. Priya Mehta',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
      thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
      quote: 'Dr. Mehta\'s AI diagnostic system detected a tiny pancreatic lesion that two other hospitals had missed. The early detection saved my life. I\'m now 2 years cancer-free.',
      rating: 5,
      date: 'August 2024',
      recovery: 'Early detection',
    },
    {
      id: 4,
      name: 'Emmanuel Okonkwo',
      location: 'Lagos, Nigeria',
      treatment: 'Robotic Spine Surgery',
      doctor: 'Dr. Arun Krishnamurthy',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
      thumbnail: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&q=80',
      quote: 'I traveled from Nigeria for a complex spine surgery. The International Services team was exceptional. Dr. Krishnamurthy\'s robotic surgery has given me my mobility back.',
      rating: 5,
      date: 'November 2024',
      recovery: '1 week',
    },
  ];

  const current = videoStories[activeStory];

  return (
    <section id="testimonials" className="relative py-24 overflow-hidden bg-[#0B0E13]">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-cyan-500/5 rounded-full blur-[200px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <Play className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">Patient Stories</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            Real Stories,
            <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent"> Real Hope</span>
          </h2>
          
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Watch our patients share their transformative journeys. These aren&apos;t just testimonials—
            they&apos;re stories of courage, hope, and the life-changing power of advanced medicine.
          </p>
        </div>

        {/* Featured Video Story */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Video Player */}
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
              
              <div className="relative rounded-3xl overflow-hidden border border-white/10">
                <div className="aspect-video relative">
                  <img
                    src={current.thumbnail}
                    alt={current.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E13]/80 via-transparent to-transparent" />
                  
                  {/* Play Button */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    onClick={() => setActiveVideo(current.id)}
                  >
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center shadow-[0_0_60px_rgba(0,217,200,0.5)] transform hover:scale-110 transition-transform">
                      <Play className="w-10 h-10 text-white ml-2" />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm">
                    4:32
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <button
                  onClick={() => setActiveStory((prev) => (prev - 1 + videoStories.length) % videoStories.length)}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveStory((prev) => (prev + 1) % videoStories.length)}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Story Details */}
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="flex items-center gap-4">
                <img
                  src={current.image}
                  alt={current.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-cyan-500"
                />
                <div>
                  <h3 className="text-2xl font-bold text-white">{current.name}</h3>
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{current.location}</span>
                  </div>
                </div>
              </div>

              {/* Quote */}
              <div className="relative">
                <Quote className="absolute -top-2 -left-2 w-10 h-10 text-cyan-500/20" />
                <p className="text-xl text-gray-300 leading-relaxed italic pl-8">
                  &ldquo;{current.quote}&rdquo;
                </p>
              </div>

              {/* Treatment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-sm text-gray-400">Treatment</div>
                  <div className="text-white font-semibold">{current.treatment}</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-sm text-gray-400">Treating Physician</div>
                  <div className="text-white font-semibold">{current.doctor}</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-sm text-gray-400">Recovery Time</div>
                  <div className="text-cyan-400 font-semibold">{current.recovery}</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-sm text-gray-400">Rating</div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-4">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-[#0B0E13] font-semibold hover:opacity-90 transition-opacity"
                >
                  Book Similar Treatment
                </a>
                <button className="px-6 py-3 rounded-xl bg-white/5 text-white font-medium border border-white/20 hover:bg-white/10 transition-colors">
                  Read Full Story
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Thumbnails Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {videoStories.map((story, index) => (
            <button
              key={story.id}
              onClick={() => setActiveStory(index)}
              className={`group relative rounded-2xl overflow-hidden transition-all duration-300 ${
                activeStory === index 
                  ? 'ring-2 ring-cyan-500 scale-[1.02]' 
                  : 'hover:scale-[1.02]'
              }`}
            >
              <div className="aspect-video">
                <img
                  src={story.thumbnail}
                  alt={story.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E13] via-transparent to-transparent" />
                
                {/* Play Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/80 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center gap-2">
                  <img
                    src={story.image}
                    alt={story.name}
                    className="w-8 h-8 rounded-full object-cover border border-white/30"
                  />
                  <div className="text-left">
                    <div className="text-white text-sm font-medium truncate">{story.name}</div>
                    <div className="text-gray-400 text-xs truncate">{story.treatment}</div>
                  </div>
                </div>
              </div>

              {activeStory === index && (
                <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-cyan-400" />
              )}
            </button>
          ))}
        </div>

        {/* Trust Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '99.2%', label: 'Patient Satisfaction' },
            { value: '50,000+', label: 'Happy Patients' },
            { value: '4.9/5', label: 'Average Rating' },
            { value: '85+', label: 'Countries Served' },
          ].map((stat, index) => (
            <div key={index} className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <button
            onClick={() => setActiveVideo(null)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="max-w-4xl w-full aspect-video bg-[#0B0E13] rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <Play className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <p className="text-gray-400">Video player would load here</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}