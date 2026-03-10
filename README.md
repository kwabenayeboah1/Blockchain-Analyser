# ₿ Bitcoin Blockchain Analyser
![How Blockchain works](https://www.pwc.com/us/en/industries/financial-services/images/blockchain.svg)
> AI-powered Bitcoin blockchain analysis tool for transaction tracing, address clustering, on-chain metrics, and forensic investigation — built with Google AI Studio (Gemini).

---

## 📖 Overview

Bitcoin Blockchain Analyser is an open-source tool that combines the transparency of Bitcoin's on-chain data with the analytical power of Google Gemini to surface meaningful insights from the blockchain. Whether you're tracing the flow of funds across transactions, clustering addresses into likely wallet entities, or performing forensic analysis on suspicious activity, this tool provides an accessible, AI-assisted interface for deep on-chain investigation.

Built on Google AI Studio, it requires no local infrastructure — just a Gemini API key and curiosity.

---

## ✨ Features

- **Transaction Tracing & Graph Analysis** — Follow the movement of funds across inputs and outputs, mapping transaction chains to visualise fund flows across the network.
- **Address Clustering & Wallet Profiling** — Apply heuristics to group addresses likely controlled by the same entity, building wallet-level profiles from raw on-chain data.
- **On-Chain Metrics & Analytics** — Analyse key metrics including transaction volumes, fee patterns, UTXO age distribution, and activity timelines.
- **Forensic Transaction Analysis** — Investigate transactions for patterns associated with mixing, layering, or other obfuscation techniques using AI-assisted interpretation.

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| AI Engine | Google Gemini API |
| Frontend | Web app (exported from Google AI Studio) |
| Runtime | Node.js |
| Blockchain Data | Bitcoin on-chain data via public APIs (https://mempool.space/)|

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine
- A Gemini API key (obtain one from [Google AI Studio](https://aistudio.google.com/))

### Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/kwabenayeboah1/Blockchain-Analyser.git
   cd Blockchain-Analyser
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   
3. Create a file named `.env.local` in the root of the project and add your Gemini API key:
   GEMINI_API_KEY=your_api_key_here
   
4. Set your Gemini API key in `.env.local`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

5. Run the app:
   ```bash
   npm run dev
   ```

6. Start analysing — paste a Bitcoin address or transaction ID to begin. You can use https://mempool.space/ to find a Tx ID to investigate.

---

## 💡 Example Use Cases

- **Trace funds** from a known address across multiple hops to identify destination wallets
- **Profile a wallet** by clustering associated addresses and summarising activity
- **Investigate a transaction** for signs of CoinJoin, peel chains, or mixing services
- **Monitor on-chain activity** for a set of addresses over a defined time window

---

## 📚 Background & Terminology

A primer on the key concepts underpinning this tool — useful if you're new to Bitcoin or blockchain technology.

### Bitcoin
Bitcoin is a decentralised digital currency created in 2009 by the pseudonymous **Satoshi Nakamoto**, introduced in a nine-page whitepaper titled *"Bitcoin: A Peer-to-Peer Electronic Cash System"*. It was the first cryptocurrency — designed to allow value to be transferred directly between two parties without the need for a bank or financial intermediary. Bitcoin has a hard-capped supply of **21 million coins**, making it inherently scarce. Today it is used as a store of value, a medium of exchange, and increasingly as a macro asset held by institutions and sovereign funds.

### The Blockchain
The blockchain is Bitcoin's public ledger — a chronological, immutable record of every transaction ever made. Rather than being stored in one place, it is replicated across thousands of nodes worldwide. Each **block** contains a batch of validated transactions and is cryptographically linked to the one before it, forming a tamper-evident chain. This transparency is what makes on-chain analysis possible: every movement of funds is permanently and publicly visible.

### Transactions & UTXOs
Bitcoin doesn't use account balances like a bank. Instead it uses a **UTXO (Unspent Transaction Output)** model. When you receive bitcoin, you receive a UTXO — essentially a discrete chunk of value. When you spend it, that UTXO is consumed and new ones are created as outputs. Analysing UTXOs reveals how funds are batched, split, and moved across the network.

### Addresses
A Bitcoin **address** is a string of alphanumeric characters that represents a destination for funds — loosely analogous to a bank account number. Addresses are derived from cryptographic key pairs and a single user may control many addresses. Identifying which addresses belong to the same entity is known as **address clustering**.

### Transaction Graph Analysis
Every Bitcoin transaction links input addresses (sources of funds) to output addresses (destinations). By mapping these relationships, it is possible to construct a **transaction graph** — a visual and analytical representation of how value flows across the network over time.

### Forensic Analysis
On-chain forensics involves examining transactions for patterns that suggest deliberate obfuscation — such as **CoinJoin** (combining multiple users' transactions to obscure ownership), **peel chains** (a series of transactions where change is repeatedly passed forward), or the use of **mixing services**. These techniques are used by blockchain analytics firms and compliance teams to trace illicit fund flows.

### Halving
Approximately every four years, the reward given to Bitcoin miners for validating a block is cut in half — an event known as the **halving**. This is hard-coded into Bitcoin's protocol and is central to its disinflationary supply schedule, with the final bitcoin projected to be mined around the year 2140.

---

## ⚠️ Disclaimer

This tool is intended for educational and research purposes only. Any analysis performed should comply with applicable laws and regulations in your jurisdiction. The author does not condone the use of this tool for any unlawful purpose.

---

## 📄 Licence

Distributed under the MIT Licence. See `LICENSE` for more information.

---

## 🙌 Acknowledgements

- [Google AI Studio](https://aistudio.google.com/) for the Gemini API
- The open-source Bitcoin developer community
- Public blockchain data providers

---

*Built with curiosity and a deep respect for the elegance of Bitcoin's transparent ledger.*
