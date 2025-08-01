// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
    ___ _ _____  _____ シ
  ,' _//// / / |/ / _/ ャ
 _\ `./ ` / / || / _/  イ
/___,/_n_/_/_/|_/___/  ヌ
                      
                                                            
 * @title Shine Audio DataBase
 * @author 11:11 Labs 
 * @notice This contract manages audio metadata, user purchases, 
 *         and admin functionalities for the Shine platform.
 */

import {ErrorsLib} from "@shine/lib/ErrorsLib.sol";
import {EventsLib} from "@shine/lib/EventsLib.sol";
import {SafeTransferLib} from "@solady/utils/SafeTransferLib.sol";

contract AudioDataBase {
    // 🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮶 Structs 🮵🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙

    struct AudioMetadata {
        string title;
        string artistName;
        string mediaURI;
        string metadataURI;
        address artistAddress;
        string[] tags;
        uint256 pricePerMint; // Price per mint in wei
        uint256 maxSupply;
        uint256 currentSupply; // Current supply of the audio
    }

    struct AddressTypeProposal {
        address current;
        address proposed;
        uint256 timeToExecuteProposal;
    }

    // 🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮶 State Variables 🮵🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙

    uint256 private _nextTokenId;
    uint256 private constant OPERATION_FEE = 0.0000555 ether;
    AddressTypeProposal private admin;

    // 🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮶 Mappings 🮵🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙

    mapping(uint256 audioId => AudioMetadata metadata) private audio;
    mapping(uint256 farcasterId => uint256[] audioIds) private userCollection;
    mapping(uint256 farcasterId => mapping(uint256 audioId => bool isOwned))
        private userAudioOwnership;

    // 🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮶 Modifiers 🮵🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙
    modifier onlyAdmin() {
        if (msg.sender != admin.current)
            revert ErrorsLib.SenderIsNotAuthorized();
        _;
    }

    // 🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮶 Constructor 🮵🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙
    constructor(address _admin) {
        admin.current = _admin;
    }

    // 🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮶 Music functions 🮵🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙

    /**
     * @notice Creates a new audio drop.
     * @dev This function allows an artist to create a new audio drop with metadata.
     * @param title The title of the audio.
     * @param artistName The name of the artist.
     * @param mediaURI The URI of the audio media.
     * @param metadataURI The URI of the audio metadata.
     * @param artistAddress The address of the artist.
     * @param tags An array of tags associated with the audio.
     * @param pricePerMint The price per mint in wei.
     * @param maxSupply The maximum supply of the audio.
     */
    function newAudio(
        string memory title,
        string memory artistName,
        string memory mediaURI,
        string memory metadataURI,
        address artistAddress,
        string[] memory tags,
        uint256 pricePerMint,
        uint256 maxSupply
    ) public returns (uint256 audioId) {
        if (
            artistAddress == address(0) ||
            bytes(title).length == 0 ||
            bytes(artistName).length == 0 ||
            bytes(mediaURI).length == 0 ||
            bytes(metadataURI).length == 0 ||
            maxSupply == 0
        ) revert ErrorsLib.InvalidMetadataInput();

        audioId = _nextTokenId++;

        audio[audioId] = AudioMetadata({
            title: title,
            artistName: artistName,
            mediaURI: mediaURI,
            metadataURI: metadataURI,
            artistAddress: artistAddress,
            tags: tags,
            pricePerMint: pricePerMint,
            maxSupply: maxSupply,
            currentSupply: 0
        });

        emit EventsLib.NewAudioDrop(
            audioId,
            title,
            artistName,
            mediaURI,
            metadataURI,
            artistAddress,
            pricePerMint,
            maxSupply
        );
    }

    /**
     * @notice Allows users to buy multiple audio drops and pay only once for the operation fee.
     * @dev This function checks if the user owns the audio,
     *      if the audio exists, and if the max supply is reached.
     * @param audioIds An array of audio IDs to purchase.
     * @param farcasterId The ID of the user making the purchase.
     */
    function buy(
        uint256[] memory audioIds,
        uint256 farcasterId
    ) external payable {
        if (audioIds.length == 0) revert ErrorsLib.ListIsEmpty();

        uint256 totalCost;
        uint256 audioId;

        for (uint256 i = 0; i < audioIds.length; i++) {
            audioId = audioIds[i];

            if (!audioIdExists(audioId)) revert ErrorsLib.InvalidAudioId();

            if (userOwnsAudio(farcasterId, audioId))
                revert ErrorsLib.UserOwnsAudio();

            if (audio[audioId].currentSupply >= audio[audioId].maxSupply)
                revert ErrorsLib.AudioMaxSupplyReached();

            updateUserCollection(farcasterId, audioId);

            totalCost += audio[audioId].pricePerMint;
        }

        checkPayment(totalCost);

        for (uint256 i = 0; i < audioIds.length; i++) {
            audioId = audioIds[i];
            giveAmountToArtist(audioId);
        }

        emit EventsLib.UserBuy(audioIds, farcasterId);
    }

    /**
     * @notice Allows users to instantly buy an audio drop.
     * @dev This function checks if the user owns the audio, if the audio exists, and if the max supply is reached.
     * @notice This function is designed for single audio purchases and requires the user to pay the operation fee.
     * @param audioId The ID of the audio to purchase.
     * @param farcasterId The ID of the user making the purchase.
     */
    function instaBuy(uint256 audioId, uint256 farcasterId) external payable {
        if (!audioIdExists(audioId)) revert ErrorsLib.InvalidAudioId();

        if (userOwnsAudio(farcasterId, audioId))
            revert ErrorsLib.UserOwnsAudio();

        if (audio[audioId].currentSupply >= audio[audioId].maxSupply)
            revert ErrorsLib.AudioMaxSupplyReached();

        checkPayment(audio[audioId].pricePerMint);

        updateUserCollection(farcasterId, audioId);

        giveAmountToArtist(audioId);

        emit EventsLib.UserInstaBuy(audioId, farcasterId);
    }

    // 🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮶 Admin functions 🮵🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙
    function proposeNewAdminAddress(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0))
            revert ErrorsLib.NewAdminAddressCannotBeZero();

        admin.proposed = newAdmin;
        admin.timeToExecuteProposal = block.timestamp + 1 days;
    }

    function cancelNewAdminAddress() external onlyAdmin {
        admin.proposed = address(0);
        admin.timeToExecuteProposal = 0;
    }

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

    function withdraw(address to, uint256 amount) external onlyAdmin {
        if (to == address(0)) revert ErrorsLib.AdminCantBurnEth();
        if (amount == 0) revert ErrorsLib.AmountCannotBeZero();

        SafeTransferLib.safeTransferETH(to, amount);
    }

    // 🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮶 Getters 🮵🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙

    function getTotalAudioCount() external view returns (uint256) {
        return _nextTokenId;
    }

    function getAudioMetadata(
        uint256 audioId
    ) external view returns (AudioMetadata memory) {
        if (!audioIdExists(audioId)) revert ErrorsLib.InvalidAudioId();

        return audio[audioId];
    }

    function getUserCollection(
        uint256 farcasterId
    ) external view returns (uint256[] memory) {
        return userCollection[farcasterId];
    }

    function getAmountOfAudioOwned(
        uint256 farcasterId
    ) external view returns (uint256) {
        return userCollection[farcasterId].length;
    }

    function audioIdExists(uint256 audioId) public view returns (bool) {
        return audio[audioId].artistAddress != address(0);
    }

    function userOwnsAudio(
        uint256 farcasterId,
        uint256 audioId
    ) public view returns (bool) {
        return userAudioOwnership[farcasterId][audioId];
    }

    // 🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮶 Internal functions 🮵🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙🮙
    function updateUserCollection(
        uint256 farcasterId,
        uint256 audioId
    ) internal {
        userCollection[farcasterId].push(audioId);
        userAudioOwnership[farcasterId][audioId] = true;
        audio[audioId].currentSupply++;
    }

    function checkPayment(uint256 totalCostOfAudio) internal {
        uint256 total = OPERATION_FEE + totalCostOfAudio;

        if (msg.value < total) revert ErrorsLib.AmountTooLow(msg.value, total);

        // le da el cambio al usuario si paga de más
        if (msg.value > total)
            SafeTransferLib.safeTransferETH(msg.sender, msg.value - total);
    }

    function giveAmountToArtist(uint256 audioId) internal {
        SafeTransferLib.safeTransferETH(
            audio[audioId].artistAddress,
            audio[audioId].pricePerMint
        );
    }
}
