import React from 'react';

interface RoomifyLogoProps {
    className?: string;
}

const RoomifyLogo: React.FC<RoomifyLogoProps> = ({className}) => {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Phần mặt bằng 2D */}
            <path d="M3 21V3H13V7H21V21H3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                  strokeLinejoin="round" opacity="0.3"/>

            {/* Phần khối 3D trung tâm thể hiện sự nổi lên */}
            <path d="M9 17L12 19L15 17V13L12 11L9 13V17Z" fill="url(#logo-grad)" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 11V19M9 13L12 15L15 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                  strokeLinejoin="round"/>

            <defs>
                <linearGradient id="logo-grad" x1="9" y1="11" x2="15" y2="19" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F97316"/>
                    {/* Màu Cam chính của bạn */}
                    <stop offset="1" stopColor="#EA580C"/>
                </linearGradient>
            </defs>
        </svg>
    );
};

export default RoomifyLogo;
