// src/components/clinic-website/shared/PoweredByBadge.tsx
// "Powered by MediBridge" badge for white-label sites

import Link from 'next/link';

interface PoweredByBadgeProps {
  variant?: 'light' | 'dark';
}

export default function PoweredByBadge({ variant = 'light' }: PoweredByBadgeProps) {
  const textColor = variant === 'light' 
    ? 'text-gray-500 hover:text-gray-700' 
    : 'text-gray-400 hover:text-gray-200';
  
  const accentColor = variant === 'light'
    ? 'text-orange-500'
    : 'text-orange-400';

  return (
    <Link
      href="https://medibridge24x7.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-sm ${textColor} transition-colors duration-200`}
    >
      <span>Powered by</span>
      <span className={`font-semibold ${accentColor}`}>MediBridge24x7</span>
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 17L17 7" />
        <path d="M7 7h10v10" />
      </svg>
    </Link>
  );
}