// SPDX-License-Identifier: GPL-3.0 
pragma solidity ^0.8.20;

import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {NFTCollectible} from "./NFTCollectible.sol";

/**
 * @title NFTBridgeSender
 * @dev Cross-chain NFT sender contract. Not abstract; compatible with Ownable(address)
 */
contract NFTBridgeSender is Ownable {
    /// @notice On-chain CCIP router interface
    IRouterClient public immutable i_router;
    /// @notice LINK token used to pay fees
    LinkTokenInterface public immutable i_link;
    /// @notice Associated NFT contract
    NFTCollectible public immutable nft;

    /**
     * @param initialOwner The initial owner of the contract (for Ownable)
     * @param router The address of the CCIP router contract
     * @param linkToken The address of the LINK token
     * @param nftAddress The address of the NFT contract to send from
     */
    constructor(
        address initialOwner,
        address router,
        address linkToken,
        address nftAddress
    ) Ownable(initialOwner) {
        i_router = IRouterClient(router);
        i_link = LinkTokenInterface(linkToken);
        nft = NFTCollectible(nftAddress);
    }

    /**
     * @notice Send an NFT cross-chain
     * @param destinationChainSelector The destination chain selector
     * @param receiver The destination chain receiver address (ABI-encoded)
     * @param tokenId The NFT token ID
     * @param tokenURI The NFT URI (optional)
     */
    function sendNFT(
        uint64 destinationChainSelector,
        address receiver,
        address account,
        uint256 tokenId,
        string calldata tokenURI
    ) external returns (bytes32 messageId) {
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner of NFT");

        nft.burn(tokenId);

        bytes memory data = abi.encode(account, tokenId, tokenURI);

        // Create an empty EVMTokenAmount array directly inside the message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: data,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 300_000})
            ),
            feeToken: address(i_link)
        });

        uint256 fee = i_router.getFee(destinationChainSelector, message);
        require(
            i_link.transferFrom(msg.sender, address(this), fee),
            "LINK transfer failed"
        );
        require(i_link.approve(address(i_router), fee), "LINK approve failed");

        messageId = i_router.ccipSend(destinationChainSelector, message);
    }
}
