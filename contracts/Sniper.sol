// SPDX-License-Identifier: MIT
pragma solidity >=0.7.5;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
// import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "./interfaces/IERC20.sol";

contract Sniper {
    mapping(address => bool) burnerWalletWhiteMap;
    address[] burnerWalletWhiteList;
    address owner;
    address uniswapRouterAddress;
    address BUSDAddress;
    address TTAddress;

    constructor(
        address _uniswapRouterAddress,
        address _BUSDAddress,
        address _TTAddress
    ) {
        owner = msg.sender;
        uniswapRouterAddress = _uniswapRouterAddress;
        BUSDAddress = _BUSDAddress;
        TTAddress = _TTAddress;
        // burnerWalletWhitelist[msg.sender] = true;
    }

    modifier onlyBurnerWallets() {
        require(burnerWalletWhiteMap[msg.sender]);
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function addBurnerWallet(address burnerWalletAddress) external onlyOwner {
        burnerWalletWhiteMap[burnerWalletAddress] = true;
        burnerWalletWhiteList.push(burnerWalletAddress);
    }

    // swap tokens that user A sent to sniper contract
    function swapBUSDToTTUniswap(
        uint256 _amountFromToken,
        uint256 _amountOutMin
    ) external onlyBurnerWallets {
        // a check that current block number > test token creation block + penalty blocks
        // what token from :
        // what token to: test token
        // IERC20(_fromToken).approve(uniswapRouterAddress, _amountFromToken);
        IERC20(BUSDAddress).approve(uniswapRouterAddress, _amountFromToken);
        // address[] memory _path = [_fromToken, _toToken];
        address[] memory path;
        path = new address[](3);
        path[0] = BUSDAddress;
        path[1] = TTAddress;

        IUniswapV2Router01(uniswapRouterAddress).swapExactTokensForTokens(
            _amountFromToken,
            1,
            path,
            msg.sender,
            block.timestamp
        );
    }

    // after token launch is over - now all the limitations are not present
    // User A can trigger this to dump all TT tokens for BUSD - all the burner wallets can approve spending by this contract in advance
    function dumpTTTokensUniswap() external onlyOwner {
        for (uint256 i = 0; i < burnerWalletWhiteList.length; i++) {
            // transferFrom all tokens from burnerWallets
            // swap to busd
            uint256 amountTTToSwapToBUSD = IERC20(TTAddress).balanceOf(
                burnerWalletWhiteList[i]
            );
            // approve TT spending to uniswap
            IERC20(TTAddress).approve(
                uniswapRouterAddress,
                amountTTToSwapToBUSD
            );
            address[] memory path;
            path = new address[](3);
            path[0] = BUSDAddress;
            path[1] = TTAddress;

            IUniswapV2Router01(uniswapRouterAddress).swapExactTokensForTokens(
                amountTTToSwapToBUSD,
                1,
                path,
                address(this),
                block.timestamp
            );
        }
    }
}
