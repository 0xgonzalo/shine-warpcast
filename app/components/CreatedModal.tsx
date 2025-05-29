import React, { useEffect, useRef } from 'react';
import ReactCanvasConfetti from 'react-canvas-confetti';
import { getIPFSGatewayURL } from '@/app/utils/pinata';
import { getCelebrationConfettiConfig } from '@/app/utils/confetti';
import Image from 'next/image';

interface CreatedModalProps {
  nft: { 
    imageURI: string; 
    name: string;
    description: string;
  };
  txHash: string;
  onClose: () => void;
}

const CreatedModal: React.FC<CreatedModalProps> = ({ nft, txHash, onClose }) => {
  const confettiRef = useRef<any>(null);

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

  const getInstance = (instance: any) => {
    confettiRef.current = instance;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      {/* Confetti Canvas */}
      <ReactCanvasConfetti
        onInit={({ confetti }) => getInstance(confetti)}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 40
        }}
      />
      
      <div className="bg-black rounded-lg p-6 md:p-12 max-w-xs md:max-w-sm w-full text-center relative border border-white/10 z-50">
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-gray-50 hover:text-gray-200 text-xl md:text-2xl"
        >
          &times;
        </button>
        
        {/* Success Icon */}
        <div className="mb-4">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-green-400">Music Created Successfully! 🎵</h2>
        
        {nft.imageURI && nft.imageURI !== 'ipfs://placeholder-image-uri' && (
          <div className="mb-4">
            <Image
              src={getIPFSGatewayURL(nft.imageURI)}
              alt={nft.name}
              width={256}
              height={192}
              className="w-full h-48 md:h-64 object-cover rounded-lg"
            />
          </div>
        )}
        
        <h3 className="text-md md:text-lg font-semibold mb-2">{nft.name}</h3>
        {nft.description && (
          <p className="text-sm text-gray-400 mb-4 line-clamp-2">{nft.description}</p>
        )}
        
        <div className="space-y-3">
          <a
            href={`https://sepolia.basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline block hover:text-blue-300 transition-colors text-sm"
          >
            View Transaction on BaseScan
          </a>
          
          <div className="pt-2">
            <p className="text-xs text-gray-500 mb-2">Your music is now live on the blockchain!</p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Continue Creating
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatedModal; 