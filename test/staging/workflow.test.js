const { getNamedAccounts, deployments, ethers, hre } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { expect } = require("chai")
const path = require("path");
const { log } = require("console");

const VERIFY = process.env.VERIFY === "true";
const CONFIRMATIONS = Number(process.env.WAIT_CONFIRMATIONS || 6);
const RETRIES = Number(process.env.VERIFY_RETRIES || 5);

async function waitFor(tx, conf = CONFIRMATIONS) {
    if (!tx) return;
    await tx.wait(conf);
}

async function verifyWithRetry(opts) {
    for (let i = 0; i < RETRIES; i++) {
        try {
            await hre.run("verify:verify", opts);
            return;
        } catch (err) {
            const msg = err?.message ?? String(err);
            if (msg.toLowerCase().includes("already verified")) return;
            console.warn(`verify attempt ${i + 1} failed: ${msg}`);
            if (i === RETRIES - 1) throw err;
            await new Promise(r => setTimeout(r, 3000 * Math.pow(2, i))); // 指数退避
        }
    }
}

developmentChains.includes(network.name)
    ? describe.skip
    : describe("WholeWorkFlow", async function () {

        let firstAccount
        let secondAccount
        let platformToken
        let tokenSale
        let nftCollectible
        let pianoGuessGame
        let nftBridgeSender
        let initialSupply = ethers.parseUnits("1000000", 18); // 1_000_000 PTK

        this.before(async function () {
            await deployments.fixture(["sourceChain"]);

            firstAccount = (await getNamedAccounts()).firstAccount
            secondAccount = (await ethers.getSigners())[1]   // second account for testing
            console.log("Second account (user):", secondAccount.address)
            platformToken = await ethers.getContract("PlatformToken", firstAccount)
            tokenSale = await ethers.getContract("TokenSale", firstAccount)
            nftCollectible = await ethers.getContract("NFTCollectible", firstAccount)
            pianoGuessGame = await ethers.getContract("PianoGuessGame", firstAccount)
            nftBridgeSender = await ethers.getContract("NFTBridgeSender", firstAccount)
        })

        // test fund function
        describe("The contract can be successfully run through", async function () {
            it("The forward workflow can be successfully run through", async function () {
                expect(await platformToken.name()).to.equal("Platform Token");
            })
            // TODO: add reverse workflow test
            it("The reverse workflow can be successfully run through", async function () {
                
            })
        })

        this.after(async function () {
            if (!VERIFY) {
                console.log("Skipping on-chain verification (VERIFY not set).");
                return;
            }
            console.log("Starting contract verification...");
            await verifyWithRetry({ address: platformToken.address, constructorArguments: [] });
            //await verifyWithRetry({ address: sale.address, constructorArguments: [token.address, 100] });
            console.log("Verification attempts finished.");
        })
    })
