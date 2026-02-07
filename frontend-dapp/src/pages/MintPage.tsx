import React, { useEffect, useState, useMemo } from 'react';
import { Contract } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import PianoGuessGameABI from '../abi/PianoGuessGame.json';
import NFTCollectibleABI from '../abi/NFTCollectible.json';

const GAME_ADDR = process.env.REACT_APP_PIANOGUESSGAME_ADDRESS as string;
const NFT_ADDR  = process.env.REACT_APP_NFTCOLLECTIBLE_ADDRESS as string;

function ipfsToHttp(uri: string): string {
  return uri.startsWith('ipfs://')
    ? `https://gateway.pinata.cloud/ipfs/${uri.replace('ipfs://', '')}`
    : uri;
}

export default function MintPage() {
  const { signer, account } = useWallet();

  const game = useMemo<Contract | null>(
    () => signer ? new Contract(GAME_ADDR, PianoGuessGameABI.abi, signer) : null,
    [signer]
  );
  const nft = useMemo<Contract | null>(
    () => signer ? new Contract(NFT_ADDR, NFTCollectibleABI.abi, signer) : null,
    [signer]
  );

  const [availIds, setAvailIds] = useState<number[]>([]);
  const [nftUris, setNftUris] = useState<Record<number, string>>({});
  const [chosenToken, setChosenToken] = useState<number | null>(null);

  // 1. Redeemable NFT list
    useEffect(() => {
      if (!game || !nft || !account) return;
  
      (async () => {
  
        // Redeemable NFT id list
        const raw: bigint[] = await nft.getAvailableTokenIds();
        const ids = raw.map(n => Number(n));
  
        // get image column from metadata.json one by one
        const uriMap: Record<number,string> = {};
        await Promise.all(
          ids.map(async (id) => {
            try {
              // 1. tokenURI -> Metadata URI
              const metaUri: string = await nft.tokenURI(id);
              const httpMeta = ipfsToHttp(metaUri);
  
              // 2. fetch JSON
              const res = await fetch(httpMeta);
              const meta = await res.json() as { image: string };
  
              // 3. store cover URL
              uriMap[id] = ipfsToHttp(meta.image);
            } catch (err) {
              console.error('load NFT cover error:', err);
              uriMap[id] = '';
            }
          })
        );
  
        setAvailIds(ids);
        setNftUris(uriMap);
      })();
    }, [game, nft, account]);

  const handleRedeem = async () => {
    if (chosenToken === null || !game) {
      return alert('Please choose the NFT you would like to redeem!');
    }
    try {
      const tx = await game.redeemNFT(chosenToken);
      await tx.wait();
      alert(`Redeemed NFT successfully #${chosenToken}`);
      setAvailIds(prev => prev.filter(id => id !== chosenToken));
      setChosenToken(null);
    } catch (error) {
      console.error('Redeemed failure', error);
      alert('Redeemed failure,Please confirm redemption eligibility and try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-xl font-semibold">Redeemable NFT List</h2>
      {availIds.length === 0 ? (
        <p className="text-center text-gray-500">No NFTs currently available for redemption</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {availIds.map(id => (
            <div
              key={id}
              className={`border rounded overflow-hidden cursor-pointer ${
                chosenToken === id ? 'ring-2 ring-blue-600' : ''
              }`}
              onClick={() => setChosenToken(id)}
            >
              {nftUris[id] ? (
                <img
                  src={nftUris[id]}
                  alt={`NFT ${id}`}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center bg-gray-200 text-sm">
                  None Cover
                </div>
              )}
            <p className="text-center py-1 text-sm">ID {id}</p>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={handleRedeem}
        disabled={chosenToken === null}
        className="w-full px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        Redeem NFT
      </button>
    </div>
  );
}
