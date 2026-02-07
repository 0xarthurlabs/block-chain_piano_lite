import React from 'react';
import { NavLink } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { Button } from './ui/button';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { account, balance, connectWallet } = useWallet();

  // navItem common styles
  const baseClass =
    'px-3 py-2 rounded transition-colors duration-200';

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow p-4 flex justify-between items-center">
        <div className="space-x-2">
          {[
            { to: '/buy', label: '1. Buy Token' },
            { to: '/guess', label: '2. Piano Guess Game' },
            { to: '/mint', label: '3. Mint NFT' },
            { to: '/nfts', label: '4. My NFTs' },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `${baseClass} ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <div>Address: {account || 'unconnected'}</div>
          <div>Balance: {balance || '0'} ETH</div>
          <Button onClick={connectWallet}>
            {account ? 'Connected' : 'Connect Wallet'}
          </Button>
        </div>
      </nav>

      <main className="p-4">{children}</main>
    </div>
  );
}