//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {NFTCollectible} from "./NFTCollectible.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract WrappedNFT is NFTCollectible {

    constructor(string memory tokenName, string memory tokenSymbol) 
        NFTCollectible(tokenName, tokenSymbol) {
    }

    function mintWithSpecificTokenId(address to, uint256 _tokenId, string memory tokenURI) external onlyRole(MINTER_ROLE) {
        require(to != address(0), "WrappedNFT: zero to");
        _safeMint(to, _tokenId);
        _setTokenURI(_tokenId, tokenURI);
    }
    
}