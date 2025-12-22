'use client';

import { Star, Quote } from 'lucide-react';
import type { ClinicWebsiteData } from '@/lib/clinic-website/types';

interface TestimonialsSectionProps {
  data: ClinicWebsiteData;
}

// Sample patient images
const patientImages = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
];

export default function TestimonialsSection({ data }: TestimonialsSectionProps) {
  const { testimonials, organization } = data;

  // Default testimonials if none exist
  const displayTestimonials = testimonials.length > 0 ? testimonials : [
    {
      id: '1',
      patient_name: 'Ramesh Gupta',
      rating: 5,
      review_text: 'Dr. Rajesh Kumar solved my chronic backpain. Highly recommend to all. Got quick results and the MediBridge follow-up support was excellent!',
      treatment_type: 'Patient, Age 45',
    },
    {
      id: '2',
      patient_name: 'Anjali Deshmukh',
      rating: 5,
      review_text: 'The MediBridge system is a lifesaver! I can chat 24/7 when I have doubts during my pregnancy. The AI prescription analysis really helped.',
      treatment_type: 'Patient, Age 32',
    },
    {
      id: '3',
      patient_name: 'Suresh Iyer',
      rating: 5,
      review_text: "I've been seeing Dr. Amit Patel for my skin issues. He is very thorough and the treatment has been very effective. Highly recommend!",
      treatment_type: 'Patient, Age 38',
    },
    {
      id: '4',
      patient_name: 'Priya Malhotra',
      rating: 5,
      review_text: "My parents' various medical troubles led to ABC Clinic. The doctors are patient, knowledgeable and the MediBridge AI support is amazing!",
      treatment_type: 'Patient, Age 41',
    },
    {
      id: '5',
      patient_name: 'Vikram Singh',
      rating: 5,
      review_text: "The best clinic I've ever been to! Expert doctors, modern facilities, and the post-consultation AI support makes follow-up so easy.",
      treatment_type: 'Patient, Age 55',
    },
    {
      id: '6',
      patient_name: 'Sneha Rao',
      rating: 5,
      review_text: 'Great clinic at Fitness Street. Doctors are friendly and the MediBridge prescription explanation feature saved me so much confusion!',
      treatment_type: 'Corporate Professional, Age 29',
    },
  ];

  const avgRating = displayTestimonials.length > 0
    ? (displayTestimonials.reduce((sum, t) => sum + t.rating, 0) / displayTestimonials.length).toFixed(1)
    : '5.0';

  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Patients Say
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <span className="font-semibold text-gray-900">{avgRating}</span>
            <span className="text-gray-500">based on {displayTestimonials.length} reviews</span>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {displayTestimonials.slice(0, 6).map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i <= testimonial.rating 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                "{testimonial.review_text}"
              </p>

              {/* Patient Info */}
              <div className="flex items-center gap-3">
                <img
                 src={(testimonial as any).patient_photo_url || patientImages[index % patientImages.length]}
                  alt={testimonial.patient_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.patient_name}</p>
                  <p className="text-sm text-gray-500">{testimonial.treatment_type}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
