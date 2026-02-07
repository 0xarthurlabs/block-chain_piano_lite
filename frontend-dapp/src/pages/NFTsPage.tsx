import React, { useEffect, useState, useMemo } from 'react';
import { Contract, MaxUint256 } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import NFTCollectibleABI from '../abi/NFTCollectible.json';
import CrossChainSenderABI from '../abi/NFTBridgeSender.json';
import { LinkTokenABI } from "../abi/LinkTokenABI";
import RECEIVER_ABI from "../abi/NFTBridgeReceiver.json";

const NFT_ADDR = process.env.REACT_APP_NFTCOLLECTIBLE_ADDRESS as string;
const BRIDGE_ADDR = process.env.REACT_APP_NFTBRIDGESENDER_ADDRESS as string;
const TARGET_CHAIN_SELECTOR_STR = process.env.REACT_APP_TARGET_CHAIN_SELECTOR as string;
const LINKTOKENADDRESS = process.env.REACT_APP_LINKTOKENADDRESS as string;
const RECIEVER = process.env.REACT_APP_NFTBRIDGERECEIVER_ADDRESS as string;


// convert chain selector string to bigint
const DEST_CHAIN_SELECTOR = BigInt(TARGET_CHAIN_SELECTOR_STR);

function ipfsToHttp(uri: string): string {
  return uri.startsWith('ipfs://')
    ? `https://gateway.pinata.cloud/ipfs/${uri.slice(7)}`
    : uri;
}

export default function MyNFTsPage() {
  const { signer, account } = useWallet();

  const nft = useMemo(() => {
    if (!signer) return null;
    return new Contract(NFT_ADDR, NFTCollectibleABI.abi, signer);
  }, [signer, NFT_ADDR]);

  const bridge = useMemo(() => {
    if (!signer) return null;
    return new Contract(BRIDGE_ADDR, CrossChainSenderABI.abi, signer);
  }, [signer, BRIDGE_ADDR]);

  const [ownedIds, setOwnedIds] = useState<number[]>([]);
  const [rawUris, setRawUris] = useState<Record<number, string>>({});
  const [httpUris, setHttpUris] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!nft || !account) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const balance: bigint = await nft.balanceOf(account);
        const count = Number(balance);
        const ids: number[] = [];
        const rawMap: Record<number, string> = {};
        const httpMap: Record<number, string> = {};

        for (let i = 0; i < count; i++) {
          const tokenId: bigint = await nft.tokenOfOwnerByIndex(account, i);
          const id = Number(tokenId);
          ids.push(id);

          const metaUri: string = await nft.tokenURI(id);
          console.log("metaUri:",metaUri);
          rawMap[id] = metaUri;

          try {
            const httpMeta = ipfsToHttp(metaUri);
            const res = await fetch(httpMeta);
            if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
              const meta = await res.json();
              httpMap[id] = ipfsToHttp(meta.image);
            } else if (/\.(png|jpe?g|gif)$/.test(httpMeta)) {
              httpMap[id] = httpMeta;
            }
          } catch {
            console.error(`load metadata or image failure,token ${id}`);
          }
        }

        setOwnedIds(ids);
        setRawUris(rawMap);
        setHttpUris(httpMap);
      } catch (err) {
        console.error('load held NFT error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [nft, account]);

  const handleCrossChainTransfer = async (tokenId: number) => {
    if (!bridge || !account) return;

    try {
      const uri = rawUris[tokenId];
      /*console.log({
        DEST_CHAIN_SELECTOR:DEST_CHAIN_SELECTOR,
        account:account,
        tokenId:tokenId,
        uri:uri,
        BRIDGE_ADDR:BRIDGE_ADDR,
        TARGET_CHAIN_SELECTOR_STR:TARGET_CHAIN_SELECTOR_STR
      }); */
      const linkTokenContract = new Contract(
        LINKTOKENADDRESS,
        LinkTokenABI,
        signer
      );
      /*const allowance = await linkTokenContract.allowance(
        account,
        BRIDGE_ADDR
      );
      console.log("Current approved Quote:", allowance.toString());*/
      await linkTokenContract.approve(
        BRIDGE_ADDR,
        MaxUint256
      );
      const tx = await bridge.sendNFT(
        DEST_CHAIN_SELECTOR,
        RECIEVER,
        account,
        tokenId,
        uri
      );

      const receipt = await tx.wait();
      if (!receipt) {
        console.log("The transaction has not been packed yet.");
        return;
      }
      /*const eventSig = ethers.id("NFTReceived(address,uint256,string)");
      const nftBridgeReceiver = new Contract(
        "0x723C6E91679833ee4Bc4B703e26343d27B3a8b8c",
        RECEIVER_ABI,
        signer
      );
      for (const log of receipt.logs) {
        if (log.topics[0] === eventSig) {
          const parsed = nftBridgeReceiver.interface.parseLog(log);
          console.log("Captured NFTReceived Event：", {
            to: parsed.args[0],
            tokenId: parsed.args[1].toString(),
            tokenURI: parsed.args[2],
          });
          return;
        }
      }*/
      alert(`NFT #${tokenId} sent successfully accross chain!`);
      setOwnedIds(prev => prev.filter(id => id !== tokenId));
    } catch (e: any) {
      console.error('Send NFT failure accross chain', e);
      console.error("errorName:", e.errorName);
      console.error("errorArgs:", e.errorArgs);
      console.error("full revert data:", e.data);
      alert('Send NFT failure accross chain');
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h2 className="text-xl font-semibold">NFT I hold</h2>
      {ownedIds.length === 0 ? (
        <p className="text-center text-gray-500">No NFTs currently held</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {ownedIds.map(id => (
            <div key={id} className="border rounded overflow-hidden">
              {httpUris[id] ? (
                <img
                  src={httpUris[id]}
                  alt={`NFT ${id}`}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center bg-gray-200 text-sm">
                  None Cover
                </div>
              )}
              <div className="p-2 flex justify-between items-center">
                <span>ID {id}</span>
                <button
                  onClick={() => handleCrossChainTransfer(id)}
                  className="px-2 py-1 bg-blue-600 text-white text-sm rounded"
                >
                  Send Accross Chain
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
