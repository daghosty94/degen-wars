# Degen Wars

Degen Wars is a turn-based browser artillery game currently in active development. The project combines browser-based gameplay with planned Solana blockchain functionality, including token integration, player accounts, digital collectibles, and marketplace features.

## Project Status

**Active Development**

The browser game and initial Solana development structure are currently being built and tested. Blockchain features are not yet deployed to mainnet.

## Current Features

- Turn-based artillery combat
- Browser-based game interface
- Player statistics and game-state components
- JavaScript and TypeScript application structure
- Initial Rust and Anchor program architecture
- Solana token-development scripts
- Git and GitHub version control

## Technologies Used

- HTML5
- CSS3
- JavaScript
- TypeScript
- React
- Rust
- Anchor Framework
- Solana Web3.js
- SPL Token
- Git and GitHub
- Visual Studio Code

## Secure Development Practices

This project applies secure source-control practices by excluding:

- Private keys and wallet keypairs
- Environment files
- Local configuration files
- Token checkpoint files
- Build artifacts
- Dependencies
- Local validator data

Sensitive files are excluded through `.gitignore` and are not intended to be stored in the public repository.

## AI-Assisted Development

Claude, ChatGPT, and other AI-assisted development tools have been used to support code generation, debugging, documentation, architecture review, and iterative development. All changes are reviewed, tested, and validated before being added to the project.

## Solana Development

The project currently includes initial Solana development components for:

- SPL token creation
- Token metadata
- Treasury token accounts
- Anchor program structure
- Planned player accounts
- Planned collectible ownership
- Planned marketplace and auction functionality

## Planned Features

- Solana devnet deployment
- Wallet connection
- On-chain player profiles
- Multiplayer synchronization
- Digital collectible ownership
- Auction house and marketplace
- Token-based rewards
- Security testing and smart-contract review
- Mainnet deployment after testing

## Repository Structure

```text
degen-wars/
├── app/                 # Browser application
├── programs/degen_wars/ # Anchor and Rust program
├── scripts/             # Solana and token scripts
├── tests/               # Project tests
├── Anchor.toml
├── Cargo.toml
├── package.json
└── .gitignore
