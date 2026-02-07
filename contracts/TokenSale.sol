// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PlatformToken.sol";

/// @notice Sale contract: users send ETH to buy PTK at a fixed rate; ETH forwards to owner.
contract TokenSale is Ownable {
    PlatformToken public token;
    uint256 public rate; // PTK per 1 ETH
    mapping(address => uint256) public purchased; // record PTK purchased per user

    event Sold(address indexed buyer, uint256 ethValue, uint256 ptkAmount);

    constructor(address tokenAddress, uint256 _rate) 
        Ownable(msg.sender)
    {
        token = PlatformToken(tokenAddress);
        rate = _rate;
    }

    /// @notice Buy tokens by sending ETH
    function buyTokens() public payable {
        require(msg.value > 0, "Must send ETH");
        uint256 tokensToTransfer = msg.value * rate;
        require(token.balanceOf(address(this)) >= tokensToTransfer, "Insufficient tokens in contract");

        // update user record
        purchased[msg.sender] += tokensToTransfer;

        // transfer PTK to buyer
        token.transfer(msg.sender, tokensToTransfer);
        // forward ETH to owner
        payable(owner()).transfer(msg.value);

        emit Sold(msg.sender, msg.value, tokensToTransfer);
    }

    receive() external payable {
        buyTokens();
    }
    fallback() external payable {
        buyTokens();
    }

    function withdrawTokens(uint256 amount) external onlyOwner {
        token.transfer(owner(), amount);
    }

    function setRate(uint256 newRate) external onlyOwner {
        rate = newRate;
    }
}