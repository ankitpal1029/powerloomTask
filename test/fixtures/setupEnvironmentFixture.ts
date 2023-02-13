import { ethers } from "hardhat";

export const SetupEnvironment = async () => {
  const [
    userA,
    burnerWallet1,
    burnerWallet2,
    burnerWallet3,
    uniswapDeployer,
    busdDeployer,
    testTokenDeployer,
  ] = await ethers.getSigners();
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
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
  );
  await testTokenContract.deployed();

  console.log(`BUSD address: ${busdContract.address}`);
  console.log(`testToken address: ${testTokenContract.address}`);
  console.log(`uniswapv2 address: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D`);

  const tokenAddress = await testTokenContract.balanceOf(
    testTokenDeployer.address
  );
  console.log(`balance of owner : ${tokenAddress.toString()}`);
  /* provide liquidity via uniswap router */

  const uniswapRouter02 = await ethers.getContractAt(
    "IUniswapV2Router02",
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
  );

  // console.log(
  //   await (
  //     await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
  //   ).timestamp
  // );
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

  return {
    userA,
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
