import React, { useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ReactCanvasConfetti from 'react-canvas-confetti';
import Image from 'next/image';
import { getIPFSGatewayURL } from '@/app/utils/pinata';
import { getCelebrationConfettiConfig } from '@/app/utils/confetti';
import { shareOnFarcasterCast } from '@/app/utils/farcaster';
import { usePathname } from 'next/navigation';

interface CollectedModalProps {
  nft: { imageURI: string; name: string; artistUsername?: string };
  txHash: string;
  onClose: () => void;
  tokenPath?: string;
}

const CollectedModal: React.FC<CollectedModalProps> = ({ nft, txHash, onClose, tokenPath }) => {
  const confettiRef = useRef<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Trigger confetti after a short delay to ensure modal is rendered
    const timer = setTimeout(() => {
      if (confettiRef.current) {
        const config = getCelebrationConfettiConfig();
        confettiRef.current(config);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle escape key to close modal and prevent body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const getInstance = (instance: any) => {
    confettiRef.current = instance;
  };

  const shareText = useMemo(() => {
    const by = nft.artistUsername ? ` by @${nft.artistUsername}` : '';
    return `I just collected ${nft.name}${by} on Shine! 🎵`;
  }, [nft.name, nft.artistUsername]);

  const tokenUrl = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    if (tokenPath) return window.location.origin + tokenPath;
    return window.location.origin + pathname;
  }, [pathname, tokenPath]);

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60"
      onClick={(e) => {
        // Close modal when clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Confetti Canvas */}
      <ReactCanvasConfetti
        onInit={({ confetti }) => getInstance(confetti)}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 9998
        }}
      />
      
      <div className="bg-black rounded-lg p-6 md:p-12 max-w-xs md:max-w-sm w-full text-center relative border border-white/10 z-[10000] mx-4">
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-gray-50 hover:text-gray-200 text-xl md:text-2xl transition-colors"
          aria-label="Close modal"
        >
          &times;
        </button>
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-white">Collect Successful!</h2>
        {nft.imageURI && nft.imageURI !== 'ipfs://placeholder-image-uri' && (
          <Image
            src={getIPFSGatewayURL(nft.imageURI)}
            alt={nft.name}
            width={400}
            height={400}
            className="w-full aspect-square object-cover rounded-lg mb-4"
          />
        )}
        <h3 className="text-md md:text-lg font-semibold mb-2 text-white">{nft.name}</h3>
        <button
          onClick={() => shareOnFarcasterCast({ text: shareText, url: tokenUrl })}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium mb-2"
        >
          Share on Farcaster
        </button>
        <a
          href={`https://sepolia.basescan.org/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 underline block mt-4 hover:text-purple-300 transition-colors"
        >
          View on BaseScan
        </a>
      </div>
    </div>
  );

  // Use portal to render modal at the root level, outside of any parent containers
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
};

export default CollectedModal; 