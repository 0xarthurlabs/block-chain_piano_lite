const { getNamedAccounts } = require("hardhat");
const { networkConfig } = require("../helper-hardhat-config");

module.exports = async({getNamedAccounts, deployments}) => {
    const {firstAccount} = await getNamedAccounts()
    const {deploy, log} = deployments
    
    const wnftDeployment = await deployments.get("WrappedNFT");
    if (!wnftDeployment) throw new Error("WrappedNFT deployment not found. Ensure script tag/name matches 'WrappedNFT'.");
    const wnftAddress = wnftDeployment.address;

    let router;
    let linkTokenAddr;
    if(developmentChains.includes(network.name)) {
        const ccipSimulatorTx = await deployments.get("CCIPLocalSimulator");
        const ccipSimulator = await ethers.getContractAt("CCIPLocalSimulator", ccipSimulatorTx.address);
        const ccipConfig = await ccipSimulator.configuration();
        router = ccipConfig.destinationRouter_;
        linkTokenAddr = ccipConfig.linkToken_;
    } else {
        router = networkConfig[network.config.chainId].router;
        linkTokenAddr = networkConfig[network.config.chainId].linkToken;
    }

    log(`get the parameters: ${router}, ${linkTokenAddr}, ${wnftAddress}`);

    console.log("Deploying the NFTBridgeReceiver contract")
    const nftBridgeReceiverResult = await deploy("NFTBridgeReceiver", {
        contract: "NFTBridgeReceiver",
        from: firstAccount,
        log: true,
        args: [router, wnftAddress]
    })
    console.log("NFTBridgeReceiver is deployed!")
}

module.exports.dependencies = ["WrappedNFT"]
module.exports.tags = ["all", "destChain", "NFTBridgeReceiver"]