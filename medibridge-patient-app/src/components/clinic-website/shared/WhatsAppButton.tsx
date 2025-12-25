'use client';

import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  clinicName?: string;  // Clinic name for personalized message
}

// MediBridge WhatsApp Business Number - FIXED for all clinic websites
const MEDIBRIDGE_WHATSAPP = '917042191854';

export default function WhatsAppButton({ 
  clinicName = 'the clinic'
}: WhatsAppButtonProps) {
  
  // Personalized message based on which clinic website triggered it
  const message = `Hi! I visited ${clinicName} website and need help with my prescription or health query.`;
  
  const whatsappUrl = `https://wa.me/${MEDIBRIDGE_WHATSAPP}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 group"
      aria-label="Chat on WhatsApp"
    >
      {/* Pulse Ring */}
      <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-25" />
      
      {/* Button */}
      <span className="relative flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-full shadow-lg shadow-green-500/30 hover:shadow-xl transition-all">
        <MessageCircle className="w-6 h-6" />
        <span className="hidden sm:inline font-medium">Need Help?<br/><span className="text-xs">Chat with us</span></span>
      </span>
    </a>
  );
}