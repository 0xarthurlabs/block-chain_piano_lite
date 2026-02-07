const { ethers, deployments } = require("hardhat");

async function main() {
  // Get a contract instance connected to the deployer (who has DEFAULT_ADMIN_ROLE)
  const [signer] = await ethers.getSigners();
  console.log('Running script with account:', signer.address);

  // Try to locate a deployed NFTCollectible deployment record created by hardhat-deploy
  let nftAddress;
  try {
    const nftDeployment = await deployments.get('NFTCollectible');
    nftAddress = nftDeployment.address;
    console.log(`Found deployment "NFTCollectible" at: ${nftAddress}`);
  } catch (err) {
    console.error('Error: could not find deployment named "NFTCollectible".');
    console.error('Make sure the contract was deployed with the name "NFTCollectible".');
    return;
  }

  const nft = await ethers.getContractAt('NFTCollectible', nftAddress, signer);

  // Edit this array: a list of tokenId / uri pairs to be added
  const entries = [
    { tokenId: 1, uri: 'ipfs://bafkreidk6babti46deegelvmsarahf2tyuttszjxwt3lgfhc5pjqf6r3zu' },
    { tokenId: 2, uri: 'ipfs://bafkreiadnizs76yzwgomh24nvllnga4pyfbi37zuy4unydzy5kflr4odde' },
    { tokenId: 3, uri: 'ipfs://bafkreiahr4oiz3mc4c47ygeswsufub5suwn5iqo3nwhqhokdvokztggqi4' },
    { tokenId: 4, uri: 'ipfs://bafkreiavyshy5vq3flkq3shcvkga7s6ylliwo2i2b6eedwafbxao4x2sry' },
    { tokenId: 5, uri: 'ipfs://bafkreiaandmfmtyisszfc34hfsgbouzpc7upswhyniqn3jlypwkmqtuafe' },
    { tokenId: 6, uri: 'ipfs://bafkreifbl3d7kvmk6gfiqw6btn6jmphed6knht4agbzuzhe2rfxmivklcy' }
  ];

  console.log('Running deploy script: addTokenURI batch caller');

  for (const entry of entries) {
    try {
      console.log(`Adding tokenId=${entry.tokenId} uri=${entry.uri}`);
      const tx = await nft.addTokenURI(entry.tokenId, entry.uri);
      
      console.log(`Transaction submitted: ${tx.hash} — waiting for confirmation...`);
      const receipt = await tx.wait();
      console.log(`Confirmed (block ${receipt.blockNumber}). Token ${entry.tokenId} added.`);
    } catch (err) {
      // Log and continue with next entry — do not abort the entire batch on a single failure
      console.log(`Failed to add tokenId=${entry.tokenId}: ${err.reason || err.message || err}`);
    }
  }

  console.log('addTokenURI batch script finished.');
}

// Standard Hardhat script execution pattern
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });