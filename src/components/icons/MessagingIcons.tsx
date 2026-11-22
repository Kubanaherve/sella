import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * Authentic WhatsApp Brand Vector Icon
 * Uses official WhatsApp brand geometry: speech bubble with telephone handset
 */
export function WhatsAppIcon({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 3.67C14.24 3.67 16.31 4.53 17.87 6.09C19.42 7.64 20.28 9.71 20.28 11.92C20.28 16.46 16.58 20.16 12.04 20.16C10.66 20.16 9.3 19.8 8.1 19.09L7.81 18.92L4.7 19.74L5.53 16.71L5.34 16.41C4.55 15.16 4.13 13.55 4.13 11.91C4.13 7.37 7.5 3.67 12.04 3.67ZM8.73 7.35C8.54 7.35 8.24 7.42 7.99 7.69C7.74 7.96 7.03 8.63 7.03 10C7.03 11.37 8.03 12.69 8.17 12.88C8.31 13.07 10.13 15.87 12.92 17.07C13.58 17.36 14.1 17.53 14.5 17.66C15.16 17.87 15.77 17.84 16.24 17.77C16.77 17.69 17.87 17.1 18.1 16.45C18.33 15.8 18.33 15.25 18.26 15.13C18.19 15.01 18.01 14.94 17.64 14.76C17.27 14.57 15.45 13.68 15.11 13.56C14.77 13.43 14.53 13.37 14.28 13.74C14.03 14.11 13.33 14.94 13.11 15.19C12.89 15.44 12.68 15.47 12.31 15.28C11.94 15.1 10.75 14.71 9.34 13.45C8.24 12.47 7.5 11.26 7.28 10.89C7.06 10.52 7.26 10.32 7.44 10.14C7.61 9.97 7.82 9.7 8.01 9.48C8.2 9.26 8.26 9.1 8.38 8.86C8.5 8.61 8.44 8.4 8.35 8.21C8.26 8.03 7.55 6.27 7.26 5.56C6.97 4.88 6.68 4.97 6.46 4.97C6.26 4.96 6.03 4.96 5.8 4.96"
      />
    </svg>
  );
}

/**
 * Authentic SMS Message Vector Icon
 * Vibrant mobile SMS speech bubble with chat signal lines
 */
export function SmsIcon({ size = 20, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
        fill="currentColor"
      />
      <circle cx="7.5" cy="10" r="1.5" fill="#0F172A" />
      <circle cx="12" cy="10" r="1.5" fill="#0F172A" />
      <circle cx="16.5" cy="10" r="1.5" fill="#0F172A" />
    </svg>
  );
}
