const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Simple sleep, wait for explorer indexing (ms)
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function saveDeployment(networkName, json) {
  const dir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  const file = path.join(dir, `${networkName}.json`);
  fs.writeFileSync(file, JSON.stringify(json, null, 2));
  console.log(`Deployment addresses have been saved to ${file}`);
}

// Parse from process.argv whether --verify is included (will be preserved for child processes)
function parseFlags() {
  const args = process.argv.slice(2);
  return {
    verify: args.includes("--verify"),
    // If you want other flags, you can add parsing here
  };
}

async function runDeployForNetwork(hre, verifyFlag) {
  const networkName = hre.network.name;
  console.log(`\n===== Start deployment on network [${networkName}] (verify=${verifyFlag}) =====`);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", (await deployer.getBalance()).toString());

  const deployments = {};

  // -------------------------
  // 1) Deploy PlatformToken
  // -------------------------
  console.log("\nDeploying PlatformToken...");
  const PlatformToken = await hre.ethers.getContractFactory("PlatformToken");
  // The following constructor arguments are only examples: please adjust per your PlatformToken constructor
  const tokenName = process.env.DEFAULT_TOKEN_NAME || "PlatformToken";
  const tokenSymbol = process.env.DEFAULT_TOKEN_SYMBOL || "PTKN";
  const initialHolders = [deployer.address];
  const initialSupply = hre.ethers.utils.parseUnits("1000000", 18);

  const platformToken = await PlatformToken.deploy(tokenName, tokenSymbol, initialHolders, initialSupply);
  await platformToken.deployed();
  console.log("PlatformToken address:", platformToken.address);
  deployments.PlatformToken = platformToken.address;

  if (verifyFlag) {
    // Wait for block explorer to index the transaction (adjust waiting time as needed)
    console.log("Waiting for block explorer to index (15s)...");
    await sleep(15000);
    try {
      console.log("Verifying PlatformToken...");
      // Note: if constructor arguments include BigNumber, convert them to strings
      await hre.run("verify:verify", {
        address: platformToken.address,
        constructorArguments: [tokenName, tokenSymbol, initialHolders, initialSupply.toString()],
      });
      console.log("PlatformToken verified successfully");
    } catch (e) {
      console.warn("PlatformToken verification failed (continue with subsequent deployments):", e.message || e);
    }
  }

  // -------------------------
  // 2) Deploy TokenSale (depends on PlatformToken)
  // -------------------------
  console.log("\nDeploying TokenSale (depends on PlatformToken)...");
  const TokenSale = await hre.ethers.getContractFactory("TokenSale");
  // Example constructor arguments: (tokenAddr, walletAddr, pricePerToken, whitelistAddresses)
  const saleToken = platformToken.address;
  const saleWallet = deployer.address;
  const pricePerToken = hre.ethers.utils.parseUnits("0.01", "ether"); // Example price
  const whitelist = [deployer.address];

  const tokenSale = await TokenSale.deploy(saleToken, saleWallet, pricePerToken, whitelist);
  await tokenSale.deployed();
  console.log("TokenSale address:", tokenSale.address);
  deployments.TokenSale = tokenSale.address;

  if (verifyFlag) {
    console.log("Waiting for block explorer to index (12s)...");
    await sleep(12000);
    try {
      console.log("Verifying TokenSale...");
      await hre.run("verify:verify", {
        address: tokenSale.address,
        constructorArguments: [saleToken, saleWallet, pricePerToken.toString(), whitelist],
      });
      console.log("TokenSale verified successfully");
    } catch (e) {
      console.warn("TokenSale verification failed:", e.message || e);
    }
  }

  // -------------------------
  // 3) Deploy NFTCollectible
  // -------------------------
  console.log("\nDeploying NFTCollectible...");
  const NFTCollectible = await hre.ethers.getContractFactory("NFTCollectible");
  // Example constructor arguments: (name, symbol, baseURI, artists[])
  const nftName = process.env.DEFAULT_NFT_NAME || "MyNFT";
  const nftSymbol = process.env.DEFAULT_NFT_SYMBOL || "MNFT";
  const baseURI = process.env.DEFAULT_BASE_URI || "ipfs://example/";
  const artists = [deployer.address];

  const nft = await NFTCollectible.deploy(nftName, nftSymbol, baseURI, artists);
  await nft.deployed();
  console.log("NFTCollectible address:", nft.address);
  deployments.NFTCollectible = nft.address;

  if (verifyFlag) {
    console.log("Waiting for block explorer to index (12s)...");
    await sleep(12000);
    try {
      console.log("Verifying NFTCollectible...");
      await hre.run("verify:verify", {
        address: nft.address,
        constructorArguments: [nftName, nftSymbol, baseURI, artists],
      });
      console.log("NFTCollectible verified successfully");
    } catch (e) {
      console.warn("NFTCollectible verification failed:", e.message || e);
    }
  }

  // -------------------------
  // 4) Deploy PianoGuessGame (depends on PlatformToken and NFTCollectible)
  // -------------------------
  console.log("\nDeploying PianoGuessGame (depends on PlatformToken and NFTCollectible)...");
  const PianoGuessGame = await hre.ethers.getContractFactory("PianoGuessGame");
  // Example constructor arguments: (gameName, platformTokenAddr, nftAddr, adminAddr)
  const gameName = process.env.DEFAULT_GAME_NAME || "PianoMaster";
  const platformTokenAddr = platformToken.address;
  const nftAddr = nft.address;
  const adminAddr = deployer.address;

  const piano = await PianoGuessGame.deploy(gameName, platformTokenAddr, nftAddr, adminAddr);
  await piano.deployed();
  console.log("PianoGuessGame address:", piano.address);
  deployments.PianoGuessGame = piano.address;

  if (verifyFlag) {
    console.log("Waiting for block explorer to index (12s)...");
    await sleep(12000);
    try {
      console.log("Verifying PianoGuessGame...");
      await hre.run("verify:verify", {
        address: piano.address,
        constructorArguments: [gameName, platformTokenAddr, nftAddr, adminAddr],
      });
      console.log("PianoGuessGame verified successfully");
    } catch (e) {
      console.warn("PianoGuessGame verification failed:", e.message || e);
    }
  }

  // Save this network's deployment information to a file
  await saveDeployment(hre.network.name, deployments);

  console.log(`\n===== Deployment completed on network [${hre.network.name}] =====\n`);
  return deployments;
}

// When executed with --network all, we use the parent process to spawn child processes to call this script sequentially (to avoid recursion issues)
async function main() {
  const args = process.argv.slice(2);
  const verifyFlag = args.includes("--verify");
  // If the user explicitly passes --network all (or via npm script), hre.network.name may also be read
  const networkArgIndex = args.indexOf("--network");
  const networkArg = networkArgIndex >= 0 ? args[networkArgIndex + 1] : hre.network.name;

  if (networkArg === "all") {
    // The deployment order of target networks (adjust as needed)
    const targetNets = ["sepolia", "holesky", "polygonAmoy"];
    for (const net of targetNets) {
      console.log(`\n>>> Parent process: Starting deployment subprocess for target network ${net} (verify=${verifyFlag})`);
      const spawn = require("child_process").spawnSync;
      const cmdArgs = [
        "hardhat", "run", "scripts/deploy.js",
        "--network", net,
        ...(verifyFlag ? ["--verify"] : [])
      ];
      // Use 'npx' in cross-platform environments, it's more reliable
      const result = spawn("npx", cmdArgs, { stdio: "inherit" });
      if (result.error) {
        console.error(`Child process execution failed on network ${net}:`, result.error);
        process.exit(1);
      }
      if (result.status !== 0) {
        console.error(`Child process on network ${net} returned non-zero exit code ${result.status}`);
        process.exit(result.status);
      }
      console.log(`Parent process: Completed child task for network ${net}\n`);
    }
    console.log("Deployment completed for all target networks.");
    return;
  }

  // Not in all mode: deploy directly on the current hre.network
  await runDeployForNetwork(hre, verifyFlag);
}

main().catch((err) => {
  console.error("Deployment script error:", err);
  process.exit(1);
});
