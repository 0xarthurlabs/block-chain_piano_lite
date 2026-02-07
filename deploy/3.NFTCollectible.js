const { getNamedAccounts } = require("hardhat");

module.exports = async({getNamedAccounts, deployments}) => {
    const {firstAccount} = await getNamedAccounts()
    const {deploy, log} = deployments
    const name = "PianoNFT"
    const symbol = "PNFT"
    
    console.log("Deploying the NFTCollectible contract")
    const nftCollectibleResult = await deploy("NFTCollectible", {
        contract: "NFTCollectible",
        from: firstAccount,
        log: true,
        args: [name, symbol]
    })
    console.log("NFTCollectible is deployed!")
}

module.exports.tags = ["all", "sourceChain", "NFTCollectible"]