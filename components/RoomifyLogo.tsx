import React, {type FC} from 'react';

interface RoomifyLogoProps {
    className?: string;
}

export const RoomifyLogo = ({className}: { className?: string }) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Background Glow - Tạo chiều sâu */}
        <circle cx="50" cy="50" r="45" fill="url(#bg-grad)" fillOpacity="0.05"/>

        {/* Khối 3D chính */}
        <path d="M50 20L85 40V80L50 100L15 80V40L50 20Z" fill="url(#main-grad)" fillOpacity="0.1"/>

        {/* Wireframe (2D Part) - Nét mảnh bên trái */}
        <path d="M50 20L15 40V80L50 60" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="4 4"/>

        {/* Solid (3D Part) - Khối đặc bên phải thể hiện sự Render */}
        <path d="M50 20L85 40V80L50 100V60L85 40" fill="url(#main-grad)"/>
        <path d="M50 60L15 40" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              opacity="0.5"/>

        {/* Điểm nhấn AI Sparkle */}
        <path d="M50 15L52 22L59 24L52 26L50 33L48 26L41 24L48 22L50 15Z" fill="#F97316">
            <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
        </path>

        <defs>
            <linearGradient id="main-grad" x1="50" y1="20" x2="50" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F97316"/>
                <stop offset="1" stopColor="#EA580C"/>
            </linearGradient>
            <radialGradient id="bg-grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
                            gradientTransform="translate(50 50) rotate(90) scale(45)">
                <stop stopColor="#F97316"/>
                <stop offset="1" stopColor="#F97316" stopOpacity="0"/>
            </radialGradient>
        </defs>
    </svg>
);

export default RoomifyLogo;
