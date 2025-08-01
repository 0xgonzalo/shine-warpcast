// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

library EventsLib {
    event NewAudioDrop(
        uint256 indexed audioId,
        string indexed title,
        string indexed artistName,
        string mediaURI,
        string metadataURI,
        address artistAddress,
        uint256 pricePerMint,
        uint256 maxSupply
    );
    event UserBuy(
        uint256[] indexed audioIds,
        uint256 indexed farcasterId
    );

    event UserInstaBuy(
        uint256 indexed audioId,
        uint256 indexed farcasterId
    );

    
}
