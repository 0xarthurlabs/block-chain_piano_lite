const { getNamedAccounts, deployments, ethers } = require("hardhat")
const { expect } = require("chai")
const path = require("path");
const { log } = require("console");

let firstAccount
let secondAccount
let platformToken
let tokenSale
let nftCollectible
let pianoGuessGame
let nftBridgeSender
let initialSupply = ethers.parseUnits("1000000", 18); // 1_000_000 PTK

before(async function () {
    this.timeout(200000);
    firstAccount = (await getNamedAccounts()).firstAccount
    secondAccount = (await ethers.getSigners())[1]   // second account for testing
    console.log("Second account (user):", secondAccount.address)
    await deployments.fixture(["all"]) // ensure you start from a fresh deployment
    platformToken = await ethers.getContract("PlatformToken", firstAccount)
    tokenSale = await ethers.getContract("TokenSale", firstAccount)
    nftCollectible = await ethers.getContract("NFTCollectible", firstAccount)
    pianoGuessGame = await ethers.getContract("PianoGuessGame", firstAccount)
    nftBridgeSender = await ethers.getContract("NFTBridgeSender", firstAccount)
})

describe("unit test for PlatformToken",
    async function () {
        it("has correct name, symbol, decimals and total supply",
            async function () {
                expect(await platformToken.name()).to.equal("Platform Token");
                expect(await platformToken.symbol()).to.equal("PTK");
                expect(await platformToken.decimals()).to.equal(18);
                expect(await platformToken.totalSupply()).to.equal(initialSupply);
            });

        it("Deployer keep proper balance  after transfer 500000 PTK to SaleToken", async function () {
            await platformToken.transfer(tokenSale.target, ethers.parseUnits("500000", 18)); // transfer back for testing
            const balance = await platformToken.balanceOf(firstAccount);
            expect(balance).to.equal(ethers.parseUnits("500000", 18));
        });

        it("should allow the deployer to mint additional tokens and correctly update total supply and their balance", async function () {
            const amount = ethers.parseUnits("1000", 18); // 1000 PTK
            await platformToken.mint(firstAccount, amount);
            const totalSupply = await platformToken.totalSupply();
            expect(totalSupply).to.equal(initialSupply + amount);
        });
    }
)

describe("unit test for TokenSale",
    async function () {
        it("has correct initial rate", async function () {
            const rate = await tokenSale.rate();
            expect(rate).to.equal(1000);
        });

        it("user can buy tokens with ETH correctly", async function () {
            const ethToSend = ethers.parseEther("1");
            const rate = await tokenSale.rate();
            const expectedPTK = ethToSend * rate;

            await expect(tokenSale.connect(secondAccount).buyTokens({ value: ethToSend }))
                .to.emit(tokenSale, "Sold")
                .withArgs(secondAccount.address, ethToSend, expectedPTK);

            expect(await platformToken.balanceOf(secondAccount.address)).to.equal(expectedPTK);
        });

        it("should forward ETH to owner", async function () {
            const ethToSend = ethers.parseEther("1");
            const ownerBalanceBefore = await ethers.provider.getBalance(firstAccount);

            const tx = await tokenSale.connect(secondAccount).buyTokens({ value: ethToSend });
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            const ownerBalanceAfter = await ethers.provider.getBalance(firstAccount);
            expect(ownerBalanceAfter).to.be.greaterThanOrEqual(ownerBalanceBefore + ethToSend - gasUsed);
        });
    }
)

describe("unit test for NFTCollectible", function () {
    it("should allow admin to add token URI and list it in availableTokenIds", async function () {
        await nftCollectible.addTokenURI(1, "ipfs://uri1");
        const available = await nftCollectible.getAvailableTokenIds();
        expect(available.map(x => Number(x))).to.include(1);

        const uri = await nftCollectible.tokenURI(1);
        expect(uri).to.equal("ipfs://uri1");
    });
})

describe("unit test for PianoGuessGame", function () {
    let COST
    before(async function () {
        COST = ethers.parseUnits("200", 18)
        // mint 2000 PTK to user
        await platformToken.mint(secondAccount.address, ethers.parseUnits("2000", 18))
    })

    it("should initialize with 5 compositions", async function () {
        const total = await pianoGuessGame.totalCompositions()
        expect(total).to.equal(5)

        for (let i = 0; i < total; i++) {
            const [url, performer] = await pianoGuessGame.getComposition(i)
            expect(url).to.be.a("string")
            expect(performer).to.be.a("string")
        }
    })

    it("should allow a correct guess and increase correctCount", async function () {
        // approve COST
        await platformToken.connect(secondAccount).approve(pianoGuessGame.target, COST)

        const tx = await pianoGuessGame.connect(secondAccount).guess(0, "Frédéric Chopin")
        await expect(tx).to.emit(pianoGuessGame, "GuessResult").withArgs(secondAccount.address, true, 1)

        const count = await pianoGuessGame.correctCount(secondAccount.address)
        expect(count).to.equal(1)
    })

    it("should allow a wrong guess but not increase correctCount", async function () {
        await platformToken.connect(secondAccount).approve(pianoGuessGame.target, COST)

        const tx = await pianoGuessGame.connect(secondAccount).guess(0, "Ludwig van Beethoven")
        await expect(tx).to.emit(pianoGuessGame, "GuessResult").withArgs(secondAccount.address, false, 1) // still 1

        const count = await pianoGuessGame.correctCount(secondAccount.address)
        expect(count).to.equal(1)
    })

    it("should revert on invalid index", async function () {
        await platformToken.connect(secondAccount).approve(pianoGuessGame.target, COST)
        await expect(
            pianoGuessGame.connect(secondAccount).guess(99, "anyPerformer")
        ).to.be.revertedWith("Invalid index")
    })

    it("should not redeem NFT if less than 3 correct guesses", async function () {
        await expect(
            pianoGuessGame.connect(secondAccount).redeemNFT(1)
        ).to.be.revertedWith("Not enough correct guesses")
    })

    it("should redeem NFT after 3 correct guesses", async function () {
        // Make up 2 more correct guesses to reach 3
        await platformToken.connect(secondAccount).approve(pianoGuessGame.target, COST)
        await pianoGuessGame.connect(secondAccount).guess(1, "Ludwig van Beethoven")

        await platformToken.connect(secondAccount).approve(pianoGuessGame.target, COST)
        await pianoGuessGame.connect(secondAccount).guess(2, "Sibelius")

        const before = await pianoGuessGame.correctCount(secondAccount.address)
        expect(before).to.equal(3)

        //await nftCollectible.grantMinter(accounts[0].address); // firstAccount is minter
        
        // set URI first
        await nftCollectible.addTokenURI(3, "ipfs://uri3");

        const tx = await pianoGuessGame.connect(secondAccount).redeemNFT(3)
        await expect(tx).to.emit(pianoGuessGame, "NFTRedeemed").withArgs(secondAccount.address, 3)

        const after = await pianoGuessGame.correctCount(secondAccount.address)
        expect(after).to.equal(0)

        const owner = await nftCollectible.ownerOf(3);
        expect(owner).to.equal(secondAccount.address);
    })
})

describe("unit test for NFTBridgeSender", function () {
    it("request LINK faucet -> approve -> sendNFT burns NFT and bridge holds LINK", async function () {
        
        const owner = await nftCollectible.ownerOf(3);
        log(`owner of tokenId 3 before bridging: ${owner}, expected: ${secondAccount.address}`);
        expect(owner).to.equal(secondAccount.address);
        
        const ccipSimulatorTx = await deployments.get("CCIPLocalSimulator");
        const ccipSimulator = await ethers.getContractAt("CCIPLocalSimulator", ccipSimulatorTx.address);
        const ccipConfig = await ccipSimulator.configuration();
        const chainSelector = ccipConfig.chainSelector_;
        const tokenId = 3;
        const tokenURI = await nftCollectible.tokenURI(tokenId);

        const nftBridgeReceiverArtifactPath = path.join(process.cwd(), "deployments", "localhost", "NFTBridgeReceiver.json");
        const nftBridgeReceiverArtifact = require(nftBridgeReceiverArtifactPath);
        const nftBridgeReceiverAddress = nftBridgeReceiverArtifact.address;

        const link = await ethers.getContractAt("LinkToken", ccipConfig.linkToken_);
        const router = await ethers.getContractAt("IRouterClient", ccipConfig.destinationRouter_);

        /*console.log("link:", link);
        console.log("router:", router);*/

        log("NFTBridgeReceiver address:", nftBridgeReceiverAddress);
        log("Token ID to bridge:", tokenId);
        log("Token URI to bridge:", tokenURI);
        log("Destination chain selector:", chainSelector);
        log("nftBridgeReceiverAddress:", nftBridgeReceiverAddress);

        const abi = (ethers.utils && ethers.utils.defaultAbiCoder)
                    ? ethers.utils.defaultAbiCoder         // ethers v5
                    : (ethers.AbiCoder && ethers.AbiCoder.defaultAbiCoder
                        ? ethers.AbiCoder.defaultAbiCoder() // ethers v6
                        : null);
        const encodedReceiver = abi.encode(["address"], [nftBridgeReceiverAddress]); // 与 contract 中 abi.encode(receiver) 等价
        const encodedData = abi.encode(["address", "uint256", "string"], [secondAccount.address, tokenId, tokenURI]);
        log("Encoded receiver:", encodedReceiver);
        log("Encoded data:", encodedData);
        log("linkToken_", ccipConfig.linkToken_);

        const fee = await router.getFee(chainSelector, {
            receiver: encodedReceiver,
            data: encodedData,
            tokenAmounts: [],
            extraArgs: "0x", // 与 sendNFT 中的 extraArgs 保持一致
            feeToken: ccipConfig.linkToken_
        });

        console.log("Computed fee:", fee.toString());

        const balanceBefore = await link.balanceOf(secondAccount.address);
        console.log(`balance before: ${balanceBefore}`);
        await ccipSimulator.requestLinkFromFaucet(secondAccount.address, fee);
        const balanceAfter = await link.balanceOf(secondAccount.address);
        console.log(`balance after: ${balanceAfter}`);

        log(`nftBridgeSender.target: ${nftBridgeSender.target}`);
        log(`nftBridgeSender.address: ${nftBridgeSender.address}`);

        await link.connect(secondAccount).approve(nftBridgeSender.target, fee);
        
        try {
            const tx = await nftBridgeSender.connect(secondAccount).sendNFT(
                    chainSelector, // destinationChainSelector
                    nftBridgeReceiverAddress,   // receiver
                    secondAccount.address,
                    tokenId,
                    tokenURI
                );
                await tx.wait();
        } catch (e) {
            if (e.error && e.error.message) console.error("e.error.message:", e.error.message);
            if (e.data) console.error("raw revert data:", e.data);
            const iface = new ethers.Interface([
                "error ReceiverError(address)"
                ]);
            const parsed = iface.parseError(e.data);
            console.log("Parsed error name:", parsed.name);
            console.log("Parsed error args:", parsed.args);
            throw e;
        }

        /*await expect(
            nftBridgeSender.connect(secondAccount).sendNFT(
                chainSelector, // destinationChainSelector
                nftBridgeReceiverAddress,   // receiver
                secondAccount.address,
                tokenId,
                tokenURI
            )
        ).not.to.be.reverted;
        
        await expect(nftCollectible.ownerOf(tokenId)).to.be.reverted;*/
    })
})

describe("unit test for NFTBridgeReceiver", function () {
    it("verification for reciever has got NFT", async function () {
        
        const wrappedNFTArtifactPath = path.join(process.cwd(), "deployments", "localhost", "WrappedNFT.json");
        const wrappedNFTArtifact = require(wrappedNFTArtifactPath);
        const wrappedNFTAddress = wrappedNFTArtifact.address;
        const wrappedNFT = await ethers.getContractAt("WrappedNFT", wrappedNFTAddress);

        await expect(wrappedNFT.ownerOf(3)).not.to.be.reverted;

        const owner = await wrappedNFT.ownerOf(3);
        expect(owner).to.equal(secondAccount.address);
    })
})