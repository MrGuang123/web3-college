// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// This is a mock ERC20 token for testing purposes.
// It includes a public mint function that allows anyone to get tokens.
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USD Coin", "mUSDC") {}

    // Faucet function: Anyone can call this to mint tokens to a specific address.
    function mint(address to, uint256 amount) public {
        // USDC has 6 decimals, so we multiply by 10^6
        _mint(to, amount * (10 ** 6));
    }
}
