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

1. Select the chain.
2. Paste the token contract address.
3. Optionally paste a wallet address to check dusting exposure.
4. The app reads on-chain contract data through public RPC endpoints.
5. It pulls security signals from GoPlus.
6. It pulls market and liquidity data from DexScreener.
7. The rating engine returns a score, label, positive signals, warnings, and critical risks.

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
