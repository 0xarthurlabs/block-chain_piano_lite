const { getNamedAccounts } = require("hardhat");

module.exports = async({getNamedAccounts, deployments}) => {
    const {firstAccount} = await getNamedAccounts()
    const {deploy, log} = deployments
    const name = "PianoNFT"
    const symbol = "PNFT"
    
    console.log("Deploying the WrappedNFT contract")
    const wrappedNFTResult = await deploy("WrappedNFT", {
        contract: "WrappedNFT",
        from: firstAccount,
        log: true,
        args: [name, symbol]
    })
    console.log("WrappedNFT is deployed!")
}

module.exports.tags = ["all", "destChain", "WrappedNFT"]