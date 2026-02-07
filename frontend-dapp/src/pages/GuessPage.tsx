import React, { useEffect, useState, useMemo } from 'react';
import { Contract, ethers, parseUnits, formatEther } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import PianoGuessGameABI from '../abi/PianoGuessGame.json';
import PlatformTokenABI from '../abi/PlatformToken.json';
import NFTCollectibleABI from '../abi/NFTCollectible.json';

const GAME_ADDR = process.env.REACT_APP_PIANOGUESSGAME_ADDRESS as string;
const PTK_ADDR  = process.env.REACT_APP_PLATFORMTOKEN_ADDRESS as string;
const NFT_ADDR  = process.env.REACT_APP_NFTCOLLECTIBLE_ADDRESS as string;

function ipfsToHttp(uri: string): string {
  return uri.startsWith('ipfs://')
    ? `https://gateway.pinata.cloud/ipfs/${uri.replace('ipfs://', '')}`
    : uri;
}

export default function GuessPage() {
  const { signer, account, provider } = useWallet();

  // Contract Instances
  const game  = useMemo(
    () => signer ? new Contract(GAME_ADDR, PianoGuessGameABI.abi, signer) : null,
    [signer],
  );
  const token = useMemo(
    () => signer ? new Contract(PTK_ADDR, PlatformTokenABI.abi, signer) : null,
    [signer],
  );
  const nft   = useMemo(
    () => signer ? new Contract(NFT_ADDR, NFTCollectibleABI.abi, signer) : null,
    [signer],
  );

  // local state
  const [total, setTotal]   = useState(0);
  const [idx,   setIdx]     = useState(0);
  const [audio, setAudio]   = useState('');
  const [options, setOptions]   = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [correct, setCorrect]   = useState(0);

  const [availIds,    setAvailIds]   = useState<number[]>([]);
  const [nftUris,     setNftUris]     = useState<Record<number,string>>({});
  const [chosenToken, setChosenToken] = useState<number | null>(null);

  const [platformTokenBalance, setPlatformTokenBalance] = useState<bigint>(0n);

  // 1.init total and redeemable NFT list
  useEffect(() => {
    if (!game || !nft || !account) return;

    (async () => {

      // await nft.mint("ipfs://bafkreiaqv4jzod4lyvwmy2zdd6ziqyibrjdv7falnad6ayjcs6k2ogefr4", 2);
      // Total Music Number
      const totBN = await game.totalCompositions();
      setTotal(Number(totBN));

      // available redeemable NFT id list
      const raw: bigint[] = await nft.getAvailableTokenIds();
      const ids = raw.map(n => Number(n));

      // get image column from metadata.json one by one
      const uriMap: Record<number,string> = {};
      await Promise.all(
        ids.map(async (id) => {
          try {
            // 1. tokenURI -> Metadata URI
            const metaUri: string = await nft.tokenURI(id);
            console.log("metaUri:", metaUri);
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

  // 2. load current idx when changing
  useEffect(() => {
    if (!game || total === 0 || !account) return;

    (async () => {
      // A.curren audio URL + correct performer
      const [url, performer]: [string, string] = await game.getComposition(idx);
      setAudio(ipfsToHttp(url));

      // B.build opetion list including all performer randomly
      const names: string[] = [];
      for (let i = 0; i < total; i++) {
        const [, p] = await game.getComposition(i);
        names.push(p);
      }
      setOptions(names.sort(() => 0.5 - Math.random()));
      setSelected('');

      // C. correct times
      const cntBN = await game.correctCount(account);
      setCorrect(Number(cntBN));

      // D. platform token balance
      const bal = await token!.balanceOf(account);
      setPlatformTokenBalance(bal);
    })();
  }, [game, account, idx, total]);

  // 3. submit guessing
  const handleGuess = async () => {
    if (!selected) return alert('Please choose performer name first!');
    if (!game || !token || !account) return;

    const cost = parseUnits('200', 18);
    let balance = await token.balanceOf(account);
    if (balance < cost) {
      return alert('You do not have enough PTK to guess!');
    }

    const allowance = await token.allowance(account, GAME_ADDR);
    if (allowance < cost) {
      const tx = await token.approve(GAME_ADDR, cost);
      await tx.wait();
    }

    const guessTx = await game.guess(idx, selected);
    const receipt = await guessTx.wait();

    const event = receipt.logs
        .map((log:any) => {
            try { return game.interface.parseLog(log); } catch (e) { return null; }
        })
        .find((e:any) => e && e.name === 'GuessResult');

    if (event) {
        const [user, correct, count] = event.args;
        console.log("user:", user, "correct:", correct, "count:", count);
        setCorrect(count);
        balance = await token.balanceOf(account);
        setPlatformTokenBalance(balance);
        if (Number(correct) > 0 ) {
            alert("Congratulations, you guessed right!");
        } else {
            alert("Sorry, you guessed wrong, try again!");
        }
    }
  };

  // 4. redeem NFT
  const handleRedeem = async () => {
    if (chosenToken === null || !game) return alert('Please choose the NFT you would like to redeem!');
    const tx = await game.redeemNFT(chosenToken);
    await tx.wait();
    alert(`Redeemed NFT successfully  #${chosenToken}`);
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      {/* Audio Player */}
      {audio ? <audio controls src={audio} className="w-full" /> : null}  

      {/* Guess performer name option */}
      <div className="space-y-2">
        {options.map(o => (
          <label key={o} className="block">
            <input
              type="radio"
              name="perf"
              value={o}
              checked={selected === o}
              onChange={() => setSelected(o)}
              className="mr-2"
            />
            {o}
          </label>
        ))}
      </div>

      {/* Button Area */}
      <div className="flex gap-3">
        <button
          onClick={handleGuess}
          className="flex-1 px-4 py-2 rounded bg-green-600 text-white"
        >
          Start Guess Game (Pay 200 PTK)
        </button>
        <button
          onClick={() => setIdx((idx + 1) % total)}
          className="px-4 py-2 rounded bg-yellow-500 text-white"
        >
          Next Piano Song
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Correct guesses card */}
        <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white/60">
          <div className="flex-shrink-0 p-2 rounded-md bg-yellow-50" aria-hidden>
            {/* small icon (SVG) */}
            <svg className="w-5 h-5 text-yellow-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.2"/>
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-gray-600 truncate">Number of correct guesses</div>
              {/* badge: shows green when eligible */}
              {Number(correct) >= 3 ? (
                <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                  Eligible
                </span>
              ) : (
                <span className="text-xs text-gray-400">Goal: 3</span>
              )}
            </div>

            <div className="mt-1 flex items-baseline gap-3">
              <div className="text-lg font-semibold text-gray-900">{correct}</div>
              <div className="text-sm text-gray-500">/ <span className="font-medium">3</span></div>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              You'll get eligibility to redeem a Piano Master NFT once your correct guesses reach <span className="font-semibold">3</span>.
              <span className="ml-2 text-xs text-blue-600 underline cursor-pointer" title="You need 3 correct guesses to redeem.">Learn more</span>
            </p>
          </div>
        </div>

        {/* PTK balance card */}
        <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white/60">
          <div className="flex-shrink-0 p-2 rounded-md bg-sky-50" aria-hidden>
            <svg className="w-5 h-5 text-sky-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 10h8a2 2 0 010 4H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.08"/>
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-gray-600 truncate">Current Available PTK</div>
              <div className="text-xs text-gray-500">Balance</div>
            </div>

            <div className="mt-1">
              <div className="text-lg font-semibold text-gray-900">
                {formatEther(platformTokenBalance)} <span className="text-sm font-medium text-gray-500">PTK</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NFT Redeem Area */}
      {correct >= 3 && (
        <div className="pt-4 border-t space-y-4">
          <h3 className="text-lg font-semibold">Please choose NFT you'd like to redeem</h3>
          <div className="grid grid-cols-2 gap-3">
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
                  <div className="w-full aspect-square flex items-center justify-center bg-gray-200 text-xs">
                    None cover
                  </div>
                )}
                <p className="text-center py-1 text-sm">ID {id}</p>
              </div>
            ))}
          </div>
          <button
            onClick={handleRedeem}
            className="w-full px-4 py-2 rounded bg-blue-600 text-white"
          >
            Redeem NFT
          </button>
        </div>
      )}
    </div>
  );
}
