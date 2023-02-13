import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { SetupEnvironment } from "./fixtures/setupEnvironmentFixture";

describe("Test the setup", async () => {
  describe("Verify if liquidity is added", async () => {
    it("Should verify that busd and test token are added to LPool", async () => {
      const {
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
      } = await loadFixture(SetupEnvironment);
      await expect(
        await (
          await testTokenContract.balanceOf(
            await testTokenContract.uniswapV2Pair()
          )
        ).toString()
      ).to.deep.equal(ethers.utils.parseEther("100000000"));
      await expect(
        await (
          await busdContract.balanceOf(await testTokenContract.uniswapV2Pair())
        ).toString()
      ).to.deep.equal(ethers.utils.parseEther("100000000"));
    });
  });

  describe("Verify balances of the relevant accounts", async () => {
    it("Should verify balance of BUSD in userA", async () => {
      const {
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
      } = await loadFixture(SetupEnvironment);
      await expect(await busdContract.balanceOf(userA.address)).to.deep.equal(
        ethers.utils.parseEther("100000000")
      );
    });
    it("Should verify balance of Test Token in testtokendeployer", async () => {
      const {
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
      } = await loadFixture(SetupEnvironment);
      await expect(
        await testTokenContract.balanceOf(testTokenDeployer.address)
      ).to.deep.equal(ethers.utils.parseEther("0"));
    });
  });
});
