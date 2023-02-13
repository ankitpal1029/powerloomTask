import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

const uniswapRouter02Address = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const bUSDaddress = "0x521fe809562DCDE295A48D017b4571d1cA15041E";
const tESTAddress = "0xA28E65B0444392c7F591A321F9802d900A3229Bc";
const sniperAddress = "0xDf951d2061b12922BFbF22cb17B17f3b39183570";
const main = async () => {
  /* attacker can keep as many private keys as they wish in the hardhat config via a .env file */
  const allSigners: SignerWithAddress[] = await ethers.getSigners();
  const userA = allSigners[0]; // the rest are burner wallets
  //   const sniperContract = await ethers.getContractAt("Sniper", sniperAddress);

  const busdContract = await ethers.getContractAt("BUSD", bUSDaddress);
  const testTokenContract = await ethers.getContractAt("Test", tESTAddress);

  /* deploy sniper contract */
  const sniperFactory = await ethers.getContractFactory("Sniper", userA);
  const sniperContract = await sniperFactory.deploy(
    uniswapRouter02Address,
    busdContract.address,
    testTokenContract.address
  );

  /* wait for penalty block to expire */
  while (
    (await ethers.provider.getBlockNumber()) <=
    (await (await testTokenContract.enableBlock())
      .add(await testTokenContract.penaltyBlocks())
      .toNumber())
  ) {}

  /* transfer all the busd user A has to the sniper contract */
  const userABalance = await busdContract.balanceOf(userA.address);
  await busdContract
    .connect(userA)
    .transfer(sniperContract.address, userABalance);

  for (let i = 1; i < allSigners.length; i++) {
    await sniperContract
      .connect(allSigners[i])
      .swapBUSDToTTUniswap(ethers.utils.parseEther("350000"));
  }

  /* now we should've obtained as much TT in our burner wallets as possible */
  // it's time to wait for the limitInEffect to be turned off
  while ((await testTokenContract.limitsInEffect()) == true) {}

  /* it's time to dump the tokens */
  await sniperContract.connect(userA).dumpTTTokensUniswap();
  const sniperContractBUSDBalance = await busdContract.balanceOf(
    sniperContract.address
  );
  console.log(
    `invested BUSD: ${userABalance
      .div(ethers.utils.parseEther("1"))
      .toString()} BUSD total earned: ${sniperContractBUSDBalance.div(
      ethers.utils.parseEther("1").toString()
    )}`
  );
};

main().catch((err) => {
  console.log(err);
});
