const { getNamedAccounts,ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { firstAccount } = await getNamedAccounts();
  const { log } = deployments;

  log("----------------------------------------------------");
  log("Granting MINTER_ROLE to PianoGueNFTBridgeReceiver...");

  // Get the deployed WrappedNFT contract address
  const wnftDeployment = await deployments.get("WrappedNFT");
  if (!wnftDeployment) throw new Error("WrappedNFT deployment not found. Ensure script tag/name matches 'WrappedNFT'.");
  const wnftAddress = wnftDeployment.address;

  // Get the deployed NFTBridgeReceiver contract address
  const nftBridgeReceiverDeployment = await deployments.get("NFTBridgeReceiver");
  if (!nftBridgeReceiverDeployment) throw new Error("NFTBridgeReceiver deployment not found. Ensure script tag/name matches 'NFTBridgeReceiver'.");
  const nftBridgeReceiverAddress = nftBridgeReceiverDeployment.address;

  // Connect to the WrappedNFT contract
  const wnftContract = await ethers.getContractAt("WrappedNFT", wnftAddress);
  if (!wnftContract) throw new Error("Failed to get WrappedNFT contract instance.");
  // Call grantMinter to authorize NFTBridgeReceiver as minter
  const tx = await wnftContract.connect(await ethers.getSigner(firstAccount)).grantMinter(nftBridgeReceiverAddress);
  await tx.wait();

  log(`✅ Granted MINTER_ROLE to NFTBridgeReceiver (${nftBridgeReceiverAddress})`);
};

module.exports.dependencies = ["WrappedNFT", "NFTBridgeReceiver"]; // Ensure these contracts are deployed first
module.exports.tags = ["all", "destChain", "GrantMinterForNFTBridgeReceiver"];
