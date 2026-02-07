const { getNamedAccounts,ethers } = require("hardhat");
const { developmentChains,networkConfig } = require("../helper-hardhat-config");
const path = require("path");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { firstAccount } = await getNamedAccounts();
  const { log } = deployments;

  log("----------------------------------------------------");
  log("Setting Trusted Sender to NFTBridgeSender...");

  // Get the deployed NFTBridgeSender contract address from holesky deployments,if you deployed NFTBridgeSender to other network like sepolia, please change following second parameter 'holesky' to 'sepolia' accordingly
  let deployFolder = "localhost";
  if (!developmentChains.includes(network.name)) {
    const netName = hre.network.name;
    deployFolder = hre.network.config?.companionNetworks?.name
      ?? hre.config.networks?.[netName]?.companionNetworks?.name;
  }
  const nftBridgeSenderArtifactPath = path.join(process.cwd(), "deployments", deployFolder, "NFTBridgeSender.json");
  const nftBridgeSenderArtifact = require(nftBridgeSenderArtifactPath);
  const nftBridgeSenderAddress = nftBridgeSenderArtifact.address;
  log(`NFTBridgeSender address: ${nftBridgeSenderAddress}`);

  // Get the deployed NFTBridgeReceiver contract address
  const nftBridgeReceiverDeployment = await deployments.get("NFTBridgeReceiver");
  if (!nftBridgeReceiverDeployment) throw new Error("NFTBridgeReceiver deployment not found. Ensure script tag/name matches 'NFTBridgeReceiver'.");
  const nftBridgeReceiverAddress = nftBridgeReceiverDeployment.address;

  // Connect to the NFTBridgeReceiver contract
  const nftBridgeReceiverContract = await ethers.getContractAt("NFTBridgeReceiver", nftBridgeReceiverAddress);
  if (!nftBridgeReceiverContract) throw new Error("Failed to get NFTBridgeReceiver contract instance.");
  // Call Set Trusted Sender to NFTBridgeSender
  let companionChainSelector;
  if (developmentChains.includes(network.name)) {
    const ccipLocalSimulatorArtifactPath = path.join(process.cwd(), "deployments", deployFolder, "CCIPLocalSimulator.json");
    const ccipLocalSimulatorArtifact = require(ccipLocalSimulatorArtifactPath);
    const ccipAddress = ccipLocalSimulatorArtifact.address;
    const ccipSimulator = await ethers.getContractAt("CCIPLocalSimulator", ccipAddress);
    const ccipConfig = await ccipSimulator.configuration();
    companionChainSelector = ccipConfig.chainSelector_;
  } else {
    companionChainSelector = networkConfig[network.config.chainId].companionChainSelector;
  }

  log(`SetTrustedSenderForNFTBridgeSender get the parameters: companionChainSelector ${companionChainSelector}, nftBridgeSenderAddress ${nftBridgeSenderAddress}, nftBridgeReceiverAddress ${nftBridgeReceiverAddress}`);

  const tx = await nftBridgeReceiverContract.connect(await ethers.getSigner(firstAccount)).setTrustedSender(companionChainSelector, nftBridgeSenderAddress);
  await tx.wait();

  log(`✅ Set Trusted Sender to NFTBridgeSender (${nftBridgeSenderAddress})`);
};

module.exports.dependencies = ["NFTBridgeReceiver"]; // Ensure these contracts are deployed first
module.exports.tags = ["all", "destChain", "SetTrustedSenderForNFTBridgeSender"];
