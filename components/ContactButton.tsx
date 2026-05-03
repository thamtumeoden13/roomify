"use client"; // Nên để client component để đảm bảo tương tác tốt

import React from 'react';
import Image from 'next/image';

export const ContactButton = () => {
    return (
        <div className="fixed bottom-6 left-6 z-[9999] flex items-center justify-center group">
            {/* Hiệu ứng vòng tròn nhấp nháy (Pulsing Effect) */}
            <div className="absolute inset-0 flex items-center justify-center">
        <span className="relative flex h-14 w-14">
          <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-14 w-14 bg-orange-400/20"></span>
        </span>
            </div>

            {/* Nút Zalo chính */}
            <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://zalo.me/0971196061"
                className="relative flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-2xl transition-transform duration-300 group-hover:scale-110 border border-slate-100"
                title="Liên hệ Zalo"
            >
                <Image
                    src="/icons8-zalo.svg" // Hãy đảm bảo file này nằm trong thư mục /public
                    alt="Contact Zalo"
                    width={40}
                    height={40}
                    className="object-contain"
                    loading="eager"
                />
            </a>

            {/* Nhãn nhỏ khi hover (Tùy chọn) */}
            <div
                className="absolute left-20 bg-slate-900 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                Chat với chúng tôi
            </div>
        </div>
    );
};