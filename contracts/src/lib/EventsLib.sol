// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
   ____             __          
  / ___  _____ ___ / /____      
 / _/| |/ / -_/ _ / __(_-<      
/___/|___/\__/_//_\__/___/      
                                
   __   _ __                    
  / /  (_/ /  _______ _______ __
 / /__/ / _ \/ __/ _ `/ __/ // /
/____/_/_.__/_/  \_,_/_/  \_, / 
                         /___/  

 * @title Events Library
 * @author 11:11 Labs
 * @notice This library defines events for the Shine platform.
 */

library EventsLib {
    event NewSongDrop(
        uint256 indexed audioId,
        string indexed title,
        string indexed artistName,
        string mediaURI,
        string metadataURI,
        address artistAddress,
        uint256 pricePerMint,
        uint256 maxSupply
    );
    event UserBuy(uint256[] indexed audioIds, uint256 indexed farcasterId);

    event UserInstaBuy(uint256 indexed audioId, uint256 indexed farcasterId);
}
