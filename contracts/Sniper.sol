// SPDX-License-Identifier: MIT
pragma solidity >=0.7.5;

import "./TestToken.sol";

contract Sniper {
    mapping(address => bool) burnerWalletWhiteMap;
    address[] burnerWalletWhiteList;
    address owner;
    address uniswapRouterAddress;

    address BUSDAddress;
    address TTAddress;

    uint256 maxTransactionAmount = (100000000 * 1e18 * 35) / 10000; // 0.35% maxTransactionAmountTxn
    uint256 maxWallet = (100000000 * 1e18 * 10) / 1000; // 1% maxWallet
    uint256 enableBlock;
    uint256 public penaltyBlocks = 3;

    // @notice Contract constructor
    // @param _uniswapRouterAddress The contract address of UniswapV2Router02
    // @param _BUSDAddrss The contract address of ERC20 token Binance USD
    // @param _TTAddress The contract address of ERC20 token Test
    constructor(
        address _uniswapRouterAddress,
        address _BUSDAddress,
        address _TTAddress
    ) {
        owner = msg.sender;
        uniswapRouterAddress = _uniswapRouterAddress;
        BUSDAddress = _BUSDAddress;
        TTAddress = _TTAddress;
        maxTransactionAmount = Test(_TTAddress).maxTransactionAmount();
        maxWallet = Test(_TTAddress).maxWallet();
        enableBlock = Test(_TTAddress).enableBlock();
        penaltyBlocks = Test(_TTAddress).penaltyBlocks();
    }

    modifier onlyBurnerWallets() {
        require(burnerWalletWhiteMap[msg.sender]);
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier afterLimitsDownOnly() {
        require(
            Test(TTAddress).limitsInEffect() == false,
            "token isn't stable yet not ready to dump"
        );
        _;
    }

    modifier afterPenaltyBlocksOnly() {
        require(
            block.number >
                Test(TTAddress).enableBlock() + Test(TTAddress).penaltyBlocks(),
            "penalty blocks aren't done yet"
        );
        _;
    }

    // @notice Helps owner add whitelisted burner wallets which will be later used for dumping tokens
    // @param burnerWalletAddress Address of burner wallet that needs to be whitelisted
    function addBurnerWallet(address burnerWalletAddress) external onlyOwner {
        burnerWalletWhiteMap[burnerWalletAddress] = true;
        burnerWalletWhiteList.push(burnerWalletAddress);
    }

    // @notice Swaps BUSD in the contract for Test Token after penaltyBlocks expire, can be called only by whitelisted Burner wallets
    // @param _amountFromToken amount of BUSD to trade for TT
    function swapBUSDToTTUniswap(
        uint256 _amountFromToken
    ) external onlyBurnerWallets afterPenaltyBlocksOnly {
        IERC20(BUSDAddress).approve(uniswapRouterAddress, _amountFromToken);
        address[] memory path;
        path = new address[](2);
        path[0] = BUSDAddress;
        path[1] = TTAddress;

        // check if transaction limit is above amount being transfered amount
        // check if wallet to which amount is being transferred has less than maxWallet
        require(
            Test(TTAddress).balanceOf(msg.sender) + _amountFromToken <=
                Test(TTAddress).maxWallet(),
            "wallet that TT token is being sent will cross maxWallet limit"
        );
        require(
            _amountFromToken <= Test(TTAddress).maxTransactionAmount(),
            "transaction amount too high, will get you blacklisted"
        );
        IUniswapV2Router02(uniswapRouterAddress).swapExactTokensForTokens(
            _amountFromToken,
            1,
            path,
            msg.sender,
            block.timestamp
        );
    }

    // User A can trigger this to dump all TT tokens for BUSD - all the burner wallets can approve spending by this contract in advance
    // @notice Used to dump Test Token into Uniswap LP after limits are withdrawn
    function dumpTTTokensUniswap() external onlyOwner afterLimitsDownOnly {
        for (uint256 i = 0; i < burnerWalletWhiteList.length; i++) {
            // transferFrom all tokens from burnerWallets
            // swap to busd
            uint256 amountTTToSwapToBUSD = IERC20(TTAddress).balanceOf(
                burnerWalletWhiteList[i]
            );
            IERC20(TTAddress).transferFrom(
                burnerWalletWhiteList[i],
                address(this),
                amountTTToSwapToBUSD
            );
            // approve TT spending to uniswap
            IERC20(TTAddress).approve(
                uniswapRouterAddress,
                amountTTToSwapToBUSD
            );
            address[] memory path;
            path = new address[](2);
            path[0] = TTAddress;
            path[1] = BUSDAddress;

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
