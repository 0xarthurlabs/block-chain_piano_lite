const { getNamedAccounts } = require("hardhat");

module.exports = async({getNamedAccounts, deployments}) => {
    const {firstAccount} = await getNamedAccounts()
    const {deploy, log} = deployments
    
    console.log("Deploying the PlatformToken contract")
    const platformTokenResult = await deploy("PlatformToken", {
        contract: "PlatformToken",
        from: firstAccount,
        log: true
    })
    console.log("PlatformToken is deployed!")
}

module.exports.tags = ["all", "sourceChain", "PlatformToken"]