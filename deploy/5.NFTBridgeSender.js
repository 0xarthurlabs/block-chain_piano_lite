const { getNamedAccounts } = require("hardhat");
const { networkConfig } = require("../helper-hardhat-config");

module.exports = async({getNamedAccounts, deployments}) => {
    const {firstAccount} = await getNamedAccounts()
    const {deploy, log} = deployments

    const nftDeployment = await deployments.get("NFTCollectible");
    if (!nftDeployment) throw new Error("NFTCollectible deployment not found. Ensure script tag/name matches 'NFTCollectible'.");
    const nftCollectibleAddress = nftDeployment.address;

    let router;
    let linkTokenAddr;
    if(developmentChains.includes(network.name)) {
        const ccipSimulatorTx = await deployments.get("CCIPLocalSimulator");
        const ccipSimulator = await ethers.getContractAt("CCIPLocalSimulator", ccipSimulatorTx.address);
        const ccipConfig = await ccipSimulator.configuration();
        router = ccipConfig.sourceRouter_;
        linkTokenAddr = ccipConfig.linkToken_;
    } else {
        router = networkConfig[network.config.chainId].router;
        linkTokenAddr = networkConfig[network.config.chainId].linkToken;
    }

    log(`NFTBridgeSender get the parameters: router ${router}, linkTokenAddr ${linkTokenAddr}, nftCollectibleAddress ${nftCollectibleAddress}`);

    console.log("Deploying the NFTBridgeSender contract")
    const nftBridgeSenderResult = await deploy("NFTBridgeSender", {
        contract: "NFTBridgeSender",
        from: firstAccount,
        log: true,
        args: [firstAccount, router, linkTokenAddr, nftCollectibleAddress]
    })
    console.log("NFTBridgeSender is deployed!")
}

module.exports.dependencies = ["NFTCollectible", "CCIPSimulator"]
module.exports.tags = ["all", "sourceChain", "NFTBridgeSender"]