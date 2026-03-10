# ₿ Bitcoin Blockchain Analyser

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
| AI Engine | Google Gemini (via AI Studio) |
| Blockchain Data | Bitcoin on-chain data via public APIs |
| Interface | Google AI Studio prompt environment |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine
- A Gemini API key (obtain one from [Google AI Studio](https://aistudio.google.com/))

### Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/bitcoin-blockchain-analyser.git
   cd bitcoin-blockchain-analyser
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set your Gemini API key in `.env.local`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. Run the app:
   ```bash
   npm run dev
   ```

5. Start analysing — paste a Bitcoin address or transaction ID to begin.

---

## 💡 Example Use Cases

- **Trace funds** from a known address across multiple hops to identify destination wallets
- **Profile a wallet** by clustering associated addresses and summarising activity
- **Investigate a transaction** for signs of CoinJoin, peel chains, or mixing services
- **Monitor on-chain activity** for a set of addresses over a defined time window

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
