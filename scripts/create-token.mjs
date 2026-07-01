/**
 * create-token.mjs
 * Run once to create the $DGW mint on Solana devnet.
 * Usage: node scripts/create-token.mjs
 *
 * Costs ~0.016 SOL. Airdrop first if needed:
 *   solana airdrop 2
 */

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  createMetadataAccountV3,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  createSignerFromKeypair,
  signerIdentity,
  publicKey as umiPublicKey,
  none,
} from '@metaplex-foundation/umi';

import {
  Connection,
  Keypair,
  clusterApiUrl,
} from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// ── Token config ──────────────────────────────────────────────────────────────
const TOKEN_NAME   = 'Degen Wars';
const TOKEN_SYMBOL = 'DGW';
const DECIMALS     = 6;
const TOTAL_SUPPLY = 1_000_000_000n;
const RAW_SUPPLY   = TOTAL_SUPPLY * 10n ** BigInt(DECIMALS);
// Paste your Arweave/IPFS metadata JSON URI here when ready:
const METADATA_URI = '';

const RPC = clusterApiUrl('devnet');
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Load keypair
  const keypairPath = join(homedir(), '.config', 'solana', 'id.json');
  const secretKey   = new Uint8Array(JSON.parse(readFileSync(keypairPath, 'utf8')));
  const payer       = Keypair.fromSecretKey(secretKey);
  const connection  = new Connection(RPC, 'confirmed');

  const balance = await connection.getBalance(payer.publicKey);
  console.log('\n=== $DGW Token Creator ===');
  console.log('Wallet  :', payer.publicKey.toBase58());
  console.log('Balance :', (balance / 1e9).toFixed(4), 'SOL');
  console.log('Network : devnet\n');

  if (balance < 8_000_000) {
    console.error('❌ Balance too low. Go to https://faucet.solana.com and airdrop to:');
    console.error('  ', payer.publicKey.toBase58());
    process.exit(1);
  }

  // 2. Create the SPL Token mint (classic Token program)
  //    If a checkpoint exists from a previous partial run, reuse that mint.
  const CHECKPOINT = './.token-checkpoint.json';
  let mintKeypair, mintAddress;

  if (existsSync(CHECKPOINT)) {
    const saved = JSON.parse(readFileSync(CHECKPOINT, 'utf8'));
    mintAddress = new (await import('@solana/web3.js')).PublicKey(saved.mintAddress);
    mintKeypair = Keypair.fromSecretKey(new Uint8Array(saved.mintSecretKey));
    console.log('Step 1/3 — Resuming from checkpoint, mint:', mintAddress.toBase58());
  } else {
    console.log('Step 1/3 — Creating mint...');
    mintKeypair = Keypair.generate();
    mintAddress = await createMint(
      connection,
      payer,
      payer.publicKey,
      payer.publicKey,
      DECIMALS,
      mintKeypair,
      { commitment: 'confirmed' },
      TOKEN_PROGRAM_ID,
    );
    writeFileSync(CHECKPOINT, JSON.stringify({
      mintAddress:   mintAddress.toBase58(),
      mintSecretKey: Array.from(mintKeypair.secretKey),
    }));
    console.log('  ✓ Mint:', mintAddress.toBase58());
  }

  // 3. Attach Metaplex metadata using createMetadataAccountV3
  //    (UMI is only used here — it does NOT touch the mint account)
  console.log('\nStep 2/3 — Attaching on-chain metadata...');
  const umi = createUmi(RPC).use(mplTokenMetadata());
  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  const umiSigner  = createSignerFromKeypair(umi, umiKeypair);
  umi.use(signerIdentity(umiSigner));

  await createMetadataAccountV3(umi, {
    mint:            umiPublicKey(mintAddress.toBase58()),
    mintAuthority:   umiSigner,
    payer:           umiSigner,
    updateAuthority: umiSigner.publicKey,
    data: {
      name:                 TOKEN_NAME,
      symbol:               TOKEN_SYMBOL,
      uri:                  METADATA_URI,
      sellerFeeBasisPoints: 0,
      creators:             none(),
      collection:           none(),
      uses:                 none(),
    },
    isMutable:         true,
    collectionDetails: none(),
  }).sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } });
  console.log('  ✓ Metadata attached (name: "Degen Wars", symbol: "DGW")');

  // 4. Create treasury ATA and mint full supply
  console.log('\nStep 3/3 — Minting 1,000,000,000 DGW to treasury...');
  const treasuryAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mintAddress,
    payer.publicKey,
    false,
    'confirmed',
    { commitment: 'confirmed' },
    TOKEN_PROGRAM_ID,
  );

  await mintTo(
    connection,
    payer,
    mintAddress,
    treasuryAta.address,
    payer,
    RAW_SUPPLY,
    [],
    { commitment: 'confirmed' },
    TOKEN_PROGRAM_ID,
  );
  console.log('  ✓ Supply minted to:', treasuryAta.address.toBase58());

  // 5. Write token-config.json for use by the game + Anchor program
  const config = {
    mintAddress:    mintAddress.toBase58(),
    treasuryWallet: payer.publicKey.toBase58(),
    treasuryAta:    treasuryAta.address.toBase58(),
    network:        'devnet',
    name:           TOKEN_NAME,
    symbol:         TOKEN_SYMBOL,
    decimals:       DECIMALS,
    totalSupply:    TOTAL_SUPPLY.toString(),
    createdAt:      new Date().toISOString(),
  };
  writeFileSync('./token-config.json', JSON.stringify(config, null, 2));
  if (existsSync(CHECKPOINT)) { (await import('fs')).unlinkSync(CHECKPOINT); }

  console.log('\n✅ Done!');
  console.log('Mint address :', mintAddress.toBase58());
  console.log('Config saved → token-config.json\n');
  console.log('View on Solana Explorer:');
  console.log(`  https://explorer.solana.com/address/${mintAddress.toBase58()}?cluster=devnet`);
  console.log('\nNext steps:');
  console.log('  1. Upload a logo + metadata JSON to Arweave/IPFS');
  console.log('     then run: node scripts/update-metadata.mjs');
  console.log('  2. Transfer rewards-pool tokens to the Anchor program PDA');
  console.log('  3. Revoke mint authority when supply is final (irreversible!)');
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message ?? err);
  process.exit(1);
});
