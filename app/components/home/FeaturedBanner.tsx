'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function FeaturedBanner() {
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Target date: Monday, November 17, 2025, 14:00:00 UTC-3
    const targetDate = new Date('2025-11-17T14:00:00-03:00');

    const updateCountdown = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setIsExpired(true);
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full rounded-xl overflow-hidden mb-8 shadow-lg">
        {/* Banner Image */}
        <div className="relative w-full">
          <Image
            src="/featured/featured-banner.jpg"
            alt="MusicaW3 x Devconnect Drop on Base"
            width={1200}
            height={630}
            className="w-full h-auto"
            priority
          />
          {/* Gradient Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/20 group-hover:from-black/95 group-hover:via-black/70 transition-colors duration-300" />
        </div>

        {/* Text Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 drop-shadow-lg">
            MusicaW3 x Devconnect Drop on Base
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-gray-100 max-w-3xl drop-shadow-md">
            MusicaW3 is celebrating Devconnect with a curated selection of artists
            participating in featured events around the conference like Base Meetup,
            The Music Stage at the main conference and others
          </p>

          {/* Countdown Timer */}
          <div className="mt-4">
            {isExpired ? (
              <div className="inline-flex items-center gap-2 text-white bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <span className="text-xs font-medium">Event Started!</span>
              </div>
            ) : (
              <div className="flex gap-2 text-white">
                <div className="bg-white/20 backdrop-blur-sm px-2 py-1.5 rounded-lg min-w-[45px] text-center">
                  <div className="text-lg md:text-xl font-bold">{timeRemaining.days}</div>
                  <div className="text-[10px] md:text-xs opacity-80">Days</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-2 py-1.5 rounded-lg min-w-[45px] text-center">
                  <div className="text-lg md:text-xl font-bold">{timeRemaining.hours}</div>
                  <div className="text-[10px] md:text-xs opacity-80">Hours</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-2 py-1.5 rounded-lg min-w-[45px] text-center">
                  <div className="text-lg md:text-xl font-bold">{timeRemaining.minutes}</div>
                  <div className="text-[10px] md:text-xs opacity-80">Min</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-2 py-1.5 rounded-lg min-w-[45px] text-center">
                  <div className="text-lg md:text-xl font-bold">{timeRemaining.seconds}</div>
                  <div className="text-[10px] md:text-xs opacity-80">Sec</div>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
