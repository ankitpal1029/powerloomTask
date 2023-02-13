import { ethers } from "hardhat";
import { Worker } from "worker_threads";
import { ExecuteSwaps } from "../helper/executeSwaps";
import { executeTransaction } from "../helper/executeTransaction";

export const SetupEnvironmentSmarter = async () => {
  const [
    userA,
    burnerWallet1,
    burnerWallet2,
    burnerWallet3,
    uniswapDeployer,
    busdDeployer,
    testTokenDeployer,
  ] = await ethers.getSigners();
  const uniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const BUSDFactory = await ethers.getContractFactory("BUSD", busdDeployer);
  const busdContract = await BUSDFactory.deploy(userA.address);
  await busdContract.deployed();

  /* transfer 100000000 busd to test token deployer */
  await busdContract
    .connect(userA)
    .transfer(testTokenDeployer.address, ethers.utils.parseEther("100000000"));

  /* deploy Test Token */
  const TestTokenFactory = await ethers.getContractFactory(
    "Test",
    testTokenDeployer
  );
  const testTokenContract = await TestTokenFactory.deploy(
    busdContract.address,
    uniswapRouterAddress
  );
  await testTokenContract.deployed();

  /* deploy Sniper */
  //   address _uniswapRouterAddress,
  // address _BUSDAddress,
  // address _TTAddress
  const sniperFactory = await ethers.getContractFactory("Sniper", userA);
  const sniperContract = await sniperFactory.deploy(
    uniswapRouterAddress,
    busdContract.address,
    testTokenContract.address
  );
  await sniperContract.deployed();

  console.log(`BUSD address: ${busdContract.address}`);
  console.log(`testToken address: ${testTokenContract.address}`);
  console.log(`uniswapv2 address: ${uniswapRouterAddress}`);
  console.log(`sniper address: ${sniperContract.address}`);

  const tokenAddress = await testTokenContract.balanceOf(
    testTokenDeployer.address
  );
  console.log(`balance of owner : ${tokenAddress.toString()}`);
  /* provide liquidity via uniswap router */

  const uniswapRouter02 = await ethers.getContractAt(
    "IUniswapV2Router02",
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
  );

  /* approve 1e8 busd and 1e8 test token spend on uniswap router */
  await busdContract
    .connect(testTokenDeployer)
    .approve(uniswapRouter02.address, ethers.utils.parseEther("100000000"));
  await testTokenContract
    .connect(testTokenDeployer)
    .approve(uniswapRouter02.address, ethers.utils.parseEther("100000000"));

  /* add liquidity to uniswaprouter02 */
  await uniswapRouter02
    .connect(testTokenDeployer)
    .addLiquidity(
      testTokenContract.address,
      busdContract.address,
      ethers.utils.parseEther("100000000"),
      ethers.utils.parseEther("100000000"),
      ethers.utils.parseEther("100000000"),
      ethers.utils.parseEther("100000000"),
      testTokenDeployer.address,
      2 *
        (await (
          await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
        ).timestamp)
    );

  /* make user A transfer all it's BUSD to Sniper contract */
  const busdHeldByUserA = await busdContract.balanceOf(userA.address);
  await busdContract
    .connect(userA)
    .transfer(sniperContract.address, busdHeldByUserA);

  const burnerWalletArray = [burnerWallet1, burnerWallet2, burnerWallet3];

  /* updating penalty blocks */
  await testTokenContract.connect(testTokenDeployer).updatePenaltyBlocks(10);
  /* launching the token */
  await testTokenContract.connect(testTokenDeployer).init();

  await ExecuteSwaps(
    sniperContract,
    burnerWalletArray,
    userA,
    testTokenContract
  );

  return {
    userA,
    sniperContract,
    burnerWallet1,
    burnerWallet2,
    burnerWallet3,
    uniswapDeployer,
    busdDeployer,
    busdContract,
    testTokenDeployer,
    testTokenContract,
    uniswapRouter02,
  };
};
