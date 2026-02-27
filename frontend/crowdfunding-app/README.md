# 🚀 Stellar Crowdfunding

A decentralized crowdfunding application built on the **Stellar blockchain** using **Soroban smart contracts**. Users can connect their wallet and donate XLM directly to the contract on Stellar Testnet.

---

## 📸 Screenshots

### Wallet Selection
![Wallet Options](./screenshots/wallet-options.png)
> Supports **Freighter** and **Albedo** wallets

---

## 🌐 Live Demo

> [Add your Vercel/Netlify URL here after deployment]

---

## 📋 Project Structure

```text
.
├── contracts/
│   └── crowdfunding/
│       ├── src/
│       │   ├── lib.rs        # Smart contract logic
│       │   └── test.rs       # Contract tests
│       └── Cargo.toml
├── frontend/
│   └── crowdfunding-app/
│       ├── src/
│       │   ├── App.tsx       # Main React component
│       │   ├── lib/
│       │   │   └── wallet.ts # Freighter wallet helper
│       │   └── main.tsx
│       ├── package.json
│       └── vite.config.ts
├── Cargo.toml
└── README.md
```

---

## 🔗 Contract Details

| Field | Value |
|---|---|
| **Network** | Stellar Testnet |
| **Contract Address** | `CAETW2QVHH2VQL2SYKCLXHSXKVSDNG4WLN74QOEI6G2EZXKUBAXWNP6T` |
| **RPC Endpoint** | `https://soroban-testnet.stellar.org` |

### 🔍 Verify on Stellar Explorer
- Contract: [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CAETW2QVHH2VQL2SYKCLXHSXKVSDNG4WLN74QOEI6G2EZXKUBAXWNP6T)

### 📦 Transaction Hash (Contract Call)
> `[Add your transaction hash here]`  
> Verify at: `https://stellar.expert/explorer/testnet/tx/YOUR_TX_HASH`

---

## ✅ Features

- 🔑 **Multi-wallet support** — Freighter & Albedo
- 💸 **Donate XLM** to the smart contract
- 📊 **Live donation total** from on-chain data
- ✅ **Success/error feedback** with clear status messages
- 🔌 **Disconnect wallet** anytime

---

## 🛠️ Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) (recommended) or npm
- [Freighter Wallet](https://freighter.app/) browser extension OR [Albedo](https://albedo.link/)
- Stellar Testnet account with test XLM (get from [Stellar Friendbot](https://friendbot.stellar.org/))

---

---

## 🔄 How It Works

1. User connects wallet (Freighter or Albedo)
2. User enters donation amount in XLM
3. Frontend builds Soroban transaction
4. Wallet signs the transaction
5. Contract `donate()` function is invoked
6. Total donation is updated on-chain
7. Frontend fetches latest `get_total()` from contract

---

## ⚙️ Environment Variables

Create a `.env` file inside `frontend/crowdfunding-app`:

```env
VITE_RPC_URL=https://soroban-testnet.stellar.org
VITE_CONTRACT_ID=CAETW2QVHH2VQL2SYKCLXHSXKVSDNG4WLN74QOEI6G2EZXKUBAXWNP6T

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/stellar-crowdfunding.git
cd stellar-crowdfunding
```

### 2. Install Frontend Dependencies

```bash
cd frontend/crowdfunding-app
pnpm install
```

> **Note:** If using npm and facing issues with optional dependencies on Windows, use:
> ```cmd
> rmdir /s /q node_modules
> del package-lock.json
> npm install
> ```

### 3. Run the Development Server

```bash
pnpm dev
# or
npx vite
```

The app will be available at `http://localhost:5173`

---

### 4. Build for Production

```bash
pnpm build
```

### 5. Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Or connect your GitHub repo to [Vercel](https://vercel.com) for automatic deployments.

---

## 🦀 Smart Contract (Soroban)

### Build the Contract

```bash
cargo build --target wasm32-unknown-unknown --release
```

### Deploy to Testnet

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/crowdfunding.wasm \
  --network testnet \
  --source YOUR_ACCOUNT
```

### Contract Functions

| Function | Description |
|---|---|
| `donate(amount: i128)` | Donate XLM to the contract |
| `get_total()` | Returns total donations received |

---

## 💼 Wallet Setup

### Freighter
1. Install the [Freighter extension](https://freighter.app/)
2. Create or import a Stellar account
3. Switch network to **Testnet**
4. Fund your account via [Friendbot](https://friendbot.stellar.org/)

### Albedo
1. Visit [albedo.link](https://albedo.link) — no extension needed
2. Create an account directly in the browser
3. Fund via [Friendbot](https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY)

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Rust + Soroban SDK |
| Frontend | React + TypeScript + Vite |
| Blockchain | Stellar Testnet |
| Wallet | Freighter, Albedo |
| Styling | Inline CSS |

---

## 📝 Commit History

This project includes meaningful commits covering:
1. `feat: initialize Soroban crowdfunding smart contract`
2. `feat: add React frontend with Freighter wallet integration`
3. `fix: resolve toXDR transaction assembly bug`
4. `feat: add Albedo wallet support and multi-wallet picker`
5. `fix: correct i128 ScVal parsing for total donations display`

---

## 📄 License

MIT
