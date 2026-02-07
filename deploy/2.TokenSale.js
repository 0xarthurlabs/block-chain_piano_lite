const { getNamedAccounts } = require("hardhat");

module.exports = async({getNamedAccounts, deployments}) => {
    const {firstAccount} = await getNamedAccounts()
    const {deploy, log} = deployments
    
    const platformTokenDeployment = await deployments.get("PlatformToken");
    if (!platformTokenDeployment) throw new Error("PlatformToken deployment not found. Ensure script tag/name matches 'PlatformToken'.");
    const platformTokenAddress = platformTokenDeployment.address;
    const rate = 1000;  // Example rate: 1000 tokens per ETH

    console.log("Deploying the TokenSale contract")
    const tokenSaleResult = await deploy("TokenSale", {
        contract: "TokenSale",
        from: firstAccount,
        log: true,
        args: [platformTokenAddress, rate] 
    })
    console.log("TokenSale is deployed!")
}

module.exports.dependencies = ["PlatformToken"]
module.exports.tags = ["all", "sourceChain", "TokenSale"]