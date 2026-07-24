// TectoroLogo.js - Tectoro whale tail logo component
import React from 'react';

function TectoroLogo({ size = 24, color = 'currentColor' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Simple whale tail - curved arc with vertical stem */}
      <path
        d="M 25 45 Q 30 25, 50 20 Q 70 25, 75 45 Q 75 50, 70 48 Q 65 40, 50 37 Q 35 40, 30 48 Q 25 50, 25 45 Z M 47 50 L 47 80 Q 47 82, 50 82 Q 53 82, 53 80 L 53 50 Z"
        fill={color}
        stroke="none"
      />
    </svg>
  );
}

export default TectoroLogo;
