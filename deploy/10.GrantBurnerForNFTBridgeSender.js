const { getNamedAccounts,ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { firstAccount } = await getNamedAccounts();
  const { log } = deployments;

  log("----------------------------------------------------");
  log("Granting BURNER_ROLE to NFTBridgeSender...");

  // Get the deployed NFTCollectible contract address
  const nftDeployment = await deployments.get("NFTCollectible");
  if (!nftDeployment) throw new Error("NFTCollectible deployment not found. Ensure script tag/name matches 'NFTCollectible'.");
  const nftAddress = nftDeployment.address;

  // Get the deployed NFTBridgeSender contract address
  const nftBridgeSenderDeployment = await deployments.get("NFTBridgeSender");
  if (!nftBridgeSenderDeployment) throw new Error("NFTBridgeSender deployment not found. Ensure script tag/name matches 'NFTBridgeSender'.");
  const nftBridgeSenderAddress = nftBridgeSenderDeployment.address;

  // Connect to the NFTCollectible contract
  const nftContract = await ethers.getContractAt("NFTCollectible", nftAddress);
  if (!nftContract) throw new Error("Failed to get NFTCollectible contract instance.");
  // Call grantBurner to authorize NFTBridgeSender as burner
  const already = await nftContract.hasRole(nftContract.BURNER_ROLE(), nftBridgeSenderAddress);
  if (already) {
    log(`PianoGuessGame (${nftBridgeSenderAddress}) already has BURNER_ROLE on NFTCollectible (${nftAddress}). Skipping.`);
    return;
  }
  const tx = await nftContract.connect(await ethers.getSigner(firstAccount)).grantBurner(nftBridgeSenderAddress);
  await tx.wait();

  log(`✅ Granted BURNER_ROLE to NFTBridgeSender (${nftBridgeSenderAddress})`);
};

module.exports.dependencies = ["NFTCollectible", "NFTBridgeSender"]; // Ensure these contracts are deployed first
module.exports.tags = ["all", "sourceChain", "GrantBurnerForNFTBridgeSender"];
