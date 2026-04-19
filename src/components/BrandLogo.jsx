import React from 'react';
import { Box } from '@mui/material';

// Simple inline SVG brand mark. Keep it lightweight and scalable.
export default function BrandLogo({ size = 36 }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect width="48" height="48" rx="8" fill="#1565c0" />
        <g transform="translate(8 8)" fill="none" stroke="#fff" strokeWidth="2">
          <path d="M2 26 L10 14 L18 20 L26 6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="34" cy="4" r="4" fill="#fff" />
        </g>
      </svg>
    </Box>
  );
}

