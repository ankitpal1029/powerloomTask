// SPDX-License-Identifier: MIT
pragma solidity >=0.7.5;

// import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "./TestToken.sol";

// import "./interfaces/IERC20.sol";

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

    // function setAnyChanges() external onlyOwner {
    //     maxTransactionAmount = Test(TTAddress).maxTransactionAmount();
    //     maxWallet = Test(TTAddress).maxWallet();
    //     enableBlock = Test(TTAddress).enableBlock();
    //     penaltyBlocks = Test(TTAddress).penaltyBlocks();
    // }

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

    function addBurnerWallet(address burnerWalletAddress) external onlyOwner {
        burnerWalletWhiteMap[burnerWalletAddress] = true;
        burnerWalletWhiteList.push(burnerWalletAddress);
    }

    // swap tokens that user A sent to sniper contract
    function swapBUSDToTTUniswap(
        uint256 _amountFromToken
    )
        external
        // uint256 _amountOutMin
        onlyBurnerWallets
        afterPenaltyBlocksOnly
    {
        // a check that current block number > test token creation block + penalty blocks
        // what token from :
        // what token to: test token
        // IERC20(_fromToken).approve(uniswapRouterAddress, _amountFromToken);
        IERC20(BUSDAddress).approve(uniswapRouterAddress, _amountFromToken);
        // address[] memory _path = [_fromToken, _toToken];
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

    // after token launch is over - now all the limitations are not present
    // User A can trigger this to dump all TT tokens for BUSD - all the burner wallets can approve spending by this contract in advance
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
