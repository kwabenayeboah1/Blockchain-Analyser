
import { Transaction } from '../types';

const MEMPOOL_API = 'https://mempool.space/api';

export const blockchainService = {
  async getTransaction(txHash: string): Promise<Transaction> {
    const response = await fetch(`${MEMPOOL_API}/tx/${txHash}`);
    if (!response.ok) throw new Error('Transaction not found');
    const data = await response.json();

    return {
      hash: data.txid,
      ver: data.version,
      locktime: data.locktime,
      size: data.size,
      weight: data.weight,
      fee: data.fee,
      vin: data.vin.map((v: any) => ({
        txid: v.txid,
        vout: v.vout,
        prev_out: v.prevout ? {
          value: v.prevout.value,
          addr: v.prevout.scriptpubkey_address,
          spent: true
        } : undefined
      })),
      vout: data.vout.map((o: any) => ({
        value: o.value,
        n: 0,
        addr: o.scriptpubkey_address,
        spent: false
      })),
      status: data.status
    } as any;
  },

  async getAddress(address: string): Promise<any> {
    const response = await fetch(`${MEMPOOL_API}/address/${address}`);
    if (response.status === 404) {
      // Return a default structure for unused addresses
      return {
        address,
        chain_stats: {
          funded_txo_count: 0,
          funded_txo_sum: 0,
          spent_txo_count: 0,
          spent_txo_sum: 0,
          tx_count: 0
        },
        mempool_stats: {
          funded_txo_count: 0,
          funded_txo_sum: 0,
          spent_txo_count: 0,
          spent_txo_sum: 0,
          tx_count: 0
        }
      };
    }
    if (!response.ok) throw new Error('Address lookup failed');
    return response.json();
  },

  async getAddressTxs(address: string): Promise<any[]> {
    const response = await fetch(`${MEMPOOL_API}/address/${address}/txs`);
    if (response.status === 404) return [];
    if (!response.ok) throw new Error('Address transactions fetch failed');
    return response.json();
  }
};
