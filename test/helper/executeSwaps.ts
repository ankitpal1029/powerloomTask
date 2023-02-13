import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { Sniper } from "../../typechain-types";
import { Test } from "../../typechain-types/contracts/TestToken.sol";
import { network } from "hardhat";
import { Sign } from "crypto";

export const ExecuteSwaps = async (
  sniperContract: Sniper,
  burnerWalletArray: SignerWithAddress[],
  userA: SignerWithAddress,
  testTokenContract: Test
) => {
  /* check block number */
  const currentBlockNumber = await ethers.provider.getBlockNumber();
  while (
    (await ethers.provider.getBlockNumber()) <=
    (await (await testTokenContract.enableBlock())
      .add(await testTokenContract.penaltyBlocks())
      .toNumber())
  ) {
    console.log("> waiting for penalty blocks to expire");
    /* outside of tests nodejs will just have to wait till these blocks are mined */
    await network.provider.request({
      method: "evm_mine",
      params: [],
    });
  }
  /* add burner wallet addressses */
  for (let i = 0; i < burnerWalletArray.length; i++) {
    await sniperContract
      .connect(userA)
      .addBurnerWallet(burnerWalletArray[i].address);
  }
  /* swap BUSD to TT via contract */
  for (let i = 0; i < burnerWalletArray.length; i++) {
    await sniperContract
      .connect(burnerWalletArray[i])
      .swapBUSDToTTUniswap(ethers.utils.parseEther("350000"));
  }

  /* approving sniper contract to spend burner wallet TT, will be usefull while dumping the tokens */
  for (let i = 0; i < burnerWalletArray.length; i++) {
    await testTokenContract
      .connect(burnerWalletArray[i])
      .approve(sniperContract.address, ethers.utils.parseEther("1000000"));
  }
};

/* run this function to execute swaps from BUSD to TT in burner wallets */
const main = async () => {
  const allSigners: SignerWithAddress[] = await ethers.getSigners();
  const userA: SignerWithAddress = allSigners[0];
  const burnerWalletArray = allSigners.slice(0, 1);
  /* sniper contract and testtoken contract are hardcoded for ease of running tests */
  const testTokenContract = await ethers.getContractAt(
    "Test",
    "0x8476FC408B2dF4d03E9705FC2768d9179B62800c"
  );
  const sniperContract = await ethers.getContractAt(
    "Sniper",
    "0xDf951d2061b12922BFbF22cb17B17f3b39183570"
  );
  await ExecuteSwaps(
    sniperContract,
    burnerWalletArray,
    userA,
    testTokenContract
  );
};
