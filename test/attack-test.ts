import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { SetupEnvironment } from "./fixtures/setupEnvironmentFixture";
import { SetupEnvironmentSmarter } from "./fixtures/setupEnvironmentSmarterFixture";

describe("Test Attack", async () => {
  describe("Attack", async () => {
    it("Should the launch of the token", async () => {
      const { testTokenContract } = await loadFixture(SetupEnvironment);
      await testTokenContract.init();
      await expect(await testTokenContract.limitsInEffect()).to.equal(true);
    });

    it("Should fail due to naive swapping", async () => {
      const { userA, busdContract, testTokenContract, uniswapRouter02 } =
        await loadFixture(SetupEnvironment);
      /* approve 1e8 busd and 1e8 test token spend on uniswap router */
      await testTokenContract.init();

      const path = [busdContract.address, testTokenContract.address];
      await busdContract
        .connect(userA)
        .approve(uniswapRouter02.address, ethers.utils.parseEther("100000000"));
      await expect(
        uniswapRouter02
          .connect(userA)
          .swapExactTokensForTokens(
            ethers.utils.parseEther("360000"),
            ethers.utils.parseEther("0"),
            path,
            userA.address,
            (await (
              await ethers.provider.getBlock(
                await ethers.provider.getBlockNumber()
              )
            ).timestamp) + 1800
          )
      ).to.be.revertedWith("UniswapV2: TRANSFER_FAILED");
    });

    it("let EOAs swap BUSD on the contract for TT tokens", async () => {
      const {
        burnerWallet1,
        burnerWallet2,
        burnerWallet3,
        busdContract,
        testTokenContract,
        uniswapRouter02,
      } = await loadFixture(SetupEnvironmentSmarter);
      const path = [busdContract.address, testTokenContract.address];
      const amount = await uniswapRouter02.getAmountsOut(
        ethers.utils.parseEther("35000"),
        path
      );
      const burnerWalletArray = [burnerWallet1, burnerWallet2, burnerWallet3];
      for (let i = 0; i < burnerWalletArray.length; i++) {
        const balance = await testTokenContract.balanceOf(
          burnerWalletArray[i].address
        );
        console.log(
          `address: ${
            burnerWalletArray[i].address
          } has ${balance.toString()} TT`
        );
      }
    });

    it("Smart contract should prevent user A from calling swap function before penaltyDuration", async () => {
      const {
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
      } = await loadFixture(SetupEnvironmentSmarter);
      const currentBlock = await ethers.provider.getBlockNumber();
      const timeofTTDeploy = await testTokenContract.enableBlock();
      const penalty = await testTokenContract.penaltyBlocks();
      console.log(currentBlock, timeofTTDeploy.add(penalty).toString());
    });

    it("Dump tokens after launch is over i.e limitsInEffect is false", async () => {
      const {
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
      } = await loadFixture(SetupEnvironmentSmarter);

      /* TT owner removes limits after token sale is concluded */
      await testTokenContract.connect(testTokenDeployer).removeLimits();

      /* this is where we start dumping the tokens */
      const burnerWalletArray = [burnerWallet1, burnerWallet2, burnerWallet3];
      await sniperContract.connect(userA).dumpTTTokensUniswap();
      //   for (let i = 0; i < burnerWalletArray.length; i++) {
      //     await sniperContract
      //       .connect(burnerWalletArray[i])
      //       .dumpTTTokensUniswap();
      //   }

      for (let i = 0; i < burnerWalletArray.length; i++) {
        const burnerWalletIBalance = await testTokenContract
          .connect(burnerWalletArray[i])
          .balanceOf(burnerWalletArray[i].address);
        console.log(
          `> ${
            burnerWalletArray[i].address
          } TT balance: ${burnerWalletIBalance.toString()}`
        );
      }

      const sniperBUSDBalance = await busdContract.balanceOf(
        sniperContract.address
      );
      console.log(
        `> invested BUSD : ${ethers.utils
          .parseEther("350000")
          .div(ethers.utils.parseEther("1"))
          .toString()} BUSD`
      );
      console.log(
        `> sniper BUSD balance after attaack : ${sniperBUSDBalance
          .div(ethers.utils.parseEther("1"))
          .toString()} BUSD`
      );
    });
  });
});
