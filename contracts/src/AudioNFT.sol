// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract AudioNFT is ERC1155, Ownable {
    using Strings for uint256;

    // Mapping from token ID to audio metadata
    struct AudioMetadata {
        string name;
        string description;
        string audioURI;
        string imageURI;
        address creator;
    }

    mapping(uint256 => AudioMetadata) public audioMetadata;
    uint256 private _nextTokenId;

    constructor() ERC1155("") Ownable(msg.sender) {}

    function mint(
        address to,
        string memory name,
        string memory description,
        string memory audioURI,
        string memory imageURI,
        uint256 amount
    ) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        audioMetadata[tokenId] = AudioMetadata({
            name: name,
            description: description,
            audioURI: audioURI,
            imageURI: imageURI,
            creator: msg.sender
        });

        _mint(to, tokenId, amount, "");
        return tokenId;
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        require(exists(tokenId), "Token does not exist");
        return audioMetadata[tokenId].audioURI;
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return audioMetadata[tokenId].creator != address(0);
    }

    function getMetadata(uint256 tokenId) public view returns (AudioMetadata memory) {
        require(exists(tokenId), "Token does not exist");
        return audioMetadata[tokenId];
    }
} 