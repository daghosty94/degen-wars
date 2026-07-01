import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
// Path goes up two levels: app/src -> app -> project root -> target/idl/
import idl from "../../target/idl/degen_wars.json";

const PROGRAM_ID = new PublicKey("EQF1du9v8t1pEpTFESz7NFerCcbMQE8RvDgqAtpssLLs");
// For devnet/localnet learning only — do not store real keypairs in localStorage
const PLAYER_KEY = "degen_wars_player_keypair";

interface PlayerAccount {
  owner: PublicKey;
  level: BN;
  experience: BN;
}

function loadOrCreatePlayerKeypair(): Keypair {
  const stored = localStorage.getItem(PLAYER_KEY);
  if (stored) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(stored)));
  }
  const kp = Keypair.generate();
  localStorage.setItem(PLAYER_KEY, JSON.stringify(Array.from(kp.secretKey)));
  return kp;
}

export default function PlayerStats() {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const [player, setPlayer] = useState<PlayerAccount | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProgram = useCallback(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;
    const provider = new AnchorProvider(
      connection,
      { publicKey, signTransaction, signAllTransactions },
      { commitment: "confirmed" }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Program(idl as any, provider);
  }, [publicKey, connection, signTransaction, signAllTransactions]);

  const fetchPlayer = useCallback(async () => {
    const program = getProgram();
    if (!program) return;
    const playerKp = loadOrCreatePlayerKeypair();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const account = await (program.account as any).player.fetch(playerKp.publicKey);
      setPlayer(account as PlayerAccount);
      setInitialized(true);
    } catch {
      setInitialized(false);
      setPlayer(null);
    }
  }, [getProgram]);

  useEffect(() => {
    if (publicKey) fetchPlayer();
  }, [publicKey, fetchPlayer]);

  const handleInitialize = async () => {
    const program = getProgram();
    if (!program || !publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const playerKp = loadOrCreatePlayerKeypair();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (program.methods as any).initializePlayer()
        .accounts({ player: playerKp.publicKey, authority: publicKey })
        .signers([playerKp])
        .rpc();
      await fetchPlayer();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", maxWidth: 480, margin: "0 auto" }}>
      <h1>Degen Wars</h1>
      <WalletMultiButton />

      {!publicKey && (
        <p style={{ marginTop: "1rem", color: "#888" }}>Connect your wallet to view player stats.</p>
      )}

      {publicKey && !initialized && (
        <div style={{ marginTop: "1.5rem" }}>
          <p>No player account found for this wallet.</p>
          <button onClick={handleInitialize} disabled={loading} style={{ padding: "0.5rem 1rem" }}>
            {loading ? "Initializing..." : "Initialize Player"}
          </button>
        </div>
      )}

      {player && (
        <div style={{
          marginTop: "1.5rem",
          border: "1px solid #555",
          padding: "1.25rem",
          borderRadius: 8,
          background: "#111"
        }}>
          <h2 style={{ margin: "0 0 0.75rem" }}>Player Stats</h2>
          <p style={{ margin: "0.25rem 0" }}>
            <strong>Level:</strong> {player.level.toString()}
          </p>
          <p style={{ margin: "0.25rem 0" }}>
            <strong>XP:</strong> {player.experience.toString()}
          </p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "#888" }}>
            Account: {loadOrCreatePlayerKeypair().publicKey.toBase58()}
          </p>
        </div>
      )}

      {error && (
        <p style={{ color: "red", marginTop: "1rem", wordBreak: "break-word" }}>{error}</p>
      )}
    </div>
  );
}
