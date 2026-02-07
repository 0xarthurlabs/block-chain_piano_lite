require('dotenv').config();
const PinataSDK = require('@pinata/sdk');
const fs = require('fs');
const path = require('path');
const { ethers } = require("hardhat");

async function main() {
  console.log('Running script: Pinata upload (not a smart-contract deployment)');

  // 1. Get the account (for logging and record keeping)
  const [signer] = await ethers.getSigners();
  const deployerAddress = signer.address;

  // 2. Load and validate Pinata credentials
  const PINATA_API_KEY = process.env.PINATA_API_KEY;
  const PINATA_API_SECRET = process.env.PINATA_API_SECRET;
  const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';

  if (!PINATA_API_KEY || !PINATA_API_SECRET) {
    console.error('Missing Pinata credentials. Please set PINATA_API_KEY and PINATA_API_SECRET in .env');
    return;
  }

  const pinata = new PinataSDK(PINATA_API_KEY, PINATA_API_SECRET);

  // Helper to upload a single file stream and return ipfs:// CID URI
  async function uploadFileToPinata(filePath, name) {
    const stream = fs.createReadStream(filePath);
    console.log(`Uploading file: ${filePath}`);
    const result = await pinata.pinFileToIPFS(stream, {
      pinataMetadata: { name: name || path.basename(filePath) },
      pinataOptions: { cidVersion: 1 }
    });
    return { cid: result.IpfsHash, uri: `ipfs://${result.IpfsHash}` };
  }

  try {
    // 3. Example asset paths
    // Note: Since this runs from the project root using 'npx hardhat run', 
    // we adjust the path to look into the 'assets' folder correctly.
    const coverPath = path.join(process.cwd(), 'assets', 'images', 'nft_cover_6.png');
    
    if (!fs.existsSync(coverPath)) {
      console.warn(`Warning: cover image not found at ${coverPath}. Skipping upload.`);
    }

    let coverCid, coverUri;
    if (fs.existsSync(coverPath)) {
      const cover = await uploadFileToPinata(coverPath, 'nft_cover_6.png');
      coverCid = cover.cid;
      coverUri = cover.uri;
      console.log(`Cover uploaded: ${coverCid}`);
    }

    // 4. Build metadata JSON
    const metadata = {
      name: 'Piano NFT',
      description: "An exclusive NFT cover artwork for the Piano Masterpiece series. Includes a short audio clip.",
      external_url: 'http://localhost:3000/nft/piano/6',
      image: coverUri || '',
      background_color: 'FFFFFF',
      attributes: [
        { trait_type: 'Genre', value: 'Classical' },
        { trait_type: 'Instrument', value: 'Grand Piano' },
        { trait_type: 'Rarity', value: 'Legendary' },
        { display_type: 'number', trait_type: 'Edition', value: 1 }
      ],
      properties: {
        files: [],
        category: 'image',
        creators: [
          { address: deployerAddress, share: 100 }
        ]
      }
    };

    if (coverUri) {
      metadata.properties.files.push({ uri: coverUri, type: 'image/png' });
    }

    // 5. Upload metadata JSON to Pinata
    console.log('Uploading metadata JSON to Pinata...');
    const metaResult = await pinata.pinJSONToIPFS(metadata, {
      pinataMetadata: { name: 'Piano_Metadata#006' },
      pinataOptions: { cidVersion: 1 }
    });

    const metaCid = metaResult.IpfsHash;
    const metadataUri = `ipfs://${metaCid}`;
    const metadataGatewayUrl = `${PINATA_GATEWAY}/${metaCid}`;

    console.log('Metadata CID: ' + metaCid);
    console.log('Metadata URI: ' + metadataUri);
    console.log('Gateway URL: ' + metadataGatewayUrl);

    // 6. Persist result to a local file (pinned_results.json)
    const outPath = path.join(process.cwd(), 'pinned_results.json');
    const resultEntry = {
      name: 'Piano_Metadata#006',
      metaCid,
      metadataUri,
      metadataGatewayUrl,
      timestamp: new Date().toISOString(),
      deployer: deployerAddress
    };

    let existing = [];
    if (fs.existsSync(outPath)) {
      try { 
        existing = JSON.parse(fs.readFileSync(outPath, 'utf8')); 
      } catch (e) { 
        existing = []; 
      }
    }
    existing.push(resultEntry);
    fs.writeFileSync(outPath, JSON.stringify(existing, null, 2));
    console.log(`Saved pin result to ${outPath}`);

  } catch (err) {
    console.error('Pinata upload failed: ' + (err.message || err));
  }
}

// Standard execution pattern
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });