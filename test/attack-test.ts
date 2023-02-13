import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { SetupEnvironment } from "./fixtures/setupEnvironmentFixture";

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
  });
});
