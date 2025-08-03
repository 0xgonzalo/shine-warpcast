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
    /**
     * @notice Emitted when a new audio drop is created by an artist
     * @param audioId The unique identifier of the audio
     * @param title The title of the audio track
     * @param artistName The name of the artist
     * @param mediaURI The URI pointing to the audio media file
     * @param metadataURI The URI pointing to the metadata file
     * @param artistAddress The wallet address of the artist
     * @param price The price in wei for each mint of this audio
     */
    event NewSongDrop(
        uint256 indexed audioId,
        string indexed title,
        string indexed artistName,
        string mediaURI,
        string metadataURI,
        address artistAddress,
        uint256 price
    );

    /**
     * @notice Emitted when a new special edition audio drop is created
     * @param audioId The unique identifier of the audio
     * @param title The title of the audio track
     * @param artistName The name of the artist
     * @param mediaURI The URI pointing to the audio media file
     * @param metadataURI The URI pointing to the metadata file
     * @param artistAddress The wallet address of the artist
     * @param price The price in wei for each mint of this special edition audio
     * @param specialEditionName The name of the special edition
     * @param maxSupply The maximum supply for this special edition
     */
    event NewSpecialEditionSongDrop(
        uint256 indexed audioId,
        string indexed title,
        string indexed artistName,
        string mediaURI,
        string metadataURI,
        address artistAddress,
        uint256 price,
        string specialEditionName,
        uint256 maxSupply
    );

    /**
     * @notice Emitted when a user purchases multiple audio tracks in a single transaction
     * @param audioIds Array of audio IDs that were purchased
     * @param farcasterId The Farcaster ID of the user making the purchase
     */
    event UserBuy(uint256[] indexed audioIds, uint256 indexed farcasterId);

    /**
     * @notice Emitted when a user purchases a single audio track instantly
     * @param audioId The ID of the audio track purchased
     * @param farcasterId The Farcaster ID of the user making the purchase
     */
    event UserInstaBuy(uint256 indexed audioId, uint256 indexed farcasterId);
}
