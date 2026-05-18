# TokenShield

TokenShield is a Web3 token security scanner for EVM networks. It checks whether a token contract looks verified, tradable, liquid, and safe to interact with, then gives the token a risk score from 0 to 100.

## Links

- Live demo: https://aanl09.github.io/token-shield-web3-scanner/
- GitHub repo: https://github.com/aanl09/token-shield-web3-scanner

## What it checks

- Contract bytecode exists on the selected chain
- ERC-20 metadata: name, symbol, decimals, total supply
- Source verification and open-source status
- Honeypot indicators
- Blacklist and cannot-sell risk
- Mint permissions and supply-control risk
- Owner, hidden owner, and ownership recovery risk
- Proxy and upgradeability risk
- Pausable transfers
- Buy and sell tax
- Liquidity and 24h volume from DexScreener
- Holder count and LP holder concentration
- Dusting risk when a wallet address is provided

## Supported networks

- Ethereum
- BNB Chain
- Base
- Polygon
- Arbitrum
- Optimism

## Rating model

The scanner starts each token at 100 points. Risk signals subtract points. The final score maps to one of four labels:

- 82-100: Safe relative to available data
- 65-81: Caution
- 35-64: Risky
- 0-34: Scam or high risk

Main penalties:

- No contract bytecode: -100
- Honeypot detected: -45
- Blacklist risk: -30
- Cannot sell all: -28
- No clear liquidity: -20
- Source not verified or not open-source: -18
- Transfer can be paused: -15
- Hidden owner: -14
- Mintable supply: -12
- Modifiable tax or slippage: -10 to -16
- Low liquidity: -18
- Wallet holds a low-liquidity unknown token: -25 dusting risk

## Scanner flow

1. Choose the network the token lives on.
2. Paste the token contract address. Do not use a symbol, website URL, or pair address.
3. Add a wallet address only if you want to check whether that wallet is exposed to dusting risk.
4. The app checks that the contract exists and reads basic ERC-20 data from public RPC endpoints.
5. It pulls security flags from GoPlus, including honeypot, blacklist, sell restrictions, tax, mint, pause, owner, and proxy signals.
6. It pulls market data from DexScreener, including liquidity, volume, market cap, and pair activity.
7. The rating engine starts at 100 and subtracts points for real risk signals. Hard blockers such as no bytecode or honeypot behavior carry the largest penalties.
8. The final view shows the score, risk label, useful badges, positive signals, warnings, critical issues, and an explorer link.

## How it works

TokenShield is a screening tool, not a trading bot and not a full audit. It combines three views of the same token:

- Contract view: does the token contract exist, and does it expose normal ERC-20 metadata?
- Security view: does the token show behavior commonly used in scams, such as honeypot logic, blacklist control, blocked selling, mint power, pausable transfers, hidden ownership, or tax changes?
- Market view: is there enough liquidity and volume for the token to be tradeable, or does it look like a thin, inactive pair?

The score is intentionally strict. A token can have a good market chart and still score poorly if the contract has dangerous permissions. A token can also be technically clean but still get marked down if liquidity is too low. The goal is to catch problems before a wallet approves, swaps, or interacts with the contract.

## Dusting safety rule

If a wallet receives an unknown token, do not approve it, swap it, or connect to a website linked from that token. Scan the contract first. A low-liquidity token with suspicious permissions should be treated as hostile.

## Local setup

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Notes

This tool is a screening layer. It does not replace a manual audit. Treat the score as a fast risk filter before approving, swapping, or interacting with a token contract.
