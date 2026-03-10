
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export const analyzeTransaction = async (tx: Transaction): Promise<string> => {
  // Always use the named parameter for apiKey and initialize inside the function to ensure the latest key is used if applicable.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analyze this Bitcoin transaction for patterns. 
    Look for:
    1. Peel chains
    2. Change address identification
    3. Multi-sig activity
    4. CoinJoin evidence
    5. Notable fee anomalies
    
    Transaction Data:
    Hash: ${tx.hash}
    Size: ${tx.size}
    Fee: ${tx.fee}
    Inputs: ${JSON.stringify(tx.vin.map(v => ({ id: v.txid, addr: v.prev_out?.addr, value: v.prev_out?.value })))}
    Outputs: ${JSON.stringify(tx.vout.map(o => ({ addr: o.addr, value: o.value })))}
    
    Provide a concise, expert summary.
  `;

  try {
    // Call generateContent directly using ai.models.generateContent
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Use .text property, not .text() method
    return response.text || 'No analysis available.';
  } catch (error) {
    console.error('Gemini Analysis failed:', error);
    return 'Failed to generate AI insights.';
  }
};

export const analyzeAddressBehavior = async (address: string, stats: any, txs: any[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Perform a forensic behavioral analysis on this Bitcoin address: ${address}
    
    Stats:
    Total Received: ${stats.funded_txo_sum} sats
    Total Sent: ${stats.spent_txo_sum} sats
    TX Count: ${stats.tx_count}
    
    Recent Transactions Context (last ${txs.length} txs):
    ${JSON.stringify(txs.map(t => ({ id: t.txid, fee: t.fee, weight: t.weight })))}
    
    Analyze:
    1. Wallet Type: (Personal, Exchange, Cold Storage, Bot/Scripted)
    2. Activity Level: (Dormant, High Frequency, Occasional)
    3. Forensic Patterns: (Peel chains, Consolidation, Mixing behavior)
    4. Risk Score: (1-10, where 1 is likely personal and 10 is high-risk/suspicious)
    
    Be objective and professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Use .text property, not .text() method
    return response.text || 'Forensic analysis unavailable.';
  } catch (error) {
    return 'Forensic engine offline.';
  }
};
