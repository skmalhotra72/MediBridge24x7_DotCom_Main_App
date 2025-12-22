'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Building2, Microscope, Bed, FlaskConical, Sparkles } from 'lucide-react';

export default function HospitalGallery() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All', icon: Sparkles },
    { id: 'building', name: 'Our Campus', icon: Building2 },
    { id: 'equipment', name: 'Technology', icon: Microscope },
    { id: 'rooms', name: 'Patient Care', icon: Bed },
    { id: 'labs', name: 'Laboratories', icon: FlaskConical },
  ];

  const galleryImages = [
    // Building & Campus
    { 
      src: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=1200&q=80',
      category: 'building',
      title: 'Main Hospital Building',
      description: 'Our state-of-the-art 500-bed facility'
    },
    { 
      src: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80',
      category: 'building',
      title: 'Hospital Reception',
      description: 'World-class welcome experience'
    },
    { 
      src: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=1200&q=80',
      category: 'building',
      title: 'Modern Architecture',
      description: 'Designed for healing and comfort'
    },
    // Equipment & Technology
    { 
      src: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1200&q=80',
      category: 'equipment',
      title: 'da Vinci Xi Robotic System',
      description: 'Advanced robotic surgical platform'
    },
    { 
      src: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&q=80',
      category: 'equipment',
      title: '3T MRI Scanner',
      description: 'High-resolution diagnostic imaging'
    },
    { 
      src: 'https://images.unsplash.com/photo-1581595219315-a187dd40c322?w=1200&q=80',
      category: 'equipment',
      title: 'Advanced CT Scanner',
      description: '256-slice CT for precise diagnosis'
    },
    { 
      src: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&q=80',
      category: 'equipment',
      title: 'Robotic Surgery Suite',
      description: 'Cutting-edge surgical technology'
    },
    // Patient Rooms
    { 
      src: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=1200&q=80',
      category: 'rooms',
      title: 'VIP Suite',
      description: 'Luxury accommodation for premium care'
    },
    { 
      src: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=1200&q=80',
      category: 'rooms',
      title: 'Private Patient Room',
      description: 'Comfort meets clinical excellence'
    },
    { 
      src: 'https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=1200&q=80',
      category: 'rooms',
      title: 'Intensive Care Unit',
      description: '24/7 critical care monitoring'
    },
    // Laboratories
    { 
      src: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1200&q=80',
      category: 'labs',
      title: 'Pathology Lab',
      description: 'AI-powered diagnostic laboratory'
    },
    { 
      src: 'https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=1200&q=80',
      category: 'labs',
      title: 'Research Center',
      description: 'Advancing medical science'
    },
  ];

  const filteredImages = activeCategory === 'all' 
    ? galleryImages 
    : galleryImages.filter(img => img.category === activeCategory);

  const openLightbox = (index: number) => {
    setCurrentImage(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % filteredImages.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
  };

  return (
    <section className="relative py-24 overflow-hidden bg-[#0B0E13]">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[130px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">Our World-Class Facilities</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            Experience
            <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent"> Excellence</span>
          </h2>
          
          <p className="text-gray-400 text-lg max-w-3xl mx-auto mb-10">
            Take a visual journey through our state-of-the-art facilities, advanced medical technology, 
            and world-class patient care environments.
          </p>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-[#0B0E13] shadow-[0_0_20px_rgba(0,217,200,0.4)]'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Masonry Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((image, index) => (
            <div
              key={index}
              onClick={() => openLightbox(index)}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl ${
                index === 0 ? 'col-span-2 row-span-2' : ''
              } ${index === 3 ? 'col-span-2' : ''}`}
            >
              <div className={`relative ${index === 0 ? 'aspect-square' : 'aspect-[4/3]'}`}>
                <img
                  src={image.src}
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E13] via-[#0B0E13]/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                
                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-white font-semibold text-lg mb-1">{image.title}</h3>
                    <p className="text-gray-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {image.description}
                    </p>
                  </div>
                </div>

                {/* Hover Border Effect */}
                <div className="absolute inset-0 border-2 border-cyan-500/0 group-hover:border-cyan-500/50 rounded-2xl transition-colors duration-300" />
                
                {/* View Icon */}
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Virtual Tour CTA */}
        <div className="mt-16 relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=1920&q=80"
              alt="Hospital"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E13]/95 via-[#0B0E13]/80 to-[#0B0E13]/60" />
          </div>
          
          <div className="relative px-8 py-16 md:py-20 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Experience Our Hospital
                <span className="text-cyan-400"> Virtually</span>
              </h3>
              <p className="text-gray-300 max-w-xl">
                Can&apos;t visit in person? Take an immersive 360° virtual tour of our facilities 
                from anywhere in the world.
              </p>
            </div>
            
            <a
              href="#"
              className="group inline-flex items-center gap-4 px-8 py-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-[0_0_30px_rgba(0,217,200,0.5)] group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 text-white ml-1" />
              </div>
              <div className="text-left">
                <div className="text-white font-semibold text-lg">Start Virtual Tour</div>
                <div className="text-gray-400 text-sm">360° Interactive Experience</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B0E13]/95 backdrop-blur-xl flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <button
            onClick={prevImage}
            className="absolute left-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={nextImage}
            className="absolute right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          
          <div className="max-w-5xl w-full">
            <img
              src={filteredImages[currentImage]?.src}
              alt={filteredImages[currentImage]?.title}
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
            <div className="text-center mt-6">
              <h3 className="text-white text-2xl font-semibold">{filteredImages[currentImage]?.title}</h3>
              <p className="text-gray-400 mt-2">{filteredImages[currentImage]?.description}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}