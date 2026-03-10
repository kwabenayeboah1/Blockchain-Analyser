
import * as d3 from 'd3';

export interface Transaction {
  hash: string;
  ver: number;
  locktime?: number;
  size: number;
  weight: number;
  fee: number;
  vin: Vin[];
  vout: Vout[];
  time?: number;
}

export interface Vin {
  txid: string;
  vout: number;
  prev_out?: {
    value: number;
    addr?: string;
    spent: boolean;
  };
}

export interface Vout {
  value: number;
  n: number;
  spent: boolean;
  addr?: string;
  script?: string;
}

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'address' | 'transaction';
  value?: number;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string;
  target: string;
  value: number;
}
