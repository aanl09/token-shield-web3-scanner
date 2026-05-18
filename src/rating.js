const SCAM_FLAGS = new Set(['1', 1, true, 'true']);
const WARNING_FLAGS = new Set(['1', 1, true, 'true']);

function yes(v) { return SCAM_FLAGS.has(v); }
function num(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }

export function rateToken({ onchain, goPlus, dex, wallet }) {
  const positives = [];
  const warnings = [];
  const critical = [];
  let score = 100;

  const add = (bucket, points, text) => { score -= points; bucket.push({ points, text }); };
  const good = (text) => positives.push(text);

  if (!onchain?.codeExists) add(critical, 100, 'Contract code tidak ditemukan di chain ini.');
  else good('Contract punya bytecode on-chain.');

  if (onchain?.name || onchain?.symbol) good(`Metadata ERC20 terbaca: ${onchain.symbol || '?'} / ${onchain.name || '?'}.`);
  else add(warnings, 8, 'Metadata ERC20 tidak lengkap; bisa proxy/non-standard atau token palsu.');

  if (goPlus) {
    if (goPlus.is_open_source === '1') good('Source code verified/open-source menurut GoPlus.');
    else add(critical, 18, 'Source code belum verified/open-source.');

    if (yes(goPlus.is_honeypot)) add(critical, 45, 'Honeypot terdeteksi: token berpotensi tidak bisa dijual.');
    if (yes(goPlus.is_blacklisted)) add(critical, 30, 'Ada blacklist risk.');
    if (yes(goPlus.cannot_sell_all)) add(critical, 28, 'Cannot-sell-all risk terdeteksi.');
    if (yes(goPlus.is_mintable)) add(warnings, 12, 'Owner/contract masih bisa mint supply baru.');
    if (yes(goPlus.hidden_owner)) add(warnings, 14, 'Hidden owner terdeteksi.');
    if (yes(goPlus.can_take_back_ownership)) add(warnings, 12, 'Ownership bisa diambil balik.');
    if (yes(goPlus.is_proxy)) add(warnings, 7, 'Proxy contract; logic bisa berubah jika admin upgrade.');
    if (yes(goPlus.external_call)) add(warnings, 7, 'Ada external call; perlu audit manual lebih lanjut.');
    if (yes(goPlus.trading_cooldown)) add(warnings, 8, 'Trading cooldown terdeteksi.');
    if (yes(goPlus.transfer_pausable)) add(warnings, 15, 'Transfer bisa dipause.');
    if (yes(goPlus.personal_slippage_modifiable)) add(warnings, 16, 'Tax/slippage personal bisa dimodifikasi.');
    if (yes(goPlus.slippage_modifiable)) add(warnings, 10, 'Tax/slippage bisa dimodifikasi.');

    const buyTax = num(goPlus.buy_tax);
    const sellTax = num(goPlus.sell_tax);
    if (buyTax !== null && buyTax > 0.1) add(warnings, 10, `Buy tax tinggi: ${(buyTax * 100).toFixed(2)}%.`);
    if (sellTax !== null && sellTax > 0.1) add(warnings, 16, `Sell tax tinggi: ${(sellTax * 100).toFixed(2)}%.`);
    if (sellTax !== null && sellTax > 0.4) add(critical, 25, `Sell tax sangat tinggi: ${(sellTax * 100).toFixed(2)}%.`);

    if (goPlus.owner_address) {
      const owner = goPlus.owner_address.toLowerCase();
      if (owner === '0x0000000000000000000000000000000000000000' || owner === '0x000000000000000000000000000000000000dead') good('Ownership terlihat renounced/dead.');
      else add(warnings, 7, `Owner masih aktif: ${goPlus.owner_address}`);
    }

    if (goPlus.holder_count && Number(goPlus.holder_count) < 100) add(warnings, 10, `Holder masih sedikit: ${goPlus.holder_count}.`);
    if (goPlus.lp_holder_count && Number(goPlus.lp_holder_count) < 3) add(warnings, 8, `LP holder sangat sedikit: ${goPlus.lp_holder_count}.`);
  } else {
    add(warnings, 15, 'Data GoPlus tidak tersedia; rating kurang lengkap.');
  }

  const liquidityUsd = Number(dex?.best?.liquidity?.usd || 0);
  const volume24h = Number(dex?.best?.volume?.h24 || 0);
  const marketCap = Number(dex?.best?.marketCap || dex?.best?.fdv || 0);

  if (liquidityUsd > 100000) good(`Liquidity sehat: $${liquidityUsd.toLocaleString()}.`);
  else if (liquidityUsd > 10000) add(warnings, 5, `Liquidity sedang: $${liquidityUsd.toLocaleString()}.`);
  else if (liquidityUsd > 0) add(warnings, 18, `Liquidity rendah: $${liquidityUsd.toLocaleString()}.`);
  else add(critical, 20, 'Tidak ada liquidity DexScreener yang jelas.');

  if (volume24h > 5000) good(`Volume 24h aktif: $${volume24h.toLocaleString()}.`);
  else if (volume24h > 0) add(warnings, 8, `Volume 24h rendah: $${volume24h.toLocaleString()}.`);

  if (wallet && onchain?.walletBalanceRaw && Number(onchain.walletBalanceRaw) > 0 && liquidityUsd < 1000) {
    add(critical, 25, 'Dusting risk: wallet punya saldo token ini tapi liquidity sangat rendah. Jangan approve/swap sembarang.');
  }

  score = Math.max(0, Math.min(100, score));
  let label = 'SAFE';
  let tone = 'emerald';
  if (score < 35 || critical.length >= 2) { label = 'SCAM / HIGH RISK'; tone = 'red'; }
  else if (score < 65 || critical.length === 1) { label = 'RISKY'; tone = 'amber'; }
  else if (score < 82) { label = 'CAUTION'; tone = 'yellow'; }

  const verified = Boolean(goPlus?.is_open_source === '1' && !yes(goPlus?.is_honeypot) && !yes(goPlus?.is_blacklisted));
  const dustingRisk = critical.some(x => x.text.toLowerCase().includes('dusting')) || (liquidityUsd < 1000 && wallet && onchain?.walletBalanceRaw);

  return { score, label, tone, verified, dustingRisk, positives, warnings, critical, metrics: { liquidityUsd, volume24h, marketCap } };
}
