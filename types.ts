export interface SKU {
  id: string;
  name: string;
  color: string;
  caseSize: number; // 箱规
}

export interface OrderItem {
  skuId: string;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
}

export interface Wave {
  id: string;
  orders: Order[];
  isPerfect: boolean; // 是否所有商品都满足整箱
  remainderScore: number; // 余数惩罚分
  skuDetails: Record<string, { total: number; remainder: number; cases: number }>;
}

export interface SimulationStep {
  currentWaveOrders: Order[];
  poolOrders: Order[];
  description: string;
  algorithmName: string;
  progress: number; // 0-100
}

export interface AlgorithmResult {
  algorithmId: string;
  algorithmName: string;
  waves: Wave[];
  executionTimeMs: number;
  totalWaves: number;
  perfectWaves: number;
  totalRemainder: number;
}

export enum AlgorithmType {
  GREEDY = 'greedy',
  BACKTRACKING = 'backtracking',
  GENETIC = 'genetic',
  BIN_PACKING = 'bin_packing',
  REMAINDER_PAIRING = 'remainder_pairing',
  SIMULATED_MILP = 'simulated_milp',
  SIMILARITY_GROUPING = 'similarity_grouping'
}
