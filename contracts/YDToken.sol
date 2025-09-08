// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract YDToken is ERC20, Ownable {
    constructor(address initialOwner) ERC20("YD Token", "YD") Ownable(initialOwner) {
        // Mint 1 billion tokens to the contract deployer (platform owner)
        _mint(msg.sender, 1000000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
