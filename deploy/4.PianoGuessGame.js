/**
 * Hardhat-deploy script that uploads MP3 files and metadata to Pinata only when they
 * are not already pinned (by metadata name). If a pin with the same metadata name
 * exists on Pinata, the script will reuse the existing CID and skip uploading.
 *
 * Environment variables supported (same as original script):
 * - PINATA_API_KEY, PINATA_API_SECRET
 * - FILES_TO_UPLOAD (comma-separated filenames under assets/music)
 * - MAX_FILES (default 5)
 * - UPLOAD_DELAY_MS (default 1000)
 * - MP3_URLS, METADATA_URLS (pre-supplied ipfs:// URLs to skip uploads)
 * - PERFORMERS (comma-separated list)
 *
 * Differences from original:
 * - Before uploading a file or metadata, the script queries Pinata's pin list using
 *   the metadata.name field. If a pinned entry exists, the script reuses that CID.
 * - Uses pinata.pinFromFS & pinata.pinJSONToIPFS as in original.
 */

const fs = require('fs');
const path = require('path');
const PinataSDK = require('@pinata/sdk');
const hre = require('hardhat');

const { sleep: utilSleep } = require('../utils/utils.js') || { sleep: null };

const DEFAULT_MAX_FILES = 5;
const DEFAULT_UPLOAD_DELAY_MS = 1000;
const MUSIC_DIR_REL = path.join('assets', 'music');

function log(...args) {
  console.log('[deploy:pianogame]', ...args);
}

function listMp3Files(musicDir) {
  if (!fs.existsSync(musicDir)) return [];
  return fs
    .readdirSync(musicDir)
    .filter((f) => f.toLowerCase().endsWith('.mp3'))
    .sort();
}

function initPinata() {
  const key = process.env.PINATA_API_KEY;
  const secret = process.env.PINATA_API_SECRET;
  if (!key || !secret) {
    log('PINATA credentials not set; uploads will be skipped unless MP3_URLS/METADATA_URLS provided.');
    return null;
  }
  return new PinataSDK(key, secret);
}

/**
 * Try to find an existing pin on Pinata by metadata.name (best-effort).
 * Returns CID string (without ipfs://) if found, else null.
 */
async function findPinByMetadataName(pinata, name) {
  if (!pinata) return null;
  try {
    // pinList supports filtering by metadata.name; use a small page to be efficient
    const filter = { metadata: { name } };
    const result = await pinata.pinList(filter, { pageLimit: 10, pageOffset: 0 });
    // result.rows is expected; try a few possible property names defensively
    const rows = result && (result.rows || result.rows || result.count ? result.rows : null);
    if (rows && Array.isArray(rows) && rows.length > 0) {
      // pick first; rows entries may contain ipfs_pin_hash or IpfsHash
      const r = rows[0];
      return r.ipfs_pin_hash || r.IpfsHash || r.IpfsHash || r.ipfs_hash || null;
    }
  } catch (err) {
    // Non-fatal: log and continue (we'll upload)
    log('pinList check failed for', name, '->', err && err.message ? err.message : err);
  }
  return null;
}

async function uploadFileToPinata(pinata, filepath, name) {
  if (!pinata) throw new Error('Pinata client not initialized');
  // prefer pinFromFS if available
  const res = await pinata.pinFromFS(filepath, { pinataMetadata: { name } });
  if (!res) throw new Error('No response from pinata.pinFromFS');
  // pinFromFS returns { IpfsHash } in many SDK versions
  return res.IpfsHash || res.ipfs_pin_hash || res.ipfsHash || null;
}

async function uploadMetadataToPinata(pinata, metaObj, name) {
  if (!pinata) throw new Error('Pinata client not initialized');
  const res = await pinata.pinJSONToIPFS(metaObj, { pinataMetadata: { name } });
  if (!res) throw new Error('No IpfsHash returned from pinata for metadata');
  return res.IpfsHash || res.ipfs_pin_hash || null;
}

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log: hdLog, getOrNull } = deployments;
  const { firstAccount } = await getNamedAccounts();

  const musicDir = path.resolve(__dirname, '..', MUSIC_DIR_REL);
  const maxFiles = Number(process.env.MAX_FILES || DEFAULT_MAX_FILES);
  const uploadDelayMs = Number(process.env.UPLOAD_DELAY_MS || DEFAULT_UPLOAD_DELAY_MS);

  const preMp3Urls = process.env.MP3_URLS ? process.env.MP3_URLS.split(',').map(s => s.trim()).filter(Boolean) : null;
  const preMetadataUrls = process.env.METADATA_URLS ? process.env.METADATA_URLS.split(',').map(s => s.trim()).filter(Boolean) : null;
  const envFiles = process.env.FILES_TO_UPLOAD ? process.env.FILES_TO_UPLOAD.split(',').map(s => s.trim()).filter(Boolean) : null;

  const performers = (process.env.PERFORMERS ? process.env.PERFORMERS.split(',') : [
    'Frédéric Chopin',
    'Ludwig van Beethoven',
    'Sibelius',
    'Johann Sebastian Bach',
    'Franz Liszt'
  ]).map(s => s.trim()).filter(Boolean);

  const pinataClient = initPinata();

  // Determine file list
  let filesToUpload = [];
  if (envFiles && envFiles.length > 0) {
    filesToUpload = envFiles.slice(0, maxFiles);
  } else {
    const all = listMp3Files(musicDir);
    if (all.length === 0) log('No mp3 files found in', musicDir);
    filesToUpload = all.slice(0, maxFiles);
  }

  log(`Resolved ${filesToUpload.length} file(s) to process (max ${maxFiles}).`);

  let mp3Urls = [];
  let metadataUrls = [];

  if (preMp3Urls && preMp3Urls.length > 0) {
    mp3Urls = preMp3Urls.slice(0, maxFiles);
    while (mp3Urls.length < maxFiles) mp3Urls.push('');
    log('Using pre-supplied MP3 URLs from env.MP3_URLS');
  } else {
    if (!pinataClient && filesToUpload.length > 0) {
      throw new Error('No PINATA credentials provided but uploads are required. Set PINATA_API_KEY and PINATA_API_SECRET or provide MP3_URLS env var.');
    }

    for (let i = 0; i < filesToUpload.length; i++) {
      const filename = filesToUpload[i];
      const filepath = path.join(musicDir, filename);
      const baseName = path.parse(filename).name;

      try {
        if (!fs.existsSync(filepath)) {
          throw new Error(`File not found: ${filepath}`);
        }

        // Check if file already pinned by metadata name
        const expectedMetaName = filename; // use filename as metadata.name for file pins
        let existingCid = await findPinByMetadataName(pinataClient, expectedMetaName);
        if (existingCid) {
          log(`Found existing pinned file for ${filename}: ${existingCid} (skipping upload)`);
          mp3Urls.push(`ipfs://${existingCid}`);
        } else {
          log(`[${i + 1}/${filesToUpload.length}] Uploading file: ${filename}`);
          const cid = await uploadFileToPinata(pinataClient, filepath, filename);
          if (!cid) throw new Error('uploadFileToPinata returned no cid');
          log(' -> MP3 uploaded:', cid);
          mp3Urls.push(`ipfs://${cid}`);
        }

        // Metadata: try to reuse existing metadata pin if present
        const metadataName = `metadata_${baseName}.json`;
        let metaCid = await findPinByMetadataName(pinataClient, metadataName);
        if (metaCid) {
          log(`Found existing metadata for ${baseName}: ${metaCid} (skipping metadata upload)`);
          metadataUrls.push(`ipfs://${metaCid}`);
        } else {
          const meta = {
            name: baseName,
            description: `Piano sample: ${baseName}`,
            animation_url: mp3Urls[mp3Urls.length - 1] || '',
            attributes: [
              { trait_type: 'Genre', value: 'Unknown' },
              { trait_type: 'Length', value: 'unknown' }
            ]
          };

          log('Uploading metadata for', baseName);
          const mCid = await uploadMetadataToPinata(pinataClient, meta, metadataName);
          if (!mCid) throw new Error('uploadMetadataToPinata returned no cid');
          log(' -> Metadata uploaded:', mCid);
          metadataUrls.push(`ipfs://${mCid}`);
        }

      } catch (err) {
        log(`Upload failed for ${filename}:`, err && err.message ? err.message : err);
        mp3Urls.push('');
        metadataUrls.push('');
      }

      if (uploadDelayMs > 0) {
        if (typeof utilSleep === 'function') {
          await utilSleep(uploadDelayMs);
        } else {
          await new Promise(r => setTimeout(r, uploadDelayMs));
        }
      }
    }
  }

  if (preMetadataUrls && preMetadataUrls.length > 0) {
    metadataUrls = preMetadataUrls.slice(0, maxFiles);
  }

  while (mp3Urls.length < maxFiles) mp3Urls.push('');
  while (metadataUrls.length < maxFiles) metadataUrls.push('');

  log('Final mp3Urls length:', mp3Urls.length);
  log('Final metadataUrls length:', metadataUrls.length);

  const platformDeployment = await getOrNull('PlatformToken');
  if (!platformDeployment) throw new Error('PlatformToken deployment not found. Ensure script tag/name matches \"PlatformToken\".');

  const nftDeployment = await getOrNull('NFTCollectible');
  if (!nftDeployment) throw new Error('NFTCollectible deployment not found. Ensure script tag/name matches \"NFTCollectible\".');

  const platformTokenAddress = platformDeployment.address;
  const nftCollectibleAddress = nftDeployment.address;

  if (!platformTokenAddress || !nftCollectibleAddress) {
    throw new Error('One of the dependent contracts has no address recorded.');
  }

  log('Deploying PianoGuessGame with:', {
    platformTokenAddress,
    nftCollectibleAddress,
    mp3Count: mp3Urls.length,
    performersCount: performers.length
  });

  const deployResult = await deploy('PianoGuessGame', {
    contract: 'PianoGuessGame',
    from: firstAccount,
    args: [platformTokenAddress, nftCollectibleAddress, mp3Urls, performers],
    log: true
  });

  log('PianoGuessGame deployed at', deployResult.address);

  return {
    mp3Urls,
    metadataUrls,
    performers,
    pianoGuessGame: { address: deployResult.address }
  };
};

module.exports.dependencies = ['NFTCollectible'];
module.exports.tags = ['all', 'sourceChain', 'PianoGuessGame'];