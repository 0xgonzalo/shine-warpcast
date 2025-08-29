interface MintButtonProps {
  isMinting: boolean;
  isPending: boolean;
  isConnected: boolean;
  onMint: () => void;
}

export default function MintButton({ isMinting, isPending, isConnected, onMint }: MintButtonProps) {
  return (
    <button
      onClick={onMint}
      disabled={!isConnected || isMinting || isPending}
      className={`w-full py-4 px-6 rounded-xl text-lg font-semibold transition-colors ${
        !isConnected || isMinting || isPending
          ? 'bg-gray-600 cursor-not-allowed'
          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
      }`}
    >
      {!isConnected
        ? 'Connect Wallet to Mint'
        : isMinting || isPending
        ? 'Minting...'
        : 'Mint Your Song'}
    </button>
  );
}
