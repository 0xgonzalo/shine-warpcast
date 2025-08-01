// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {EventsLib} from "@shine/lib/EventsLib.sol";
import {SafeTransferLib} from "@solady/utils/SafeTransferLib.sol";

contract AudioDataBase {
    // Mapping from token ID to audio metadata
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

    uint256 private _nextTokenId;

    uint256 private constant OPERATION_FEE = 0.0000555 ether;

    AddressTypeProposal private admin;

    mapping(uint256 audioId => AudioMetadata metadata) private audio;
    mapping(uint256 farcasterId => uint256[] audioIds) private userCollection;
    mapping(uint256 farcasterId => mapping(uint256 audioId => bool isOwned))
        private userAudioOwnership;

    modifier onlyAdmin() {
        if (msg.sender != admin.current) revert();
        _;
    }

    constructor(address _admin) {
        admin.current = _admin;
    }

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
        if (artistAddress == address(0)) revert();

        if (
            bytes(title).length == 0 ||
            bytes(artistName).length == 0 ||
            bytes(mediaURI).length == 0 ||
            bytes(metadataURI).length == 0
        ) revert();

        if (maxSupply == 0) revert();

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

    function buy(
        uint256[] memory audioIds,
        uint256 farcasterId
    ) external payable {
        if (audioIds.length == 0) revert();

        uint256 totalCost;
        uint256 audioId;

        for (uint256 i = 0; i < audioIds.length; i++) {
            audioId = audioIds[i];

            if (!audioIdExists(audioId)) revert();

            if (userOwnsAudio(farcasterId, audioId)) revert();

            if (audio[audioId].currentSupply >= audio[audioId].maxSupply)
                revert();

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

    function instaBuy(uint256 audioId, uint256 farcasterId) external payable {
        if (!audioIdExists(audioId)) revert();

        if (userOwnsAudio(farcasterId, audioId)) revert();

        if (audio[audioId].currentSupply >= audio[audioId].maxSupply) revert();

        checkPayment(audio[audioId].pricePerMint);

        updateUserCollection(farcasterId, audioId);

        giveAmountToArtist(audioId);

        emit EventsLib.UserInstaBuy(audioId, farcasterId);
    }

    function proposeNewAdminAddress(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert();

        admin.proposed = newAdmin;
        admin.timeToExecuteProposal = block.timestamp + 1 days;
    }

    function cancelNewAdminAddress() external onlyAdmin {
        admin.proposed = address(0);
        admin.timeToExecuteProposal = 0;
    }

    function executeNewAdminAddress() external {
        if (msg.sender != admin.current) revert();

        if (admin.proposed == address(0)) revert();

        if (block.timestamp < admin.timeToExecuteProposal) revert();

        admin = AddressTypeProposal({
            current: admin.proposed,
            proposed: address(0),
            timeToExecuteProposal: 0
        });
    }

    function withdraw(address to, uint256 amount) external onlyAdmin {
        if (to == address(0)) revert();
        if (amount == 0) revert();

        SafeTransferLib.safeTransferETH(to, amount);
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

    function getTotalAudioCount() external view returns (uint256) {
        return _nextTokenId;
    }

    function getAudioMetadata(
        uint256 audioId
    ) external view returns (AudioMetadata memory) {
        if (!audioIdExists(audioId)) revert();
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

        if (msg.value < total) revert();

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
