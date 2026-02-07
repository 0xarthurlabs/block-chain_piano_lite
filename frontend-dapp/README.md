<div align="center">
<img src="https://gateway.pinata.cloud/ipfs/bafkreigs3nupsg354hzhp3pfirepvod2vhcb5jl6qfdhqukjhpnr633ss4" width="300" height="300"/>

# 									🎹Blockchain_piano_game_Lite

<p align="center">
  <a href="https://www.gnu.org/licenses/gpl-3.0.txt">
    <img src="https://gateway.pinata.cloud/ipfs/bafkreianevlnlofslyrkm3pbcmbisybjkxxvnxrrc3wli3eepgiyhleogu" alt="license">
  </a>
    <a href="https://github.com/0xarthurlabs/block-chain_piano_lite">
    <img src="https://gateway.pinata.cloud/ipfs/bafkreiaagmn5nhsva3wq6faeq6mzgwbqyh34iooydd7rqibnzsplv4gqim" alt="codebase">
  </a>
</p>

# 🚀Live Demo(Vercel)

[Vercel Link]



# 📝Project Overview

**Web3 Blockchain_piano_game** is an interactive, decentralized gaming ecosystem that merges music theory with blockchain technology. The platform features a "Play-to-Mint" model where players utilize a custom utility token to engage in musical challenges, earn unique NFT collectibles, and leverage cross-chain interoperability for asset mobility.

By integrating **Chainlink CCIP**, the project ensures that earned achievements are not siloed to a single network, allowing users to bridge their musical milestones across different blockchain ecosystems seamlessly.



# 🏗️ 1. Architecture Overview

The project adopts a modular, multi-layered architecture, with the **Lite version** successfully implementing all core functionalities: the frontend utilizes **React** and **Ethers.js** for seamless wallet interaction, while the contract layer is built on **Hardhat** and deployed across the **Ethereum Sepolia** and **Polygon Amoy** testnets. To facilitate asset interoperability, **Chainlink CCIP** is integrated for secure cross-chain transfers. Future **Pro** and **Ultra** iterations will expand into **DeFi** and **DAO** applications with comprehensive security audits, while introducing advanced features such as data indexing (**The Graph**), L2 scaling (**Arbitrum**), **zkEVM** integration, and multi-sig security via **Gnosis Safe**.

![image-20260205160842029](C:\Users\Li\AppData\Roaming\Typora\typora-user-images\image-20260205160842029.png)



# 🔄 2. Business Logic Flow

The dApp's operational lifecycle starts with the **Owner** deploying the ecosystem and minting **PlatformTokens** to fund the **TokenSale** contract, where **Users** purchase them using native **ETH**. These tokens act as entry fees for the **Piano Guess Game**; upon achieving three successful guesses, the system triggers the minting of an **NFTCollectible** directly to the player's wallet. Finally, users can leverage the **Chainlink CCIP** bridge to transfer their assets, where the **NFTBridgeSender** locks or burns the original NFT to trigger the minting of a **WrappedNFT** on the destination chain via the **NFTBridgeReceiver**.

![钢琴项目业务流程](F:\nieliang\learning\block chain\钢琴项目业务流程.png)



# 🛡️ 3. Web3 Security & Gas/Code Optimization

The current **Lite version** focuses primarily on core functional implementation and cross-chain architecture. **Please note that this project has not yet undergone a formal security audit and should not be used in a production environment.**

Security is an ongoing commitment. Starting with the **Pro version**, the development process will strictly adhere to the comprehensive **Web3 Security Spectrum** illustrated above—addressing critical patterns such as Reentrancy, Access Control, and Integer Overflow. I am dedicated to continuously updating this security knowledge base to safeguard system integrity while implementing advanced **Gas/Code Optimization** techniques (such as using `calldata`, immutable constants, and efficient storage packing) to ensure a high-performance, cost-effective user experience.

![image-20260205160858499](C:\Users\Li\AppData\Roaming\Typora\typora-user-images\image-20260205160858499.png)



#  📁 4. Project Structure

To maintain a clean and scalable codebase, the project is organized into a modular directory structure. This separates smart contract development, frontend application logic, and deployment orchestration for streamlined maintenance and cross-chain expansion.

**Smart Contracts**: Located in `contracts/`, managing the core logic of the piano game.

**DApp Frontend**: A React-based interface in `frontend-dapp/` that interacts with the blockchain via `hooks/`.

**Deployment & Scripts**: Handled by Hardhat via `deploy/`  & `scripts/` for easy multi-network deployment.

~~~Plaintext
00_BLOCKCHAIN_PIANO_GAME/
├── abi/                    # Compiled contract ABIs
├── artifacts/              # Hardhat build artifacts
├── assets/                 # Project static assets (images, audio files, etc.)
├── contracts/              # Solidity smart contract source code
├── deploy/                 # Deployment configuration files
├── deployments/            # Records of deployed contract addresses and info
├── frontend-dapp/          # Frontend React/Next.js application
│   ├── public/             # Public static assets for the web
│   └── src/                # Frontend source code
│       ├── abi/            # Contract ABIs used by the frontend
│       ├── components/     # UI components
│       ├── hooks/          # Custom Web3/Wagmi hooks
│       └── pages/          # Page routes and views
├── scripts/                # Automation and maintenance scripts
│   ├── 1.deploy.js         # Contract deployment script
│   └── 3.1.PinataUpload... # NFT asset upload script (Pinata/IPFS)
├── test/                   # Contract testing suite (Unit & Staging tests)
├── utils/                  # Common utility functions
├── .env                    # Environment variables (Private Keys, RPC URLs)
├── hardhat.config.js       # Hardhat development environment configuration
├── package.json            # Project dependencies and scripts
└── README.md               # Project documentation
~~~



# 💻 5. Local Development Guide

Follow the steps below to set up your local development environment. This guide covers the end-to-end process, including infrastructure configuration, smart contract deployment via Hardhat, and launching the frontend interface for local testing.

## 5.1 Prerequisites (Environment)

Before you begin, ensure you have the following installed:

- **Node.js**: `v18.x` or higher (Recommended: `v20.x` LTS)
- **npm**: `v10.8` or higher
- **Hardhat**: Local development environment for smart contracts.

> **Note**: This project has been tested with **Node.js v18.20.8** and **npm v10.8.2**. Using older versions may cause unexpected dependency conflicts.

## 5.2 Environment & Infrastructure Setup

Before deploying the contracts, you must configure your external service providers and acquire testnet tokens.

### 5.2.1 Infrastructure Providers

You will need RPC endpoints to interact with the blockchain. Register and obtain API Keys from the following platforms:

- **Alchemy**: https://www.alchemy.com — Recommended for high-performance Sepolia/Amoy nodes.
- **Infura**: https://www.infura.io — Excellent alternative for redundant RPC access.

### 5.2.2 Network Nodes (RPC Endpoints)

The **Lite** version is optimized for the following test networks:

- **Source Chain**: Ethereum Sepolia
- **Destination Chain**: Polygon Amoy

### 5.2.3 Testnet Faucets

You will need test tokens to pay for Gas and interact with the game.

- **Native Tokens (ETH / MATIC)**:
  - [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet) (Supports multiple chains)
  - [Polygon Faucet](https://faucet.polygon.technology) (Dedicated for Amoy)
- **Chainlink LINK Tokens**:
  - [Chainlink Faucet](https://faucets.chain.link/) (Required for CCIP cross-chain fees)

### 5.2.4 Environment Configuration (`.env`)

Create a `.env` file in the project root. 

~~~.env
# --- Wallet Security ---
PRIVATE_KEY=your_wallet_private_key_here

# --- RPC URLs ---

SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<Your-Alchemy-API-KEY>

POLYGON_AMOY_RPC_URL=https://polygon-amoy.infura.io/v3/<Your-Infura-API-KEY>

# --- Provider Keys ---

ALCHEMY_API_KEY=<Your-Alchemy-API-KEY>

INFURA_API_KEY=<Your-Infura-API-KEY>

# --- IPFS Storage (Pinata) ---

PINATA_API_KEY=<Generate From https://pinata.cloud>

PINATA_API_SECRET=<Generate From https://pinata.cloud>

PINATA_JWT =<Generate From https://pinata.cloud>
~~~

## 5.3 Dependencies Installation

To install all necessary packages for the smart contracts and development environment, run the following command in the root directory:

```shell
# Install root dependencies (Hardhat, Ethers, OpenZeppelin, etc.)
npm install
```

## 5.4 Contract Deployment

This section provides the commands to deploy the smart contracts to both the source and destination chains. You can choose between step-by-step deployment or the automated one-click method.

### 5.4.1 Source Chain Deployment (Ethereum Sepolia)

Deploy the core ecosystem on the source chain:

~~~shell
# 1. Deploy the Platform Token and Sale contract
npx hardhat deploy --network sepolia --tags PlatformToken
npx hardhat deploy --network sepolia --tags TokenSale

# 2. Fund the TokenSale contract
# Since minted tokens are initially sent to the deployer's EOA, 
# you must transfer a portion to the TokenSale contract to enable purchases.
npx hardhat run scripts/2.TransferPlatformTokenToTokenSale.js --network sepolia

# 3. Deploy Game and NFT contracts
npx hardhat deploy --network sepolia --tags PianoGuessGame
npx hardhat deploy --network sepolia --tags NFTCollectible
npx hardhat deploy --network sepolia --tags NFTBridgeSender

# 4. Grant necessary permissions
# Allow the game contract to mint NFTs
npx hardhat deploy --network sepolia --tags GrantMinterForPianoGuessGame
# Allow the bridge sender to burn NFTs for cross-chain transfers
npx hardhat deploy --network sepolia --tags GrantBurnerForNFTBridgeSender

# Optional: Local deployment simulator
npx hardhat deploy --network localhost --tags CCIPSimulator
~~~

### 5.4.2 Target Chain Deployment (Polygon Amoy)

Deploy the mirrored ecosystem on the destination chain:

~~~shell
# 1. Deploy Wrapped NFT and Bridge Receiver
npx hardhat deploy --network polygonAmoy --tags WrappedNFT
npx hardhat deploy --network polygonAmoy --tags NFTBridgeReceiver

# 2. Grant permissions and configure security
# Allow the receiver contract to mint Wrapped NFTs
npx hardhat deploy --network polygonAmoy --tags GrantMinterForNFTBridgeReceiver
# Authorize the receiver to accept messages from the specific source sender
npx hardhat deploy --network polygonAmoy --tags SetTrustedSenderForNFTBridgeSender
~~~

### 5.4.3 Automated One-Click Deployment

If you wish to skip the manual steps above, use these bundled tags to handle deployment, initialization, and permission granting in one go:

~~~shell
npx hardhat deploy --network sepolia --tags sourceChain
npx hardhat deploy --network polygonAmoy --tags destChain
~~~

###	💡 Deployment Troubleshooting & Maintenance

**Redeploying Contracts**: If you need to ignore local caches and redeploy, use one of these methods:

- **Option 1**: Add the `--reset` flag (e.g., `npx hardhat deploy --network sepolia --tags PlatformToken --reset`). *Note: This redeploys all contracts on that network.*
- **Option 2**: Manually delete files in `deployments/{network}` or specific `{ContractName}.json` files.

**Updating NFT Market**: If the website shows "No NFT" after a user achieves 3 wins, execute the following script to populate the market metadata:

~~~shell
npx hardhat run scripts/3.2.AddNFTUri.js --network sepolia
~~~

### 🔄 Customizing Chain Configurations

You can swap the Source or Destination chains based on your preference (e.g., switching to Arbitrum Sepolia or Optimism). If you choose to change the networks, you **must** update the following configuration files to ensure the cross-chain logic and deployment scripts function correctly:

1. **`hardhat.config.js`**
   - Add the new chain details under the `networks` object.
   - Provide the **RPC URL** (e.g., from Alchemy or Infura) and the corresponding **Chain ID**.
   - Ensure your accounts/private keys are properly mapped to the new network.
2. **`helper-hardhat-config.js`**
   - **networkConfig:** Update this mapping with the new `chainId` and its specific parameters.
   - **Cross-Chain Parameters:** The application utilizes cross-chain protocols Chainlink CCIP, you must update the **Endpoint Address** or **Router Address** specific to the new chain.

> **Pro Tip:** After modifying the configurations, always use the specific network flag.

### 5.5 Frontend Launch & Configuration

Once the smart contracts are successfully deployed and initialized, follow these steps to launch the user interface.

### 5.5.1 Environment Configuration

Navigate to the `frontend-dapp` directory and create/update the `.env` file with your specific contract addresses generated during the deployment phase.

~~~shell
cd frontend 

touch .env
~~~

Add the following variables to your `frontend-dapp/.env`:

~~~.env
# .env file for React App
# Copy this file to .env in the same directory and modify the values as needed

###### Source Chain Config For Ethereum Sepolia ######
# PlatformToken Addr
REACT_APP_PLATFORMTOKEN_ADDRESS=0x7E074C6207D4EC9a14A4a01906184E399758122A
# TokenSale Addr
REACT_APP_TOKENSALE_ADDRESS=0x9516dB70F518e8dade65cCb19499AC6813dB29C7
# NFTCollectible Addr
REACT_APP_NFTCOLLECTIBLE_ADDRESS=0xd6577caA8EA77b04462089405142d0dB016D51AB
# PianoGuessGame Addr
REACT_APP_PIANOGUESSGAME_ADDRESS=0x10f8B471324E6d568ED5b02667E9eb85c42c5025
# NFTBridgeSender Addr
REACT_APP_NFTBRIDGESENDER_ADDRESS=0xaE9EBD77157bE57129313476C37Da43d6F712Ee2
# LinkTokenAddress Addr e.g (Ethereum Sepolia) 
REACT_APP_LINKTOKENADDRESS=0x779877A7B0D9E8603169DdbD7836e478b4624789

###### Target Chain Config For Polygan Amoy ######
# Target WrappedNFT Addr
REACT_APP_RECEIVER_WRAPPEDNFT_ADDRESS=
# Target NFTBridgeReceiver Addr
REACT_APP_NFTBRIDGERECEIVER_ADDRESS=
# Target CHAIN_SELECTOR e.g (Polygon Amoy)
REACT_APP_TARGET_CHAIN_SELECTOR=16281711391670634445
~~~

### 5.5.2 Starting the Application

Install the frontend-specific dependencies and launch the development server.

~~~
# Ensure you are in the /frontend-dapp directory
npm install

# Start the React development server
npm start
~~~

**Note:** If the market displays no NFTs after winning, run: `npx hardhat run scripts/3.2.AddNFTUri.js --network sepolia`.

# 🛠️ 6. System Access & Troubleshooting

## 6.1 Accessing the DApp

Once the server is running, you can access the interface at:

- **Local Environment**: [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000)
- **Production**: [Your Vercel Link]

**Note:** If the market displays no NFTs after winning, run: 

~~~shell
npx hardhat run scripts/3.2.AddNFTUri.js --network sepolia
~~~

## 6.2 Critical Note on Wallet Connection

If you switch between different Source and Destination networks (e.g., moving from local testnets to different chain configurations), you **must** clear your browser's wallet permissions to avoid transaction errors or RPC synchronization issues:

- **Action Required**: In MetaMask, go to **Settings** > **Experimental** > **All permissions** (or via the "Connected Sites" menu) and **remove/disconnect** `http://localhost:3000` or your remote DApp URL.
- **Reason**: This ensures a clean state for the new network environment and prevents "Nonce" or "Chain ID" mismatch errors.

# 🎁 7. Acknowledgments & Credits

I would like to express my deepest gratitude to the following communities and individuals who made this project possible:

- **The Web3 Community**: For the continuous inspiration and shared knowledge that drives the evolution of decentralized gaming.
- **Hardhat Team**: For the exceptional development environment that streamlined the deployment and testing process.
- **Alchemy & Infura**: For providing reliable RPC node services across the Sepolia and Amoy testnets.
- **Pinata:** For providing the robust **IPFS (InterPlanetary File System)** gateway and pinning services that ensure our decentralized assets and metadata remain permanently accessible and immutable.
- **OpenZeppelin**: For their industry-standard smart contract libraries (ERC20, ERC721) which ensured a secure foundation for the Lite version.
- **Chainlink Community**: For providing the robust **CCIP** infrastructure that enables secure cross-chain NFT interoperability.
- **Cyfrin Updraft**: For providing world-class Web3 security education and patterns that deeply influenced the security roadmap of this project.

### 🌸 Special Thanks

- **Inspiration & Artistry**: Special thanks to **my wife**, a professional piano performer, who provided the core inspiration for this project's design and conceptual framework.
- **Musical Contributions**: Heartfelt thanks to **her students**, who dedicated their time and talent to record the piano performances used in the "Play" section of this application.

# 📧 8. Contact & Support

If you have any questions, suggestions, or would like to collaborate, feel free to reach out through the following channels:

- **GitHub**: https://github.com/0xarthurlabs/block-chain_piano_lite
- **Email**: 0xarthurlabs@gmail.com

> **Note**: For technical issues or bug reports, please open an **Issue** directly in this repository.

<p align="center">
  <a href="https://www.gnu.org/licenses/gpl-3.0.txt">
    <img src="https://gateway.pinata.cloud/ipfs/bafkreianevlnlofslyrkm3pbcmbisybjkxxvnxrrc3wli3eepgiyhleogu" alt="license">
  </a>
    <a href="https://github.com/0xarthurlabs/block-chain_piano_lite">
    <img src="https://gateway.pinata.cloud/ipfs/bafkreiaagmn5nhsva3wq6faeq6mzgwbqyh34iooydd7rqibnzsplv4gqim" alt="codebase">
  </a>
</p>
