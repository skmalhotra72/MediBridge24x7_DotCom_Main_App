'use client';

import { Star, Clock, MapPin, Award, Calendar, Languages } from 'lucide-react';
import type { ClinicWebsiteData } from '@/lib/clinic-website/types';

interface DoctorsSectionProps {
  data: ClinicWebsiteData;
}

// Sample doctor images from the reference design
const doctorImages = [
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&h=400&fit=crop&crop=face',
];

export default function DoctorsSection({ data }: DoctorsSectionProps) {
  const { doctors, profile } = data;

  // Default doctors if none exist
  const displayDoctors = doctors.length > 0 ? doctors : [
    {
      id: '1',
      full_name: 'Dr. Rajesh Kumar',
      specialization: 'MD, DM Cardiology',
      qualifications: 'Fellowship in Interventional Cardiology',
      experience_years: 15,
      bio: 'Dr. Rajesh Kumar is a renowned interventional cardiologist with expertise in complex cardiac procedures. He has performed over 5,000 successful cardiac procedures.',
      languages_spoken: ['English', 'Hindi', 'Marathi'],
      consultation_fee: 800,
      awards: [{ name: 'IMA Best Cardiologist 2022' }],
      available_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    },
    {
      id: '2',
      full_name: 'Dr. Priya Sharma',
      specialization: 'MS Ophthalmology, DNB',
      qualifications: 'Gold Medalist in M.S. Ophthalmology',
      experience_years: 12,
      bio: 'Dr. Priya Sharma specializes in minimally invasive ocular surgeries and treatments. She has successfully treated countless patients of diverse age groups.',
      languages_spoken: ['English', 'Hindi', 'Punjabi'],
      consultation_fee: 600,
      awards: [{ name: 'Best Eye Surgeon Award 2021' }],
      available_days: ['Mon', 'Wed', 'Fri', 'Sat'],
    },
    {
      id: '3',
      full_name: 'Dr. Amit Patel',
      specialization: 'MD Dermatology, DDVL',
      qualifications: 'Member, Indian Association of Dermatologists',
      experience_years: 10,
      bio: 'Dr. Amit Patel is a expert in cosmetology and skin concerns including Psoriasis, Eczema, and advanced skin procedures like lasers.',
      languages_spoken: ['English', 'Hindi', 'Gujarati'],
      consultation_fee: 700,
      awards: [{ name: 'Young Dermatologist Award' }],
      available_days: ['Tue', 'Thu', 'Sat'],
    },
    {
      id: '4',
      full_name: 'Dr. Meera Iyer',
      specialization: 'MS General Surgery',
      qualifications: 'Fellowship in Bariatric Medicine, USA',
      experience_years: 18,
      bio: 'Dr. Meera Iyer is a renowned surgeon specializing in laparoscopic and bariatric procedures with over 3,000 successful surgeries.',
      languages_spoken: ['English', 'Hindi', 'Tamil', 'Kannada'],
      consultation_fee: 900,
      awards: [{ name: 'Excellence in Surgery 2023' }],
      available_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    },
  ];

  return (
    <section id="doctors" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Meet Our Specialists
          </h2>
          <p className="text-gray-600">
            Expert doctors dedicated to your health and well-being
          </p>
        </div>

        {/* Doctors Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {displayDoctors.slice(0, 4).map((doctor, index) => (
            <div
              key={doctor.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Doctor Image */}
                <div className="sm:w-48 h-48 sm:h-auto flex-shrink-0">
                  <img
                    src={doctor.photo_url || doctorImages[index % doctorImages.length]}
                    alt={doctor.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Doctor Info */}
                <div className="flex-1 p-6">
                  {/* Name & Specialization */}
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {doctor.full_name}
                  </h3>
                  <p className="text-purple-600 font-medium text-sm mb-2">
                    {doctor.specialization}
                  </p>
                  <p className="text-gray-500 text-sm mb-3">
                    {doctor.qualifications}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                    <span className="text-sm text-gray-600 ml-1">5.0</span>
                  </div>

                  {/* Bio */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {doctor.bio}
                  </p>

                  {/* Quick Info */}
                  <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
                    {doctor.experience_years && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {doctor.experience_years}+ Yrs Exp
                      </span>
                    )}
                    {doctor.languages_spoken && (
                      <span className="flex items-center gap-1">
                        <Languages className="w-3 h-3" />
                        {doctor.languages_spoken.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Awards */}
                  {doctor.awards && doctor.awards.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Key Achievements</p>
                      <p className="text-sm text-purple-600">
                        {typeof doctor.awards[0] === 'string' ? doctor.awards[0] : doctor.awards[0].name}
                      </p>
                    </div>
                  )}

                  {/* Fee & CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <span className="text-xs text-gray-500">Consultation Fee</span>
                      <p className="text-lg font-bold text-gray-900">
                        ₹{doctor.consultation_fee || 500}
                      </p>
                    </div>
                    <a
                      href="#contact"
                      className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Book Appointment
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
