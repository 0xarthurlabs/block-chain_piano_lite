import React, { useState, useEffect, useMemo } from 'react';
import { Contract, parseEther, formatEther, JsonRpcProvider } from 'ethers';
import { useWallet } from '../hooks/useWallet';

import tokenSaleArtifact from '../abi/TokenSale.json';
import platformTokenArtifact from '../abi/PlatformToken.json';

export default function BuyPage() {
  const { abi: withdrawAbi } = tokenSaleArtifact;
  const { abi: platformTokenAbi } = platformTokenArtifact;
  const { signer, account, balance: nativeBalanceStr, provider: walletProvider } = useWallet();

  const [amount, setAmount] = useState('');
  const [purchased, setPurchased] = useState<bigint>(0n);
  const [platformTokenBalance, setPlatformTokenBalance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);

  const tokenSaleContractAddress = process.env.REACT_APP_TOKENSALE_ADDRESS!;
  const platformTokenContractAddress = process.env.REACT_APP_PLATFORMTOKEN_ADDRESS!;
  console.log('📌 tokenSaleContractAddress:', tokenSaleContractAddress, 'account:', account);

  // use useMemo to make sure creating the instance only once with same provider/abi/address
  const rpcProvider = useMemo(
    () => walletProvider || new JsonRpcProvider(),
    [walletProvider]
  );

  const readContract = useMemo(
    () => new Contract(tokenSaleContractAddress, withdrawAbi, rpcProvider),
    [tokenSaleContractAddress, withdrawAbi, rpcProvider]
  );

  const writeContract = useMemo(
    () => (signer ? new Contract(tokenSaleContractAddress, withdrawAbi, signer) : null),
    [tokenSaleContractAddress, withdrawAbi, signer]
  );

  const platformTokenContract = useMemo(
    () => (signer ? new Contract(platformTokenContractAddress, platformTokenAbi, signer) : null),
    [platformTokenContractAddress, platformTokenAbi, signer]
  );

  useEffect(() => {
    if (!account) {
      setPurchased(0n);
      setPlatformTokenBalance(0n);
      return;
    }

    let cancelled = false;
    setLoading(true);

    console.log('➡️ start to call purchased getter');

    readContract
      .purchased(account)
      .then((res: bigint) => {
        console.log('✅ purchased return:', res.toString());
        if (!cancelled) setPurchased(res);
      })
      .catch((err: any) => {
        console.error('❌ load purchased failure:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    platformTokenContract!
      .balanceOf(account)
      .then((res: bigint) => {
        console.log('✅ available retuen:', res.toString());
        if (!cancelled) setPlatformTokenBalance(res);
      })
      .catch((err: any) => {
        console.error('❌ load available failure:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [account]);

  const handleBuy = async () => {
    if (!writeContract || !account) {
      alert('Please connect your wallet at first!');
      return;
    }

    let value: bigint;
    try {
      value = parseEther(amount);
    } catch {
      alert('Please input legal ETH amount such as 0.1');
      return;
    }

    const walletBal = parseEther(nativeBalanceStr);
    if (value > walletBal) {
      alert('Your balance is insufficient! Please check your wallet balance.');
      return;
    }

    try {
      const tx = await writeContract.buyTokens({ value });
      await tx.wait();
      alert('Purchased successfully!');

      // Refresh purchased amount after transaction
      setLoading(true);
      const fresh = await readContract.purchased(account);
      setPurchased(fresh);

      const freshPlatformTokenBalance = await platformTokenContract!.balanceOf(account);
      setPlatformTokenBalance(freshPlatformTokenBalance);
    } catch (err) {
      console.error('call buyTokens failure：', err);
      alert('BuyTokens failure, please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 text-center">
      <h2 className="text-xl mb-4">Purchase PTK (1 ETH = 1000 PTK)</h2>

      <div className="mb-4">
        <input
          type="text"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="ETH Amount"
          className="border px-2 py-1 mr-2"
        />
        <button onClick={handleBuy} className="px-4 py-2 bg-blue-500 text-white">
          Purchase
        </button>
      </div>

      <h3 className="text-lg">
        Current Purchased PTK:&nbsp;
        {loading ? 'Loading…' : `${formatEther(purchased)} PTK`}
      </h3>
      <h3 className="text-lg text-red-500">
        Current Available PTK:&nbsp;
        {loading ? 'Loading…' : `${formatEther(platformTokenBalance)} PTK`}
      </h3>
    </div>
  );
}
