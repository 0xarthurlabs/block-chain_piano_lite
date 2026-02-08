// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title NFTCollectible
 * @dev Can Mint Pinata Managed NFT，metadata URI can be managed by owner
 */

/**
 * @title NFTCollectible
 * @dev Can Mint Pinata Managed NFT，metadata URI can be managed by owner
 */
contract NFTCollectible is ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl {
    // Define roles
    bytes32 public constant URI_ROLE    = keccak256("URI_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    // tokenId => metadata URI
    mapping(uint256 => string) private _tokenURIs;
    // available tokenId list
    uint256[] public availableTokenIds;

    // mapping for token has been minted or not
    mapping(uint256 => bool) private _minted;

    event TokenURIAdded(uint256 indexed tokenId, string uri);
    event TokenMinted(address indexed to, uint256 indexed tokenId);

    constructor(string memory name, string memory symbol) 
        ERC721(name, symbol) {
        // Grant deployer Default Admin and URI roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(URI_ROLE, msg.sender);
    }

    /**
     * @notice Admin can grant URI_ROLE to manage metadata
     */
    function grantURI(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(URI_ROLE, account);
    }

    /**
     * @notice Admin can revoke URI_ROLE
     */
    function revokeURI(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(URI_ROLE, account);
    }

    /**
     * @notice DEFAULT_ADMIN_ROLE add available NFT metadata URI
     */
    function addTokenURI(uint256 tokenId, string calldata uri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        //require(!_exists(tokenId), "Token already exists");
        _setTokenURI(tokenId, uri);
        _tokenURIs[tokenId] = uri;
        availableTokenIds.push(tokenId);
        emit TokenURIAdded(tokenId, uri);
    }

    /**
     * @notice Grant MINTER_ROLE to an address (only admin)
     */
    function grantMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, minter);
    }

    /**
     * @notice Revoke MINTER_ROLE from an address (only admin)
     */
    function revokeMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(MINTER_ROLE, minter);
    }

    /**
     * @notice Grant BURNER_ROLE to an address (only admin)
     */
    function grantBurner(address burner) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(BURNER_ROLE, burner);
    }

    /**
     * @notice Revoke BURNER_ROLE from an address (only admin)
     */
    function revokeBurner(address burner) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(BURNER_ROLE, burner);
    }

    /**
     * @notice MINTER_ROLE mint speciafic tokenId to user
     */
    function mint(address to, uint256 tokenId) external onlyRole(MINTER_ROLE) {
        require(!_minted[tokenId], "Already minted");
        _minted[tokenId] = true;
        require(bytes(_tokenURIs[tokenId]).length > 0, "URI not set");
        _safeMint(to, tokenId);
        _removeAvailable(tokenId);
        emit TokenMinted(to, tokenId);
    }

    /**
     * @dev return all available reedeem NFT list
     */
    function getAvailableTokenIds() external view returns (uint256[] memory) {
        return availableTokenIds;
    }

    /**
     * @dev remove minted tokenid from availableTokenIds
     */
    function _removeAvailable(uint256 tokenId) internal {
        uint256 len = availableTokenIds.length;
        for (uint256 i = 0; i < len; i++) {
            if (availableTokenIds[i] == tokenId) {
                availableTokenIds[i] = availableTokenIds[len - 1];
                availableTokenIds.pop();
                break;
            }
        }
    }

    // The following functions are overrides required by Solidity.

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        string memory uri = _tokenURIs[tokenId];
        //require(bytes(uri).length > 0, "URI not set for token");
        if (bytes(uri).length > 0) {
            return uri;
        }
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice allow MINTER_ROLE to burn a token
     */
    function burn(uint256 tokenId) external onlyRole(BURNER_ROLE) {
        _setTokenURI(tokenId, "ipfs://bafkreibvbpeoybq63gk5x7kmificmqek6ijg2pjfgm4jw4dg4ap4fzaccq");
        // clean custom mapping if present
        if (bytes(_tokenURIs[tokenId]).length != 0) {
            delete _tokenURIs[tokenId];
        }
        // call parent _burn which in turn will clear ERC721URIStorage's internal URI mapping
        super._burn(tokenId);

        // mark minted mapping false so tokenId can be reused if desired
        if (_minted[tokenId]) {
            _minted[tokenId] = false;
        }
    }

}