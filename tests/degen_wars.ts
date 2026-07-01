import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { readFileSync } from "fs";
import path from "path";

describe("degen_wars", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const idlPath = path.join(process.cwd(), "target/idl/degen_wars.json");
  const degenWarsIdl = JSON.parse(readFileSync(idlPath, "utf8"));
  const program = new anchor.Program(degenWarsIdl, anchor.AnchorProvider.env());

  it("Initializes and levels up!", async () => {
    const player = anchor.web3.Keypair.generate();

    // 1. Initialize Player
    await program.methods.initializePlayer()
      .accounts({ player: player.publicKey, authority: anchor.getProvider().publicKey })
      .signers([player])
      .rpc();

    // 2. Add XP (150 XP should trigger level 2, which requires 100 XP)
    await program.methods.updateExperience(new anchor.BN(150))
      .accounts({ player: player.publicKey })
      .rpc();

    // 3. Fetch and verify
    const playerAccount = await program.account.player.fetch(player.publicKey);
    
    console.log("Player Level:", playerAccount.level.toString());
    console.log("Player XP:", playerAccount.experience.toString());

    expect(playerAccount.level.toNumber()).to.equal(2);
    expect(playerAccount.experience.toNumber()).to.equal(150);
  });
});