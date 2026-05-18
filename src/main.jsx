import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertTriangle, CheckCircle2, Shield, Search, XCircle, Activity, Wallet, ExternalLink } from 'lucide-react';
import './index.css';
import { CHAINS } from './config.js';
import { compactNumber, getDex, getGoPlus, getOnchainBasics, isAddress } from './scanner.js';
import { rateToken } from './rating.js';

function toneClasses(tone) {
  return {
    emerald: 'from-emerald-500 to-teal-400 text-emerald-950',
    yellow: 'from-yellow-400 to-orange-300 text-yellow-950',
    amber: 'from-amber-500 to-orange-500 text-amber-950',
    red: 'from-red-500 to-rose-500 text-white'
  }[tone] || 'from-slate-500 to-slate-400 text-white';
}

function List({ title, items, icon, color }) {
  if (!items?.length) return null;
  return <div className="card rounded-3xl p-5">
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h3 className="font-bold text-lg">{title}</h3>
    </div>
    <div className="space-y-2">
      {items.map((item, i) => <div key={i} className="flex gap-2 text-sm text-slate-200">
        <span className={`mt-1 h-2 w-2 rounded-full ${color}`}></span>
        <span>{typeof item === 'string' ? item : item.text}</span>
      </div>)}
    </div>
  </div>;
}

function RatingBar({ score }) {
  return <div>
    <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
      <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-400" style={{ width: `${score}%` }} />
    </div>
    <div className="mt-2 flex justify-between text-xs text-slate-400">
      <span>0 scam</span><span>50 risky</span><span>100 safer</span>
    </div>
  </div>;
}


function FormStep({ step, title, helper, children }) {
  return <div className="rounded-3xl border border-slate-700/70 bg-slate-950/35 p-4">
    <div className="mb-3 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-teal-300 font-black text-slate-950">{step}</div>
      <div>
        <label className="block text-sm font-black text-slate-100">{title}</label>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">{helper}</p>
      </div>
    </div>
    {children}
  </div>;
}

function App() {
  const [chainId, setChainId] = useState('1');
  const [token, setToken] = useState('');
  const [wallet, setWallet] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const chain = CHAINS[chainId];

  async function scan(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    const cleanToken = token.trim();
    const cleanWallet = wallet.trim();
    if (!isAddress(cleanToken)) return setError('Masukkan contract address token EVM yang valid.');
    if (cleanWallet && !isAddress(cleanWallet)) return setError('Wallet address optional harus valid, atau kosongkan saja.');
    setLoading(true);
    try {
      const [onchain, gp, dex] = await Promise.allSettled([
        getOnchainBasics(chainId, cleanToken, cleanWallet),
        getGoPlus(chainId, cleanToken),
        getDex(chainId, cleanToken)
      ]);
      const data = {
        onchain: onchain.status === 'fulfilled' ? onchain.value : { codeExists: false, error: onchain.reason?.message },
        goPlus: gp.status === 'fulfilled' ? gp.value : null,
        dex: dex.status === 'fulfilled' ? dex.value : { pairs: [], best: null },
        errors: [onchain, gp, dex].filter(x => x.status === 'rejected').map(x => x.reason?.message || String(x.reason))
      };
      const rating = rateToken({ ...data, wallet: cleanWallet });
      setResult({ token: cleanToken, wallet: cleanWallet, chainId, chain, ...data, rating });
    } catch (err) {
      setError(err.message || 'Scan gagal.');
    } finally {
      setLoading(false);
    }
  }

  const demoTokens = useMemo(() => [
    ['Ethereum USDC', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', '1'],
    ['Ethereum PEPE', '0x6982508145454Ce325dDbE47a25d4ec3d2311933', '1'],
    ['Base BRETT', '0x532f27101965dd16442E59d40670FaF5eBB142E4', '8453']
  ], []);

  return <main className="min-h-screen px-4 py-8 md:px-8">
    <section className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-4 py-2 text-sm text-teal-200">
            <Shield size={16}/> Web3 Security Scanner
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">TokenShield</h1>
          <p className="mt-4 max-w-2xl text-slate-300">Aplikasi untuk cek token verified, scam/honeypot, liquidity risk, owner risk, dan indikasi dusting. Rating 0-100 berdasarkan data on-chain, GoPlus, dan DexScreener.</p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <a className="inline-flex items-center gap-2 rounded-2xl border border-teal-300/30 bg-teal-300/10 px-4 py-2 font-bold text-teal-200 hover:border-teal-300/70" href="https://aanl09.github.io/token-shield-web3-scanner/" target="_blank">Live demo <ExternalLink size={14}/></a>
            <a className="inline-flex items-center gap-2 rounded-2xl border border-slate-600 bg-slate-900/70 px-4 py-2 font-bold text-slate-200 hover:border-slate-400" href="https://github.com/aanl09/token-shield-web3-scanner" target="_blank">GitHub repo <ExternalLink size={14}/></a>
          </div>
        </div>
        <div className="card rounded-3xl p-4 text-sm text-slate-300">
          <div className="font-bold text-white">Rating cepat</div>
          <div>82-100 aman relatif</div>
          <div>65-81 hati-hati</div>
          <div>35-64 risky</div>
          <div>0-34 scam/high risk</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={scan} className="card rounded-3xl p-6">
          <div className="mb-5">
            <h2 className="text-2xl font-black">Form Scan Token</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">Isi dari atas ke bawah. Wallet boleh dikosongkan kalau cuma mau cek contract token.</p>
          </div>

          <div className="space-y-4">
            <FormStep step="1" title="Pilih chain" helper="Samakan network dengan token contract yang mau dicek.">
              <select className="input" value={chainId} onChange={e => setChainId(e.target.value)}>
                {Object.entries(CHAINS).map(([id, c]) => <option key={id} value={id}>{c.name}</option>)}
              </select>
            </FormStep>

            <FormStep step="2" title="Masukkan token contract" helper="Wajib pakai contract address EVM format 0x, bukan symbol token atau link website.">
              <input className="input" value={token} onChange={e => setToken(e.target.value)} placeholder="0x... token contract address" autoComplete="off" />
            </FormStep>

            <FormStep step="3" title="Wallet address untuk dusting check" helper="Opsional. Isi kalau wallet pernah menerima token asing/mencurigakan.">
              <input className="input" value={wallet} onChange={e => setWallet(e.target.value)} placeholder="0x... wallet address optional" autoComplete="off" />
            </FormStep>
          </div>

          {error && <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

          <button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-400 to-cyan-400 px-5 py-4 font-black text-slate-950 transition hover:scale-[1.01] disabled:opacity-60">
            <Search size={18}/> {loading ? 'Scanning...' : 'Scan Token'}
          </button>

          <div className="mt-6">
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Contoh token</div>
            <div className="flex flex-wrap gap-2">
              {demoTokens.map(([name, addr, cid]) => <button type="button" key={addr} onClick={() => { setToken(addr); setChainId(cid); }} className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-200 hover:border-teal-300/50">{name}</button>)}
            </div>
          </div>
        </form>

        <div className="space-y-6">
          {!result && <div className="card flex min-h-[420px] items-center justify-center rounded-3xl p-8 text-center">
            <div>
              <Shield className="mx-auto mb-4 text-teal-300" size={54}/>
              <h2 className="text-2xl font-black">Masukkan contract address untuk mulai.</h2>
              <p className="mt-3 text-slate-400">Aplikasi akan kasih score, alasan rating, dan action: aman, hati-hati, risky, atau jangan interact.</p>
            </div>
          </div>}

          {result && <>
            <div className="card rounded-3xl p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm text-slate-400">{result.chain.name}</div>
                  <h2 className="text-3xl font-black">{result.onchain.symbol || 'Unknown'} <span className="text-slate-500">/ {result.onchain.name || 'Unknown Token'}</span></h2>
                  <a className="mt-2 inline-flex items-center gap-1 text-sm text-teal-300" target="_blank" href={`${result.chain.explorer}/address/${result.token}`}>Explorer <ExternalLink size={14}/></a>
                </div>
                <div className={`rounded-3xl bg-gradient-to-br ${toneClasses(result.rating.tone)} p-5 text-center min-w-[190px]`}>
                  <div className="text-5xl font-black">{result.rating.score}</div>
                  <div className="font-black">{result.rating.label}</div>
                </div>
              </div>
              <div className="mt-6"><RatingBar score={result.rating.score}/></div>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className={`badge ${result.rating.verified ? 'bg-emerald-400 text-emerald-950' : 'bg-slate-700 text-slate-200'}`}>{result.rating.verified ? 'Verified-ish' : 'Not fully verified'}</span>
                <span className={`badge ${result.rating.dustingRisk ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-200'}`}>{result.rating.dustingRisk ? 'Dusting risk' : 'No strong dusting signal'}</span>
                <span className="badge bg-slate-700 text-slate-200">Liquidity ${compactNumber(result.rating.metrics.liquidityUsd)}</span>
                <span className="badge bg-slate-700 text-slate-200">24h Vol ${compactNumber(result.rating.metrics.volume24h)}</span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="card rounded-3xl p-5"><Activity className="mb-3 text-cyan-300"/><div className="text-sm text-slate-400">Market cap / FDV</div><div className="text-2xl font-black">${compactNumber(result.rating.metrics.marketCap)}</div></div>
              <div className="card rounded-3xl p-5"><Wallet className="mb-3 text-violet-300"/><div className="text-sm text-slate-400">Owner</div><div className="truncate text-sm font-bold">{result.onchain.owner || result.goPlus?.owner_address || '-'}</div></div>
              <div className="card rounded-3xl p-5"><Shield className="mb-3 text-emerald-300"/><div className="text-sm text-slate-400">Holder count</div><div className="text-2xl font-black">{result.goPlus?.holder_count || '-'}</div></div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <List title="Good signals" items={result.rating.positives} icon={<CheckCircle2 className="text-emerald-300"/>} color="bg-emerald-300" />
              <List title="Warning" items={result.rating.warnings} icon={<AlertTriangle className="text-amber-300"/>} color="bg-amber-300" />
              <List title="Critical" items={result.rating.critical} icon={<XCircle className="text-red-300"/>} color="bg-red-300" />
            </div>

            {result.errors?.length > 0 && <div className="card rounded-3xl p-5 text-sm text-slate-300">
              <b>API notes:</b> {result.errors.join(' | ')}
            </div>}
          </>}
        </div>
      </div>

      <section className="card mt-8 rounded-3xl p-6">
        <h2 className="text-2xl font-black">Scanner workflow</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm text-slate-300">
          <div><b className="text-white">1. Input</b><br/>Choose the network, paste the token contract, and add a wallet only if you want a dusting check.</div>
          <div><b className="text-white">2. Fetch data</b><br/>The app reads contract data, GoPlus risk flags, and DexScreener liquidity/volume in parallel.</div>
          <div><b className="text-white">3. Risk engine</b><br/>The score starts at 100. Clear risk signals such as honeypot behavior, blocked selling, high taxes, owner control, thin liquidity, or dusting exposure reduce it.</div>
          <div><b className="text-white">4. Output</b><br/>The result shows a 0-100 score, a risk label, key badges, warnings, critical issues, and an explorer link.</div>
        </div>
      </section>

      <section className="card mt-6 rounded-3xl p-6">
        <h2 className="text-2xl font-black">How the scanner judges a token</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm text-slate-300">
          <div><b className="text-white">Verified</b><br/>Open source or verified code, valid token metadata, no honeypot signal, and clear or renounced ownership.</div>
          <div><b className="text-white">Scam risk</b><br/>Honeypot behavior, blacklist logic, blocked selling, high taxes, or owner functions that can mint, pause, or change fees.</div>
          <div><b className="text-white">Market risk</b><br/>Low liquidity, weak volume, few holders, or concentrated LP ownership.</div>
          <div><b className="text-white">Dusting risk</b><br/>A wallet holds an unknown low-liquidity token or a token with dangerous permissions. Do not approve it or connect to any site linked from it.</div>
        </div>
      </section>
    </section>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
