import React from 'react';

export function WheatIcon({ width = 22, height = 22, className = "", style, ...props }) {
  return (
    <svg width={width} height={height} className={className} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 22 16 8" />
      <path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
      <path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
      <path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
      <path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z" />
      <path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" />
      <path d="M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" />
    </svg>
  );
}

export function TrendingUpIcon({ width = 18, height = 18, className = "", style, ...props }) {
  return (
    <svg width={width} height={height} className={className} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

export function TrendingDownIcon({ width = 18, height = 18, className = "", style, ...props }) {
  return (
    <svg width={width} height={height} className={className} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  );
}

export function MinusIcon({ width = 16, height = 16, className = "", style, ...props }) {
  return (
    <svg width={width} height={height} className={className} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function ScaleIcon({ width = 20, height = 20, className = "", style, ...props }) {
  return (
    <svg width={width} height={height} className={className} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  );
}

export function TruckIcon({ width = 20, height = 20, className = "", style, ...props }) {
  return (
    <svg width={width} height={height} className={className} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18.5" r="2.5" />
      <circle cx="7" cy="18.5" r="2.5" />
    </svg>
  );
}

export function BellIcon({ width = 18, height = 18, className = "", style, ...props }) {
  return (
    <svg width={width} height={height} className={className} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function VolumeIcon({ width = 18, height = 18, className = "", style, ...props }) {
  return (
    <svg width={width} height={height} className={className} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

export function VolumeOffIcon({ width = 18, height = 18, className = "", style, ...props }) {
  return (
    <svg width={width} height={height} className={className} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  );
}

export function ShieldCheckIcon({ width = 18, height = 18, className = "", style, ...props }) {
  return (
    <svg width={width} height={height} className={className} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function AlertCircleIcon({ width = 18, height = 18, className = "", style, ...props }) {
  return (
    <svg width={width} height={height} className={className} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function CheckIcon({ width = 16, height = 16, className = "", style, ...props }) {
  return (
    <svg width={width} height={height} className={className} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function SearchIcon({ width = 16, height = 16, className = "", style, ...props }) {
  return (
    <svg width={width} height={height} className={className} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function MapPinIcon({ width = 16, height = 16, className = "", style, ...props }) {
  return (
    <svg width={width} height={height} className={className} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function CalendarIcon({ width = 16, height = 16, className = "", style, ...props }) {
  return (
    <svg width={width} height={height} className={className} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function SparklesIcon({ width = 16, height = 16, className = "", style, ...props }) {
  return (
    <svg width={width} height={height} className={className} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

export function ChevronDownIcon({ width = 16, height = 16, className = "", style, ...props }) {
  return (
    <svg width={width} height={height} className={className} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ChevronUpIcon({ width = 16, height = 16, className = "", style, ...props }) {
  return (
    <svg width={width} height={height} className={className} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

export function InfoIcon({ width = 16, height = 16, className = "", style, ...props }) {
  return (
    <svg width={width} height={height} className={className} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export function ArrowRightIcon({ width = 16, height = 16, className = "", style, ...props }) {
  return (
    <svg width={width} height={height} className={className} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
