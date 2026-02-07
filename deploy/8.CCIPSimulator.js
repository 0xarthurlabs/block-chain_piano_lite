const { getNamedAccounts, deployments, network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

module.exports = async({getNamedAccounts, deployments}) => {

    const { deploy, log } = deployments
    
    if(developmentChains.includes(network.name)) {
        const { firstAccount } = await getNamedAccounts()
        
        log("deploy the CCIP local simulator")
        await deploy("CCIPLocalSimulator", {
            contract: "CCIPLocalSimulator",
            from: firstAccount,
            log: true,
            args: []
        })
        log("CCIP local simulator deployed!")
    } else {
        log("not in local, skip CCIP local")
    }
}

module.exports.tags = ["all", "sourceChain", "CCIPSimulator"]