import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const ALCHEMY_URL = process.env.ALCHEMY_URL as string;

const config: HardhatUserConfig = {
  solidity: "0.7.5",
  networks: {
    hardhat: {
      forking: {
        enabled: true,
        url: ALCHEMY_URL,
        blockNumber: 16621571,
      },
    },
  },
};

export default config;
