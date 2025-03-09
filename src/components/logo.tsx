import React from 'react';

export function SocratesLogo({ className }: { className?: string }) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M32 4C16.536 4 4 16.536 4 32C4 47.464 16.536 60 32 60C47.464 60 60 47.464 60 32C60 16.536 47.464 4 32 4Z"
        fill="white"
        strokeWidth="2"
        stroke="currentColor"
      />
      <path
        d="M32 14C28 14 24 15 22 18C20 21 21 24 22 26C23 28 24 29 25 30C26 31 24 32 24 33C24 34 26 35 26 36C26 37 24 38 24 39C24 40 26 41 26 42C26 43 24 44 24 45C24 46 26 47 28 47C30 47 32 46 32 44C32 42 30 41 30 40C30 39 32 38 32 37C32 36 30 35 30 34C30 33 32 32 32 31C32 30 30 29 28 28C26 27 24 26 23 24C22 22 21 20 23 18C25 16 28 16 32 16C36 16 39 16 41 18C43 20 42 22 41 24C40 26 38 27 36 28C34 29 32 30 32 31C32 32 34 33 34 34C34 35 32 36 32 37C32 38 34 39 34 40C34 41 32 42 32 44C32 46 34 47 36 47C38 47 40 46 40 45C40 44 38 43 38 42C38 41 40 40 40 39C40 38 38 37 38 36C38 35 40 34 40 33C40 32 38 31 39 30C40 29 41 28 42 26C43 24 44 21 42 18C40 15 36 14 32 14Z"
        fill="currentColor"
      />
      <circle cx="26" cy="22" r="2" fill="white" />
      <circle cx="38" cy="22" r="2" fill="white" />
    </svg>
  );
}