import { SKU, Order, OrderItem } from '../types';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const SKU_NAMES = ['A', 'B', 'C', 'D', 'E', 'F'];

export const generateSKUs = (count: number = 3): SKU[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `sku-${i}`,
    name: `商品 ${SKU_NAMES[i % SKU_NAMES.length]}`,
    color: COLORS[i % COLORS.length],
    caseSize: Math.floor(Math.random() * 8) + 4, // 4-12 items per case
  }));
};

export const generateOrders = (count: number, skus: SKU[], complexity: 'low' | 'medium' | 'high'): Order[] => {
  return Array.from({ length: count }).map((_, i) => {
    const itemCount = complexity === 'low' ? 1 : complexity === 'medium' ? Math.random() > 0.5 ? 1 : 2 : Math.floor(Math.random() * skus.length) + 1;
    
    // Shuffle skus
    const shuffledSkus = [...skus].sort(() => 0.5 - Math.random());
    const selectedSkus = shuffledSkus.slice(0, itemCount);

    const items: OrderItem[] = selectedSkus.map(sku => {
      // Intentionally create awkward numbers (primes, etc.) to make it hard
      const base = Math.floor(Math.random() * sku.caseSize * 1.5) + 1;
      return {
        skuId: sku.id,
        quantity: base
      };
    });

    return {
      id: `ORD-${(i + 1).toString().padStart(3, '0')}`,
      items
    };
  });
};
