const { getNamedAccounts,ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { firstAccount } = await getNamedAccounts();
  const { log } = deployments;

  log("----------------------------------------------------");
  log("Granting MINTER_ROLE to PianoGuessGame...");

  // Get the deployed NFTCollectible contract address
  const nftDeployment = await deployments.get("NFTCollectible");
  if (!nftDeployment) throw new Error("NFTCollectible deployment not found. Ensure script tag/name matches 'NFTCollectible'.");
  const nftAddress = nftDeployment.address;

  // Get the deployed PianoGuessGame contract address
  const gameDeployment = await deployments.get("PianoGuessGame");
  if (!gameDeployment) throw new Error("PianoGuessGame deployment not found. Ensure script tag/name matches 'PianoGuessGame'.");
  const gameAddress = gameDeployment.address;

  // Connect to the NFTCollectible contract
  const nftContract = await ethers.getContractAt("NFTCollectible", nftAddress);
  if (!nftContract) throw new Error("Failed to get NFTCollectible contract instance.");
  // Call grantMinter to authorize PianoGuessGame as minter
  const already = await nftContract.hasRole(nftContract.MINTER_ROLE(), gameAddress);
  if (already) {
    log(`PianoGuessGame (${gameAddress}) already has MINTER_ROLE on NFTCollectible (${nftAddress}). Skipping.`);
    return;
  }
  const tx = await nftContract.connect(await ethers.getSigner(firstAccount)).grantMinter(gameAddress);
  await tx.wait();

  log(`✅ Granted MINTER_ROLE to PianoGuessGame (${gameAddress})`);
};

module.exports.dependencies = ["NFTCollectible", "PianoGuessGame"]; // Ensure these contracts are deployed first
module.exports.tags = ["all", "sourceChain", "GrantMinterForPianoGuessGame"];
