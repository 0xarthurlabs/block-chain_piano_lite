// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PlatformToken.sol";
import "./NFTCollectible.sol";

/**
 * @title PianoGuessGame
 * @dev user spend PTK to guess then be aligiable to reedeem speciafic NFT
 */
contract PianoGuessGame is Ownable {
    struct Composition { string url; string performer; }
    Composition[] public compositions;

    PlatformToken public platformToken;
    NFTCollectible public nftContract;
    uint256 public constant COST = 200 * 10**18;
    mapping(address => uint256) public correctCount;

    event GuessResult(address indexed user, bool correct, uint256 totalCorrect);
    event NFTRedeemed(address indexed user, uint256 tokenId);

    constructor(
        address _tokenAddress,
        address _nftContract,
        string[5] memory urls,
        string[5] memory performers
    )
        Ownable(msg.sender) 
    {
        platformToken = PlatformToken(_tokenAddress);
        nftContract = NFTCollectible(_nftContract);
        for (uint256 i = 0; i < 5; i++) {
            compositions.push(Composition({url: urls[i], performer: performers[i]}));
        }
    }

    function guess(uint256 idx, string calldata guessPerformer) external {
        require(idx < compositions.length, "Invalid index");
        require(platformToken.transferFrom(msg.sender, address(this), COST), "PTK transfer failed");
        bool correct = keccak256(bytes(guessPerformer)) == keccak256(bytes(compositions[idx].performer));
        if (correct) correctCount[msg.sender]++;
        emit GuessResult(msg.sender, correct, correctCount[msg.sender]);
    }

    /**
     * @param tokenId user redeem NFT from tokenId
     */
    function redeemNFT(uint256 tokenId) external {
        require(correctCount[msg.sender] >= 3, "Not enough correct guesses");
        // 从  mint nft to user from NFTCollectible
        nftContract.mint(msg.sender, tokenId);
        // minus user correctCount
        correctCount[msg.sender] -= 3;
        emit NFTRedeemed(msg.sender, tokenId);
    }

    function totalCompositions() external view returns (uint256) {
        return compositions.length;
    }
    function getComposition(uint256 idx) external view returns (string memory, string memory) {
        Composition storage c = compositions[idx];
        return (c.url, c.performer);
    }

    function setNFTContract(address addr) external onlyOwner { nftContract = NFTCollectible(addr); }
}