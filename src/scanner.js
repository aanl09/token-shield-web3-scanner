import { CHAINS } from './config.js';

const ZERO = '0x0000000000000000000000000000000000000000';
const DEAD = '0x000000000000000000000000000000000000dead';

export function isAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test((value || '').trim());
}

export async function rpc(chainId, method, params = []) {
  const chain = CHAINS[chainId];
  const res = await fetch(chain.rpc, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params })
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || 'RPC error');
  return json.result;
}

function selector(signature) {
  const map = {
    'name()': '0x06fdde03',
    'symbol()': '0x95d89b41',
    'decimals()': '0x313ce567',
    'totalSupply()': '0x18160ddd',
    'owner()': '0x8da5cb5b',
    'getOwner()': '0x893d20e8',
    'balanceOf(address)': '0x70a08231'
  };
  return map[signature];
}

function padAddress(addr) {
  return addr.toLowerCase().replace('0x', '').padStart(64, '0');
}

function decodeString(hex) {
  if (!hex || hex === '0x') return null;
  try {
    const clean = hex.slice(2);
    if (clean.length === 64) {
      const bytes = clean.match(/.{1,2}/g).map(x => parseInt(x, 16)).filter(Boolean);
      return new TextDecoder().decode(new Uint8Array(bytes)).replace(/\0/g, '').trim();
    }
    const offset = parseInt(clean.slice(0, 64), 16) * 2;
    const len = parseInt(clean.slice(offset, offset + 64), 16) * 2;
    const data = clean.slice(offset + 64, offset + 64 + len);
    const bytes = data.match(/.{1,2}/g)?.map(x => parseInt(x, 16)) || [];
    return new TextDecoder().decode(new Uint8Array(bytes)).replace(/\0/g, '').trim();
  } catch {
    return null;
  }
}

function decodeUint(hex) {
  if (!hex || hex === '0x') return null;
  try { return BigInt(hex); } catch { return null; }
}

function decodeAddress(hex) {
  if (!hex || hex === '0x') return null;
  return '0x' + hex.slice(-40);
}

export async function ethCall(chainId, to, data) {
  return await rpc(chainId, 'eth_call', [{ to, data }, 'latest']);
}

export async function getOnchainBasics(chainId, token, wallet) {
  const code = await rpc(chainId, 'eth_getCode', [token, 'latest']);
  const out = { codeExists: code && code !== '0x', codeSize: code?.length || 0 };
  if (!out.codeExists) return out;

  const safe = async (name, data, decode) => {
    try { out[name] = decode(await ethCall(chainId, token, data)); }
    catch { out[name] = null; }
  };

  await Promise.all([
    safe('name', selector('name()'), decodeString),
    safe('symbol', selector('symbol()'), decodeString),
    safe('decimals', selector('decimals()'), v => Number(decodeUint(v) ?? 0n)),
    safe('totalSupplyRaw', selector('totalSupply()'), decodeUint),
    safe('owner', selector('owner()'), decodeAddress),
    safe('getOwner', selector('getOwner()'), decodeAddress)
  ]);

  out.owner = out.owner || out.getOwner || null;
  out.renounced = out.owner && [ZERO, DEAD].includes(out.owner.toLowerCase());

  if (wallet && isAddress(wallet)) {
    await safe('walletBalanceRaw', selector('balanceOf(address)') + padAddress(wallet), decodeUint);
  }

  return out;
}

export async function getGoPlus(chainId, token) {
  const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${token}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GoPlus ${res.status}`);
  const json = await res.json();
  const item = json?.result?.[token.toLowerCase()] || json?.result?.[token] || null;
  return item;
}

export async function getDex(chainId, token) {
  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`);
  if (!res.ok) throw new Error(`DexScreener ${res.status}`);
  const json = await res.json();
  const pairs = (json.pairs || []).filter(p => {
    const id = String(p.chainId).toLowerCase();
    return Number(p.chainId) === Number(chainId) || id === CHAINS[chainId].short || id === CHAINS[chainId].dexId;
  });
  const sorted = pairs.sort((a, b) => Number(b.liquidity?.usd || 0) - Number(a.liquidity?.usd || 0));
  return { pairs: sorted, best: sorted[0] || null };
}

export function compactNumber(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '-';
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(Number(n));
}

export function formatPercent(v) {
  if (v === null || v === undefined || v === '') return '-';
  return `${Number(v).toFixed(2)}%`;
}
