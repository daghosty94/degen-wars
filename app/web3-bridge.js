import {
  Connection,
  clusterApiUrl,
  PublicKey,
  Transaction,
} from '@solana/web3.js';

const NETWORK = 'devnet';
const connection = new Connection(clusterApiUrl(NETWORK), 'confirmed');

function detectWallets() {
  const wallets = [];
  const phantom = window.phantom?.solana ?? window.solana;
  if (phantom?.isPhantom) wallets.push({ name: 'Phantom', adapter: phantom });
  if (window.solflare?.isSolflare) wallets.push({ name: 'Solflare', adapter: window.solflare });
  if (window.backpack?.isBackpack) wallets.push({ name: 'Backpack', adapter: window.backpack });
  return wallets;
}

const availableWallets = detectWallets();

let _wallet = null;

async function connect(walletName) {
  const entry = (walletName ? availableWallets.find(w => w.name === walletName) : null) ?? availableWallets[0];
  if (!entry) throw new Error('No Solana wallet detected. Install Phantom or Solflare.');
  await entry.adapter.connect();
  _wallet = entry;
  return entry.adapter.publicKey;
}

async function disconnect() {
  if (_wallet) {
    await _wallet.adapter.disconnect();
    _wallet = null;
  }
}

function getPublicKey() {
  return _wallet?.adapter?.publicKey ?? null;
}

async function getBalance(pubkey) {
  const pk = pubkey ? new PublicKey(pubkey) : getPublicKey();
  if (!pk) return null;
  return connection.getBalance(pk);
}

async function sendTransaction(transaction) {
  if (!_wallet) throw new Error('Wallet not connected');
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = _wallet.adapter.publicKey;
  const signed = await _wallet.adapter.signTransaction(transaction);
  const sig = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });
  return sig;
}

export const web3 = {
  connection,
  network: NETWORK,
  availableWallets,
  connect,
  disconnect,
  getPublicKey,
  getBalance,
  sendTransaction,
  PublicKey,
  Transaction,
};
