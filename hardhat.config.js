require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require('hardhat-deploy-ethers');
require("@nomicfoundation/hardhat-verify");

const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '.env')
});

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  path: {
    sources: "./contracts/",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deployments: "./deployments"
  },
  namedAccounts: {
    firstAccount: {
      default: 0
    }
  },
  defaultNetwork: "hardhat",
  networks: {
      hardhat : {},
      sepolia: {
        url: process.env.SEPOLIA_RPC_URL,
        chainId: 11155111,
        accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        companionNetworks: {
          destChain: "polygonAmoy"
        }
      },
      polygonAmoy: {
        url: process.env.POLYGON_AMOY_RPC_URL,
        chainId: 80002,
        accounts: [process.env.PRIVATE_KEY],
        companionNetworks: {
          name: "sepolia"
        }
      }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ALCHEMY_API_KEY,
      polygonAmoy: process.env.INFURA_API_KEY
    }/*,
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=80002",
          browserURL: "https://amoy.polygonscan.com"
        }
      }
    ]*/
  }
};
