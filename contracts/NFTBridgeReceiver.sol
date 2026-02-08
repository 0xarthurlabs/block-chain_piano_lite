// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {WrappedNFT} from "./WrappedNFT.sol";

contract NFTBridgeReceiver is CCIPReceiver,Ownable {

    WrappedNFT public wnft;

    // whitelist of expected senders on source chains: sourceChainSelector => senderAddress
    mapping(uint64 => address) public trustedSenders;

    // messageId dedupe (Any2EVMMessage has messageId: bytes32)
    mapping(bytes32 => bool) public processed;

    event NFTReceived(address indexed receiver, uint256 tokenId, string tokenURI);

    constructor(address router,address wnftAddress) CCIPReceiver(router)
        Ownable(msg.sender) {
        wnft = WrappedNFT(wnftAddress);
    }

    // owner can set trusted senders
    function setTrustedSender(uint64 chainSelector, address sender) external onlyOwner {
        trustedSenders[chainSelector] = sender;
    }

    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {

        // 1) verify original sender on source chain
        address srcSender = abi.decode(message.sender, (address));
        require(trustedSenders[message.sourceChainSelector] != address(0), "trusted sender not set");
        require(srcSender == trustedSenders[message.sourceChainSelector], "invalid src sender");

        // 2) dedupe by messageId
        require(!processed[message.messageId], "message processed");
        // decode payload safely
        (address to, uint256 tokenId, string memory tokenURI) = abi.decode(message.data, (address, uint256, string));

        require(to != address(0), "zero to");
        require(bytes(tokenURI).length <= 2000, "uri too long"); // tunable

        // 3) optionally check token existence via wnft.exists
        // if WrappedNFT provides exists() we can call it (avoid reverts)
        //if (wnft.exists(tokenId)) revert("token exists");

        // 4) attempt mint — if this throws we allow revert so CCIP marks as failed and can be retried / recovered
        wnft.mintWithSpecificTokenId(to, tokenId, tokenURI);

        // 5) mark processed only after success
        processed[message.messageId] = true;

        emit NFTReceived(to, tokenId, tokenURI);
    }
}