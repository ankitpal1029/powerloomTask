// SPDX-License-Identifier: MIT
pragma solidity >=0.7.5;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

contract Sniper {
    mapping(address => bool) burnerWalletWhitelist;
    address owner;
    address uniswapRouterAddress;

    constructor(address _uniswapRouterAddress) {
        owner = msg.sender;
        uniswapRouterAddress = _uniswapRouterAddress;
        // burnerWalletWhitelist[msg.sender] = true;
    }

    modifier onlyBurnerWallets() {
        require(burnerWalletWhitelist[msg.sender]);
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function addBurnerWallet(address burnerWalletAddress) external onlyOwner {
        burnerWalletWhitelist[burnerWalletAddress] = true;
    }

    // swap tokens that user A sent to sniper contract
    function swapFromUniswap(
        address _fromToken,
        address _toToken,
        uint256 _amountFromToken,
        uint256 _amountOutMin
    ) external onlyBurnerWallets {
        // a check that current block number > test token creation block + penalty blocks
        // what token from :
        // what token to: test token
        IERC20(_fromToken).approve(uniswapRouterAddress, _amountFromToken);
        // address[] memory _path = [_fromToken, _toToken];
        address[] memory path;
        path = new address[](3);
        path[0] = _fromToken;
        path[1] = _toToken;

        IUniswapV2Router01(uniswapRouterAddress).swapExactTokensForTokens(
            _amountFromToken,
            _amountOutMin,
            path,
            address(this),
            block.timestamp
        );
    }
}
