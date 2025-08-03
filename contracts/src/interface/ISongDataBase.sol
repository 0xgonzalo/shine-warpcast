// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
    ___ _ _____  _____ シ
  ,' _//// / / |/ / _/ ャ
 _\ `./ ` / / || / _/  イ
/___,/_n_/_/_/|_/___/  ヌ
                      
                                                            
 * @title ISongDataBase Interface
 * @author 11:11 Labs 
 * @notice Interface for the Shine SongDataBase contract that manages song metadata,
 *         user purchases, and admin functionalities for the Shine platform.
 */

interface ISongDataBase {
    // 🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮶 Structs 🮵🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙

    /**
     * @notice Stores metadata information for an song
     * @dev Contains all necessary information to represent an song drop
     * @param title The title of the song track
     * @param artistName The name of the artist who created the song
     * @param mediaURI The URI pointing to the song media file
     * @param metadataURI The URI pointing to the song metadata (JSON)
     * @param artistAddress The Ethereum address of the artist who will receive payments
     * @param tags An array of string tags categorizing the song
     * @param price The price in wei that users must pay to purchase this song
     * @param timesBought The total number of times this song has been bought
     * @param isAnSpecialEdition Flag indicating if this song is a special edition
     * @param specialEditionName The name of the special edition, if applicable
     * @param maxSupplySpecialEdition The maximum supply for special edition songs
     */
    struct SongMetadata {
        string title;
        string artistName;
        string mediaURI;
        string metadataURI;
        address artistAddress;
        string[] tags;
        uint256 price;
        uint256 timesBought;
        bool isAnSpecialEdition;
        string specialEditionName;
        uint256 maxSupplySpecialEdition;
    }

    /**
     * @notice Manages admin address change proposals with time-lock mechanism
     * @dev Implements a secure admin transfer process with a mandatory waiting period
     * @param current The current admin address
     * @param proposed The proposed new admin address
     * @param timeToExecuteProposal The timestamp when the proposal can be executed (1 day after proposal)
     */
    struct AddressTypeProposal {
        address current;
        address proposed;
        uint256 timeToExecuteProposal;
    }

    // 🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮶 Music functions 🮵🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙

    /**
     * @notice Creates a new song drop.
     * @dev This function allows an artist to create a new song drop with metadata.
     * @param title The title of the song.
     * @param artistName The name of the artist.
     * @param mediaURI The URI of the song media.
     * @param metadataURI The URI of the song metadata.
     * @param artistAddress The address of the artist.
     * @param tags An array of tags associated with the song.
     * @param price The price per mint in wei.
     * @param isAnSpecialEdition Indicates if this song is a special edition.
     * @param specialEditionName The name of the special edition, if applicable.
     * @param maxSupplySpecialEdition The maximum supply for special edition songs.
     * @return songId The unique identifier assigned to the newly created song
     *
     * @notice  songId, title, artistName, mediaURI, metadataURI, artistAddress, 
     *          tags, price can be edited later 
     * 
     *          IMPORTANT: be careful with isAnSpecialEdition, specialEditionName,
     *          maxSupplySpecialEdition, they can't be changed after creation.
     */
    function newSong(
        string memory title,
        string memory artistName,
        string memory mediaURI,
        string memory metadataURI,
        address artistAddress,
        string[] memory tags,
        uint256 price,
        bool isAnSpecialEdition,
        string memory specialEditionName,
        uint256 maxSupplySpecialEdition
    ) external returns (uint256 songId);

    /**
     * @notice Allows the artist to edit the metadata of their song.
     * @dev This function allows the artist to update the song's title, artist name, media URI, metadata URI, tags, and price.
     * @param songId The ID of the song to edit.
     * @param title The new title of the song.
     * @param artistName The new name of the artist.
     * @param mediaURI The new URI of the song media.
     * @param metadataURI The new URI of the song metadata.
     * @param tags An array of new tags associated with the song.
     * @param price The new price per mint in wei.
     */
    function editSongMetadata(
        uint256 songId,
        string memory title,
        string memory artistName,
        string memory mediaURI,
        string memory metadataURI,
        address artistAddress,
        string[] memory tags,
        uint256 price
    ) external;

    /**
     * @notice Allows users to buy multiple song drops and pay only once for the operation fee.
     * @dev This function checks if the user owns the song,
     *      if the song exists, and if the max supply is reached.
     * @param songIds An array of song IDs to purchase.
     * @param farcasterId The ID of the user making the purchase.
     */
    function buy(
        uint256[] memory songIds,
        uint256 farcasterId
    ) external payable;

    /**
     * @notice Allows users to instantly buy an song drop.
     * @dev This function checks if the user owns the song, if the song exists, and if the max supply is reached.
     * @notice This function is designed for single song purchases and requires the user to pay the operation fee.
     * @param songId The ID of the song to purchase.
     * @param farcasterId The ID of the user making the purchase.
     */
    function instaBuy(uint256 songId, uint256 farcasterId) external payable;

    // 🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮶 Admin functions 🮵🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙

    /**
     * @notice Proposes a new admin address with a time-lock mechanism
     * @dev Initiates the admin change process with a 1-day waiting period before execution
     * @param newAdmin The address proposed to become the new admin
     */
    function proposeNewAdminAddress(address newAdmin) external;

    /**
     * @notice Cancels a pending admin address proposal
     * @dev Resets the proposed admin and execution time to zero, effectively canceling the proposal
     */
    function cancelNewAdminAddress() external;

    /**
     * @notice Executes a pending admin address change after the time-lock period
     * @dev Finalizes the admin change if the time-lock period has passed and a proposal exists
     */
    function executeNewAdminAddress() external;

    /**
     * @notice Allows admin to withdraw ETH from the contract
     * @dev Transfers a specified amount of ETH to a given address, only callable by admin
     * @param to The address to receive the withdrawn ETH
     * @param amount The amount of ETH to withdraw in wei
     */
    function withdraw(address to, uint256 amount) external;

    // 🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮶 Getters 🮵🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙

    /**
     * @notice Returns the current admin structure containing the admin address and proposal details
     * @dev Provides access to the current admin and any pending proposals for admin changes
     * @return The current admin structure with address and proposal details
     */
    function getAdminStructure()
        external
        view
        returns (AddressTypeProposal memory);

    /**
     * @notice Returns the current operation fee charged for each transaction
     * @dev This fee is added to the total cost of song purchases
     * @return The current operation fee in wei
     */
    function getOperationFee() external pure returns (uint256);

    /**
     * @notice Calculates the total price for purchasing multiple song tracks
     * @dev Iterates through song IDs, sums their prices, and adds the operation fee
     * @param songIds An array of song IDs to calculate the total price for
     * @return totalPrice The total cost including operation fee
     */
    function getTotalPriceForBuy(
        uint256[] memory songIds
    ) external view returns (uint256 totalPrice);

    /**
     * @notice Returns the total number of song tracks created
     * @dev Gets the current value of the token ID counter
     * @return The total count of song tracks that have been created
     */
    function getTotalSongCount() external view returns (uint256);

    /**
     * @notice Retrieves the complete metadata for a specific song track
     * @dev Returns all stored information about an song including title, artist, URIs, etc.
     * @param songId The unique identifier of the song track
     * @return SongMetadata struct containing all metadata information
     */
    function getSongMetadata(
        uint256 songId
    ) external view returns (SongMetadata memory);

    /**
     * @notice Gets all song IDs owned by a specific Farcaster user
     * @dev Returns an array of song IDs that the user has purchased
     * @param farcasterId The Farcaster ID of the user
     * @return Array of song IDs owned by the user
     */
    function getUserCollection(
        uint256 farcasterId
    ) external view returns (uint256[] memory);

    /**
     * @notice Returns the number of song tracks owned by a user
     * @dev Gets the length of the user's collection array
     * @param farcasterId The Farcaster ID of the user
     * @return The total number of song tracks owned by the user
     */
    function getAmountOfSongOwned(
        uint256 farcasterId
    ) external view returns (uint256);

    /**
     * @notice Checks if an song ID exists in the system
     * @dev Verifies existence by checking if the artist address is not zero
     * @param songId The song ID to check
     * @return True if the song exists, false otherwise
     */
    function songIdExists(uint256 songId) external view returns (bool);

    /**
     * @notice Checks if a user owns a specific song track
     * @dev Looks up ownership status in the userSongOwnership mapping
     * @param farcasterId The Farcaster ID of the user
     * @param songId The song ID to check ownership for
     * @return True if the user owns the song, false otherwise
     */
    function userOwnsSong(
        uint256 farcasterId,
        uint256 songId
    ) external view returns (bool);
}
