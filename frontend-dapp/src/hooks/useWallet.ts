import { useState, useEffect } from 'react'; 
import { BrowserProvider, type Signer, formatEther } from 'ethers';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

export function useWallet() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [account, setAccount] = useState<string>('');
  const [balance, setBalance] = useState<string>('');

  // 1. Initialize provider and try to restore connected account automatically
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const p = new BrowserProvider(window.ethereum);
      setProvider(p);

      // Attempt to read already authorized accounts
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then(async (res) => {
          const accounts = res as string[];
          if (accounts.length > 0) {
            // Same logic as connectWallet
            const s = await p.getSigner();
            const addr = await s.getAddress();
            const balBn = await p.getBalance(addr);
            setSigner(s);
            setAccount(addr);
            setBalance(formatEther(balBn));
          }
        })
        .catch((err) => console.error('Failed to check authorized accounts:', err));
    } else {
      console.error('Please install MetaMask!');
    }
  }, []);

  // 2. User manually invokes: connect wallet
  const connectWallet = async () => {
    if (!provider || !window.ethereum) return;
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const s = await provider.getSigner();
      const addr = await s.getAddress();
      const balBn = await provider.getBalance(addr);
      setSigner(s);
      setAccount(addr);
      setBalance(formatEther(balBn));
    } catch (err) {
      console.error('connectWallet error:', err);
    }
  };

  // 3. Listen for account changes
  useEffect(() => {
    const handleAccountsChanged = async (accounts: any) => {
      if (accounts.length > 0 && provider) {
        const s = await provider.getSigner();
        const addr = await s.getAddress();
        const balBn = await provider.getBalance(addr);
        setSigner(s);
        setAccount(addr);
        setBalance(formatEther(balBn));
      } else {
        // User has disconnected all accounts
        setSigner(null);
        setAccount('');
        setBalance('');
      }
    };

    window.ethereum?.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [provider]);

  return { provider, signer, account, balance, connectWallet };
}
