import React, { useEffect, useRef } from 'react';
import ReactCanvasConfetti from 'react-canvas-confetti';
import { getIPFSGatewayURL } from '@/app/utils/pinata';
import { getCelebrationConfettiConfig } from '@/app/utils/confetti';

interface CollectedModalProps {
  nft: { imageURI: string; name: string };
  txHash: string;
  onClose: () => void;
}

const CollectedModal: React.FC<CollectedModalProps> = ({ nft, txHash, onClose }) => {
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
        <h2 className="text-xl md:text-2xl font-bold mb-4">Collect Successful!</h2>
        {nft.imageURI && nft.imageURI !== 'ipfs://placeholder-image-uri' && (
          <img
            src={getIPFSGatewayURL(nft.imageURI)}
            alt={nft.name}
            className="w-full h-48 md:h-64 object-cover rounded-lg mb-4"
          />
        )}
        <h3 className="text-md md:text-lg font-semibold mb-2">{nft.name}</h3>
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
};

export default CollectedModal; 