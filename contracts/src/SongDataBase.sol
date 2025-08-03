// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
    ___ _ _____  _____ シ
  ,' _//// / / |/ / _/ ャ
 _\ `./ ` / / || / _/  イ
/___,/_n_/_/_/|_/___/  ヌ
                      
                                                            
 * @title Shine SongDataBase
 * @author 11:11 Labs 
 * @notice This contract manages song metadata, user purchases, 
 *         and admin functionalities for the Shine platform.
 */

import {ErrorsLib} from "@shine/lib/ErrorsLib.sol";
import {EventsLib} from "@shine/lib/EventsLib.sol";
import {SafeTransferLib} from "@solady/utils/SafeTransferLib.sol";

contract SongDataBase {
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

    // 🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮶 State Variables 🮵🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙

    /// @notice Counter for generating unique song IDs, starts at 0 and increments with each new song
    uint256 private _nextTokenId;

    /// @notice Fixed operation fee charged for each transaction in addition to the song price
    uint256 private constant OPERATION_FEE = 0.0000555 ether;

    /// @notice Admin management struct with time-lock functionality for secure admin transfers
    AddressTypeProposal private admin;

    // 🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮶 Mappings 🮵🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙

    /// @notice Maps song IDs to their complete metadata information
    mapping(uint256 songId => SongMetadata metadata) private song;

    /// @notice Maps Farcaster user IDs to arrays of song IDs they own
    mapping(uint256 farcasterId => uint256[] songIds) private userCollection;

    /// @notice Maps Farcaster user IDs to song IDs to check ownership status efficiently
    mapping(uint256 farcasterId => mapping(uint256 songId => bool isOwned))
        private userSongOwnership;

    // 🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮶 Modifiers 🮵🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙

    /**
     * @notice Restricts function access to the current admin address only
     * @dev Reverts with SenderIsNotAuthorized error if caller is not the current admin
     */
    modifier onlyAdmin() {
        if (msg.sender != admin.current)
            revert ErrorsLib.SenderIsNotAuthorized();
        _;
    }

    // 🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮶 Constructor 🮵🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙

    /**
     * @notice Initializes the contract with the initial admin address
     * @dev Sets the initial admin and initializes the admin proposal struct
     * @param _admin The address that will be set as the initial admin of the contract
     */
    constructor(address _admin) {
        admin.current = _admin;
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
    ) public returns (uint256 songId) {
        if (
            artistAddress == address(0) ||
            bytes(title).length == 0 ||
            bytes(artistName).length == 0 ||
            bytes(mediaURI).length == 0 ||
            bytes(metadataURI).length == 0
        ) revert ErrorsLib.InvalidMetadataInput();

        _nextTokenId++;

        song[_nextTokenId] = SongMetadata({
            title: title,
            artistName: artistName,
            mediaURI: mediaURI,
            metadataURI: metadataURI,
            artistAddress: artistAddress,
            tags: tags,
            price: price,
            timesBought: 0,
            isAnSpecialEdition: isAnSpecialEdition,
            specialEditionName: isAnSpecialEdition ? specialEditionName : "",
            maxSupplySpecialEdition: isAnSpecialEdition
                ? maxSupplySpecialEdition
                : 0
        });

        if (isAnSpecialEdition) {
            emit EventsLib.NewSpecialEditionSongDrop(
                _nextTokenId,
                title,
                artistName,
                mediaURI,
                metadataURI,
                artistAddress,
                price,
                specialEditionName,
                maxSupplySpecialEdition
            );
        } else {
            emit EventsLib.NewSongDrop(
                _nextTokenId,
                title,
                artistName,
                mediaURI,
                metadataURI,
                artistAddress,
                price
            );
        }

        return _nextTokenId;
    }

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
    ) external payable {
        if (songIds.length == 0) revert ErrorsLib.ListIsEmpty();

        uint256 totalCost;
        uint256 songId;

        for (uint256 i = 0; i < songIds.length; i++) {
            songId = songIds[i];

            if (!songIdExists(songId)) revert ErrorsLib.InvalidSongId();

            if (song[songId].isAnSpecialEdition) {
                if (!isSpecialEditionAvailable(songId))
                    revert ErrorsLib.EspecialEditionMaxSupplyReached();
            }

            if (userOwnsSong(farcasterId, songId))
                revert ErrorsLib.UserOwnsSong();

            updateUserCollection(farcasterId, songId);

            totalCost += song[songId].price;
        }

        checkPayment(totalCost);

        for (uint256 i = 0; i < songIds.length; i++) {
            songId = songIds[i];
            giveAmountToArtist(songId);
        }

        emit EventsLib.UserBuy(songIds, farcasterId);
    }

    /**
     * @notice Allows users to instantly buy an song drop.
     * @dev This function checks if the user owns the song, if the song exists, and if the max supply is reached.
     * @notice This function is designed for single song purchases and requires the user to pay the operation fee.
     * @param songId The ID of the song to purchase.
     * @param farcasterId The ID of the user making the purchase.
     */
    function instaBuy(uint256 songId, uint256 farcasterId) external payable {
        if (!songIdExists(songId)) revert ErrorsLib.InvalidSongId();

        if (song[songId].isAnSpecialEdition) {
            if (!isSpecialEditionAvailable(songId))
                revert ErrorsLib.EspecialEditionMaxSupplyReached();
        }

        if (userOwnsSong(farcasterId, songId)) revert ErrorsLib.UserOwnsSong();

        checkPayment(song[songId].price);

        updateUserCollection(farcasterId, songId);

        giveAmountToArtist(songId);

        emit EventsLib.UserInstaBuy(songId, farcasterId);
    }

    // 🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮶 Admin functions 🮵🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙

    /**
     * @notice Proposes a new admin address with a time-lock mechanism
     * @dev Initiates the admin change process with a 1-day waiting period before execution
     * @param newAdmin The address proposed to become the new admin
     */
    function proposeNewAdminAddress(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0))
            revert ErrorsLib.NewAdminAddressCannotBeZero();

        admin.proposed = newAdmin;
        admin.timeToExecuteProposal = block.timestamp + 1 days;
    }

    /**
     * @notice Cancels a pending admin address proposal
     * @dev Resets the proposed admin and execution time to zero, effectively canceling the proposal
     */
    function cancelNewAdminAddress() external onlyAdmin {
        admin.proposed = address(0);
        admin.timeToExecuteProposal = 0;
    }

    /**
     * @notice Executes a pending admin address change after the time-lock period
     * @dev Finalizes the admin change if the time-lock period has passed and a proposal exists
     */
    function executeNewAdminAddress() external onlyAdmin {
        if (admin.proposed == address(0))
            revert ErrorsLib.NewAdminNotProposed();

        if (block.timestamp < admin.timeToExecuteProposal)
            revert ErrorsLib.TimeToExecuteProposalNotReached();

        admin = AddressTypeProposal({
            current: admin.proposed,
            proposed: address(0),
            timeToExecuteProposal: 0
        });
    }

    /**
     * @notice Allows admin to withdraw ETH from the contract
     * @dev Transfers a specified amount of ETH to a given address, only callable by admin
     * @param to The address to receive the withdrawn ETH
     * @param amount The amount of ETH to withdraw in wei
     */
    function withdraw(address to, uint256 amount) external onlyAdmin {
        if (to == address(0)) revert ErrorsLib.AdminCantBurnEth();
        if (amount == 0) revert ErrorsLib.AmountCannotBeZero();

        SafeTransferLib.safeTransferETH(to, amount);
    }

    // 🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮶 Getters 🮵🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙
    /**
     * @notice Checks if a special edition song is available for purchase
     * @dev Returns false if the song is a special edition and its max supply has been reached
     * @param songId The ID of the song to check availability for
     * @return True if the special edition is available, false otherwise
     */
    function isSpecialEditionAvailable(
        uint256 songId
    ) public view returns (bool) {
        if (
            song[songId].isAnSpecialEdition &&
            song[songId].timesBought >= song[songId].maxSupplySpecialEdition
        ) return false;
        else return true;
    }

    /**
     * @notice Returns the current admin structure containing the admin address and proposal details
     * @dev Provides access to the current admin and any pending proposals for admin changes
     * @return The current admin structure with address and proposal details
     */
    function getAdminStructure()
        external
        view
        returns (AddressTypeProposal memory)
    {
        return admin;
    }

    /**
     * @notice Returns the current operation fee charged for each transaction
     * @dev This fee is added to the total cost of song purchases
     * @return The current operation fee in wei
     */
    function getOperationFee() external pure returns (uint256) {
        return OPERATION_FEE;
    }

    /**
     * @notice Calculates the total price for purchasing multiple song tracks
     * @dev Iterates through song IDs, sums their prices, and adds the operation fee
     * @param songIds An array of song IDs to calculate the total price for
     * @return totalPrice The total cost including operation fee
     */
    function getTotalPriceForBuy(
        uint256[] memory songIds
    ) external view returns (uint256 totalPrice) {
        for (uint256 i = 0; i < songIds.length; i++) {
            uint256 songId = songIds[i];
            if (!songIdExists(songId)) revert ErrorsLib.InvalidSongId();
            totalPrice += song[songId].price;
        }
        return totalPrice + OPERATION_FEE;
    }

    /**
     * @notice Returns the total number of song tracks created
     * @dev Gets the current value of the token ID counter
     * @return The total count of song tracks that have been created
     */
    function getTotalSongCount() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @notice Retrieves the complete metadata for a specific song track
     * @dev Returns all stored information about an song including title, artist, URIs, etc.
     * @param songId The unique identifier of the song track
     * @return SongMetadata struct containing all metadata information
     */
    function getSongMetadata(
        uint256 songId
    ) external view returns (SongMetadata memory) {
        if (!songIdExists(songId)) revert ErrorsLib.InvalidSongId();

        return song[songId];
    }

    /**
     * @notice Gets all song IDs owned by a specific Farcaster user
     * @dev Returns an array of song IDs that the user has purchased
     * @param farcasterId The Farcaster ID of the user
     * @return Array of song IDs owned by the user
     */
    function getUserCollection(
        uint256 farcasterId
    ) external view returns (uint256[] memory) {
        return userCollection[farcasterId];
    }

    /**
     * @notice Returns the number of song tracks owned by a user
     * @dev Gets the length of the user's collection array
     * @param farcasterId The Farcaster ID of the user
     * @return The total number of song tracks owned by the user
     */
    function getAmountOfSongOwned(
        uint256 farcasterId
    ) external view returns (uint256) {
        return userCollection[farcasterId].length;
    }

    /**
     * @notice Checks if an song ID exists in the system
     * @dev Verifies existence by checking if the artist address is not zero
     * @param songId The song ID to check
     * @return True if the song exists, false otherwise
     */
    function songIdExists(uint256 songId) public view returns (bool) {
        return song[songId].artistAddress != address(0);
    }

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
    ) public view returns (bool) {
        return userSongOwnership[farcasterId][songId];
    }

    // 🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮶 Internal functions 🮵🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙

    /**
     * @notice Updates user's collection and ownership records when purchasing song
     * @dev Adds song to user's collection, marks ownership, and increments supply
     * @param farcasterId The Farcaster ID of the user purchasing the song
     * @param songId The ID of the song being purchased
     */
    function updateUserCollection(
        uint256 farcasterId,
        uint256 songId
    ) internal {
        userCollection[farcasterId].push(songId);
        userSongOwnership[farcasterId][songId] = true;
        song[songId].timesBought++;
    }

    /**
     * @notice Validates payment amount and handles refunds for overpayment
     * @dev Checks if payment covers song cost plus operation fee, refunds excess
     * @param totalCostOfSong The total cost of all song tracks being purchased
     */
    function checkPayment(uint256 totalCostOfSong) internal {
        uint256 total = OPERATION_FEE + totalCostOfSong;

        if (msg.value < total) revert ErrorsLib.AmountTooLow(msg.value, total);

        // le da el cambio al usuario si paga de más
        if (msg.value > total)
            SafeTransferLib.safeTransferETH(msg.sender, msg.value - total);
    }

    /**
     * @notice Transfers payment to the artist for their song track
     * @dev Sends the song's mint price to the artist's address
     * @param songId The ID of the song whose artist should be paid
     */
    function giveAmountToArtist(uint256 songId) internal {
        SafeTransferLib.safeTransferETH(
            song[songId].artistAddress,
            song[songId].price
        );
    }
}
