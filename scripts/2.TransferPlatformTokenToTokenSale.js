const { ethers, deployments } = require("hardhat");

async function main() {
  // 1. Get signer (using the first account from your hardhat config)
  const [signer] = await ethers.getSigners();
  
  console.log("----------------------------------------------------");
  console.log("Transfering PlatformToken (owner must be deployer):", signer.address);

  // 2. Locate PlatformToken deployment
  // This still uses 'deployments.get' to find the address from previous deployments
  let tokenAddress;
  try {
    const deployment = await deployments.get("PlatformToken");
    tokenAddress = deployment.address;
    console.log(`Found PlatformToken at: ${tokenAddress}`);
  } catch (err) {
    console.error("Error: PlatformToken deployment not found.");
    // Manual fallback if needed: tokenAddress = "0x...";
    return;
  }

  // 3. Locate TokenSale deployment
  let tokenSaleAddress;
  try {
    const deploymentTokenSale = await deployments.get("TokenSale");
    tokenSaleAddress = deploymentTokenSale.address;
    console.log(`Found TokenSale at: ${tokenSaleAddress}`);
  } catch (err) {
    console.error("Error: TokenSale deployment not found.");
    return;
  }

  // 4. Connect to contract
  const token = await ethers.getContractAt("PlatformToken", tokenAddress, signer);

  // Params
  const amountStr = process.env.Transfer_AMOUNT || "500000";

  // Read decimals safely
  let decimalsRaw = await token.decimals();
  let decimals;
  try {
    // Handling different ethers versions (BigInt vs BigNumber)
    decimals = (typeof decimalsRaw === "bigint") ? Number(decimalsRaw) : 
               (decimalsRaw.toNumber ? decimalsRaw.toNumber() : Number(decimalsRaw));
  } catch (e) {
    console.log("Warning: failed to parse decimals(), fallback to 18");
    decimals = 18;
  }
  console.log("Token decimals:", decimals);

  // Pick parseUnits & isAddress based on ethers API version
  const parseUnits = (ethers.utils && ethers.utils.parseUnits) || ethers.parseUnits;
  const isAddress = (ethers.utils && ethers.utils.isAddress) || ethers.isAddress;

  if (!parseUnits) throw new Error("parseUnits not found on ethers.");
  if (!isAddress) throw new Error("isAddress not found on ethers.");

  let amountBn;
  try {
    amountBn = parseUnits(amountStr, decimals);
  } catch (err) {
    throw new Error(`Failed to parse amount '${amountStr}' with decimals ${decimals}: ${err.message}`);
  }
  console.log(`Transfering amount (base units): ${amountBn.toString()}`);

  // Validate tokenSale address
  if (!isAddress(tokenSaleAddress)) {
    console.log(`Skipping invalid tokenSale address: ${tokenSaleAddress}`);
    return;
  }

  // 5. Execute transfer
  try {
    console.log(`Transfering ${amountStr} PTK to ${tokenSaleAddress} ...`);
    const tx = await token.transfer(tokenSaleAddress, amountBn);

    console.log("Transaction sent. tx.hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("Receipt confirmed in block:", receipt.blockNumber);
    
    console.log("✅ Transfering finished.");
  } catch (err) {
    console.error("Transfer transaction failed:", err);
    throw err;
  }
}

// Execution pattern for 'npx hardhat run'
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });