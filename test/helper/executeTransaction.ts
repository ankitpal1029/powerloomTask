import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { parentPort, workerData } from "worker_threads";
import { Sniper } from "../../typechain-types";

export const executeTransaction = async (burnerWalletIndex: number) => {
  //   const burnerWalletList = await ethers.getSigners();
  //   const burnerWalletI = burnerWalletList[burnerWalletIndex];
  //   const sniperContract = await ethers.getContractAt(
  //     "Sniper",
  //     "0xDf951d2061b12922BFbF22cb17B17f3b39183570"
  //   );

  //   const tx = await sniperContract
  //     .connect(burnerWalletI)
  //     .swapBUSDToTTUniswap(ethers.utils.parseEther("350000"));
  //   const receipt = await tx.wait();
  //   console.log(receipt);

  //   return receipt.status;
  return "yooooo";
};

parentPort?.postMessage(executeTransaction(workerData.value));
