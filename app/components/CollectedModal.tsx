import React from 'react';

interface CollectedModalProps {
  nft: { imageURI: string; name: string };
  txHash: string;
  onClose: () => void;
}

const CollectedModal: React.FC<CollectedModalProps> = ({ nft, txHash, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full text-center relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4">Collect Successful!</h2>
        {nft.imageURI && nft.imageURI !== 'ipfs://placeholder-image-uri' && (
          <img
            src={nft.imageURI}
            alt={nft.name}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
        )}
        <h3 className="text-lg font-semibold mb-2">{nft.name}</h3>
        <a
          href={`https://sepolia.basescan.org/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline block mt-4"
        >
          View on BaseScan
        </a>
      </div>
    </div>
  );
};

export default CollectedModal; 