use anchor_lang::prelude::*;
// XP reuse anchor_lang::prelude::*;

declare_id!("EQF1du9v8t1pEpTFESz7NFerCcbMQE8RvDgqAtpssLLs");

// XP required to reach each level (1-50)
pub const XP_LEVEL_TABLE: [u64; 50] = [
    0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, // 1-10
    3300, 4000, 4800, 5700, 6700, 7800, 9000, 10300, 11700, 13200, // 11-20
    14800, 16500, 18300, 20200, 22200, 24300, 26500, 28800, 31200, 33700, // 21-30
    36300, 39000, 41800, 44700, 47700, 50800, 54000, 57300, 60700, 64200, // 31-40
    67800, 71500, 75300, 79200, 83200, 87300, 91500, 95800, 100200, 105000 // 41-50
];

#[program]
pub mod degen_wars {
    use super::*;

    pub fn initialize_player(ctx: Context<InitializePlayer>) -> Result<()> {
        let player = &mut ctx.accounts.player;
        player.owner = ctx.accounts.authority.key();
        player.level = 1;
        player.experience = 0;
        Ok(())
    }

    pub fn update_experience(ctx: Context<UpdateExperience>, amount: u64) -> Result<()> {
        let player = &mut ctx.accounts.player;
        
        // Add the new XP
        player.experience += amount;

        // Check for level up (max level 50)
        if player.level < 50 {
            // Check if player has reached threshold for the next level
            if player.experience >= XP_LEVEL_TABLE[player.level as usize] {
                player.level += 1;
            }
        }
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePlayer<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 8 + 8)]
    pub player: Account<'info, Player>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateExperience<'info> {
    #[account(mut)]
    pub player: Account<'info, Player>,
}

#[account]
pub struct Player {
    pub owner: Pubkey,
    pub level: u64,
    pub experience: u64,
}