export const CHAINS = {
  1: { name: 'Ethereum', short: 'eth', dexId: 'ethereum', rpc: 'https://ethereum.publicnode.com', explorer: 'https://etherscan.io' },
  56: { name: 'BNB Chain', short: 'bsc', dexId: 'bsc', rpc: 'https://bsc-dataseed.binance.org', explorer: 'https://bscscan.com' },
  8453: { name: 'Base', short: 'base', dexId: 'base', rpc: 'https://mainnet.base.org', explorer: 'https://basescan.org' },
  137: { name: 'Polygon', short: 'polygon', dexId: 'polygon', rpc: 'https://polygon-bor-rpc.publicnode.com', explorer: 'https://polygonscan.com' },
  42161: { name: 'Arbitrum', short: 'arbitrum', dexId: 'arbitrum', rpc: 'https://arb1.arbitrum.io/rpc', explorer: 'https://arbiscan.io' },
  10: { name: 'Optimism', short: 'optimism', dexId: 'optimism', rpc: 'https://mainnet.optimism.io', explorer: 'https://optimistic.etherscan.io' }
};

export const ERC20_ABI = [
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'owner', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'getOwner', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] }
];
