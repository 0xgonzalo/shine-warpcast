// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
    mapping(uint256 farcasterId => mapping(uint256 audioId => bool isOwned)) private userAudioOwnership;

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
            titel.length == 0 ||
            artistName.length == 0 ||
            mediaURI.length == 0 ||
            metadataURI.length == 0
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
            maxSupply: maxSupply
            currentSupply: 0
        });
    }

    function buy(
        uint256[] memory audioIds,
        uint256 farcasterId
    ) external payable {
        if (audioIds.length == 0) revert();

        uint256 totalCost = OPERATION_FEE;

        for (uint256 i = 0; i < audioIds.length; i++) {
            uint256 audioId = audioIds[i];

            if (!audioIdExists(audioId)) revert();

            if (userAudioOwnership[farcasterId][audioId]) revert();

            if (audio[audioId].currentSupply >= audio[audioId].maxSupply) revert();

            userCollection[farcasterId].push(audioId);
            userAudioOwnership[farcasterId][audioId] = true;
            audio[audioId].currentSupply++;
            totalCost += audio[audioId].pricePerMint;
        }

        if (msg.value < totalCost) revert();

        if (msg.value > totalCost) {
            (bool sent, ) = payable(msg.sender).call{value: msg.value - totalCost}("");
            if(!sent) revert("Failed to refund excess payment");
        }


    }

    function audioIdExists(uint256 audioId) public view returns (bool) {
        return audio[audioId].artistAddress != address(0);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        require(exists(tokenId), "Token does not exist");
        return audioMetadata[tokenId].audioURI;
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return audioMetadata[tokenId].creator != address(0);
    }

    function getMetadata(
        uint256 tokenId
    ) public view returns (AudioMetadata memory) {
        require(exists(tokenId), "Token does not exist");
        return audioMetadata[tokenId];
    }
}
