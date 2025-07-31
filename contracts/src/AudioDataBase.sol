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
        });
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
