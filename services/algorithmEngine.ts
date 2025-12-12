import { Order, SKU, Wave, AlgorithmType, AlgorithmResult, SimulationStep } from '../types';

// Helper: Calculate wave statistics
export const calculateWaveStats = (orders: Order[], skus: SKU[]): Wave => {
  const skuDetails: Record<string, { total: number; remainder: number; cases: number }> = {};
  let totalRemainder = 0;
  let isPerfect = true;

  skus.forEach(sku => {
    const totalQty = orders.reduce((sum, order) => {
      const item = order.items.find(i => i.skuId === sku.id);
      return sum + (item ? item.quantity : 0);
    }, 0);
    
    // If totalQty is 0, it doesn't break perfectness (assuming empty is fine)
    // If totalQty > 0, check modulo
    const remainder = totalQty > 0 ? totalQty % sku.caseSize : 0;
    const cases = Math.floor(totalQty / sku.caseSize);

    if (remainder !== 0) {
      isPerfect = false;
      totalRemainder += remainder;
    }

    skuDetails[sku.id] = { total: totalQty, remainder, cases };
  });

  return {
    id: `wave-${Date.now()}-${Math.random()}`,
    orders,
    isPerfect,
    remainderScore: totalRemainder,
    skuDetails
  };
};

// --- ALGORITHMS ---

// 1. Greedy Algorithm: Simply fill waves one by one, trying to minimize immediate remainder
async function runGreedy(
  orders: Order[],
  skus: SKU[],
  onStep: (step: SimulationStep) => Promise<void>
): Promise<Wave[]> {
  let pool = [...orders];
  const waves: Wave[] = [];

  while (pool.length > 0) {
    let currentWaveOrders: Order[] = [];
    
    // Start with the first available order
    const seed = pool.shift();
    if (seed) {
        currentWaveOrders.push(seed);
        
        // Try to find best matches from pool to make this wave perfect
        // Simple heuristic: Iterate pool, if adding order reduces total remainder ratio, add it.
        // Or simpler: limit wave size to N orders or until perfect.
        
        let improved = true;
        while(improved && pool.length > 0 && currentWaveOrders.length < 10) {
            improved = false;
            let bestCandidateIndex = -1;
            let bestScore = Infinity;
            
            // Calculate current remainder
            const currentStats = calculateWaveStats(currentWaveOrders, skus);
            const currentRem = currentStats.remainderScore;

            for (let i = 0; i < pool.length; i++) {
                const candidate = pool[i];
                const tempWave = [...currentWaveOrders, candidate];
                const tempStats = calculateWaveStats(tempWave, skus);
                
                // Score: Lower remainder is better. 
                // We prefer reducing remainder, or at least not increasing it much while clearing orders
                if (tempStats.remainderScore <= currentRem || (tempStats.remainderScore < bestScore)) {
                    bestScore = tempStats.remainderScore;
                    bestCandidateIndex = i;
                }
            }

            if (bestCandidateIndex !== -1 && bestScore <= currentRem + 2) { // Allow slight degradation to group orders
                const bestOrder = pool.splice(bestCandidateIndex, 1)[0];
                currentWaveOrders.push(bestOrder);
                improved = true;
                
                await onStep({
                  currentWaveOrders: [...currentWaveOrders],
                  poolOrders: [...pool],
                  description: `贪心选择: 加入订单 ${bestOrder.id}, 当前余数罚分: ${bestScore}`,
                  algorithmName: '贪心算法 (Greedy)',
                  progress: 0
                });
            }
        }
    }
    
    waves.push(calculateWaveStats(currentWaveOrders, skus));
  }
  return waves;
}

// 2. Remainder Pairing: Group orders by their remainder profiles
async function runRemainderPairing(
  orders: Order[],
  skus: SKU[],
  onStep: (step: SimulationStep) => Promise<void>
): Promise<Wave[]> {
  // Concept: For a single SKU, if Case=10. Order A has 3. We look for Order B with 7.
  // For multiple SKUs, we define a "Vector Remainder".
  // Simplified for demo: Score similarity of remainders.
  
  let pool = [...orders];
  const waves: Wave[] = [];

  while (pool.length > 0) {
    const currentWaveOrders: Order[] = [pool.shift()!];
    
    // Find complement
    let bestMatchIdx = -1;
    let minRemainderSum = Infinity;

    // Scan whole pool to find best complement
    for (let i = 0; i < pool.length; i++) {
        const candidate = pool[i];
        const combined = calculateWaveStats([...currentWaveOrders, candidate], skus);
        if (combined.remainderScore < minRemainderSum) {
            minRemainderSum = combined.remainderScore;
            bestMatchIdx = i;
        }
    }

    if (bestMatchIdx !== -1) {
        const match = pool.splice(bestMatchIdx, 1)[0];
        currentWaveOrders.push(match);
        await onStep({
            currentWaveOrders: [...currentWaveOrders],
            poolOrders: [...pool],
            description: `余数配对: ${currentWaveOrders[0].id} 匹配 ${match.id} (余数和: ${minRemainderSum})`,
            algorithmName: '余数配对贪心 (Remainder Pairing)',
            progress: 0
        });
    }

    waves.push(calculateWaveStats(currentWaveOrders, skus));
  }
  
  return waves;
}

// 3. Simulated Annealing (Meta-heuristic for MILP/Genetic concepts)
async function runSimulatedAnnealing(
  orders: Order[],
  skus: SKU[],
  onStep: (step: SimulationStep) => Promise<void>
): Promise<Wave[]> {
  // Start with random waves
  let waves: Order[][] = [];
  const chunkSize = 4; // Target wave size
  let pool = [...orders];
  
  // Initial random allocation
  while(pool.length > 0) {
      waves.push(pool.splice(0, chunkSize));
  }

  const calculateTotalEnergy = (ws: Order[][]) => {
      return ws.reduce((acc, w) => acc + calculateWaveStats(w, skus).remainderScore, 0);
  };

  let currentEnergy = calculateTotalEnergy(waves);
  let bestWaves = JSON.parse(JSON.stringify(waves));
  let bestEnergy = currentEnergy;

  const iterations = 50; // Keep low for demo speed
  
  for(let i=0; i<iterations; i++) {
      // Pick two random waves and swap a random order
      if (waves.length < 2) break;
      
      const w1Idx = Math.floor(Math.random() * waves.length);
      let w2Idx = Math.floor(Math.random() * waves.length);
      while(w1Idx === w2Idx) w2Idx = Math.floor(Math.random() * waves.length);

      if (waves[w1Idx].length === 0 || waves[w2Idx].length === 0) continue;

      const o1Idx = Math.floor(Math.random() * waves[w1Idx].length);
      const o2Idx = Math.floor(Math.random() * waves[w2Idx].length);

      // Swap
      const o1 = waves[w1Idx][o1Idx];
      const o2 = waves[w2Idx][o2Idx];
      
      // Perform tentative swap
      waves[w1Idx][o1Idx] = o2;
      waves[w2Idx][o2Idx] = o1;

      const newEnergy = calculateTotalEnergy(waves);
      
      // Acceptance probability
      const temp = 100 / (i + 1);
      const delta = newEnergy - currentEnergy;
      
      if (delta < 0 || Math.random() < Math.exp(-delta / temp)) {
          // Accept
          currentEnergy = newEnergy;
          if (currentEnergy < bestEnergy) {
              bestEnergy = currentEnergy;
              bestWaves = JSON.parse(JSON.stringify(waves));
          }
          await onStep({
            currentWaveOrders: waves[w1Idx], // visualizing one of the changed waves
            poolOrders: [], // Not really using pool concept here
            description: `模拟退火: 迭代 ${i+1}/${iterations}, 能量(总余数): ${currentEnergy}`,
            algorithmName: '模拟退火 / 遗传算法 (SA/GA)',
            progress: (i / iterations) * 100
          });
      } else {
          // Revert
          waves[w1Idx][o1Idx] = o1;
          waves[w2Idx][o2Idx] = o2;
      }
  }

  return bestWaves.map(w => calculateWaveStats(w, skus));
}

// 4. Similarity Grouping (FP-Growth Inspired)
// Groups orders that share similar SKUs first, then simply chunks them.
async function runSimilarityGrouping(
    orders: Order[],
    skus: SKU[],
    onStep: (step: SimulationStep) => Promise<void>
  ): Promise<Wave[]> {
    let pool = [...orders];
    const waves: Wave[] = [];
  
    // Helper to get SKU signature
    const getSignature = (o: Order) => o.items.map(i => i.skuId).sort().join('|');
  
    // Sort pool by signature roughly
    pool.sort((a, b) => getSignature(a).localeCompare(getSignature(b)));
  
    while (pool.length > 0) {
      const seed = pool.shift()!;
      const currentWaveOrders = [seed];
      const seedSkus = new Set(seed.items.map(i => i.skuId));
  
      // Look for orders with high Jaccard similarity or same SKUs
      for (let i = 0; i < pool.length; ) {
        const candidate = pool[i];
        const candidateSkus = candidate.items.map(it => it.skuId);
        
        const intersection = candidateSkus.filter(x => seedSkus.has(x)).length;
        const union = new Set([...seedSkus, ...candidateSkus]).size;
        const similarity = intersection / union;
  
        // Threshold for grouping
        if (similarity > 0.5 || (seedSkus.size === 0 && candidateSkus.length === 0)) {
           currentWaveOrders.push(pool.splice(i, 1)[0]);
           if (currentWaveOrders.length >= 5) break; // Limit wave size
        } else {
           i++;
        }
      }

      await onStep({
        currentWaveOrders: [...currentWaveOrders],
        poolOrders: [...pool],
        description: `相似度分组: 发现 ${currentWaveOrders.length} 个结构相似订单`,
        algorithmName: '相似度分组 (Similarity)',
        progress: 0
      });
  
      waves.push(calculateWaveStats(currentWaveOrders, skus));
    }
    return waves;
  }

// --- ENGINE ---

export const runAlgorithm = async (
  type: AlgorithmType,
  orders: Order[],
  skus: SKU[],
  onStep: (step: SimulationStep) => void
): Promise<AlgorithmResult> => {
  const startTime = performance.now();
  
  // Throttle visual updates
  let lastUpdate = 0;
  const throttledOnStep = async (step: SimulationStep) => {
    const now = performance.now();
    if (now - lastUpdate > 100) { // 60ms throttle
        lastUpdate = now;
        onStep(step);
        // Artificial delay for visualization
        await new Promise(r => setTimeout(r, 200)); 
    }
  };

  let resultWaves: Wave[] = [];
  let name = '';

  switch (type) {
    case AlgorithmType.GREEDY:
        name = '贪心算法';
        resultWaves = await runGreedy(JSON.parse(JSON.stringify(orders)), skus, throttledOnStep);
        break;
    case AlgorithmType.REMAINDER_PAIRING:
        name = '余数配对贪心';
        resultWaves = await runRemainderPairing(JSON.parse(JSON.stringify(orders)), skus, throttledOnStep);
        break;
    case AlgorithmType.GENETIC:
    case AlgorithmType.SIMULATED_MILP:
        name = type === AlgorithmType.GENETIC ? '遗传算法' : 'MILP近似';
        resultWaves = await runSimulatedAnnealing(JSON.parse(JSON.stringify(orders)), skus, throttledOnStep);
        break;
    case AlgorithmType.SIMILARITY_GROUPING:
        name = 'FP-Growth/相似度分组';
        resultWaves = await runSimilarityGrouping(JSON.parse(JSON.stringify(orders)), skus, throttledOnStep);
        break;
    default:
        // Fallback to greedy
        name = '默认算法';
        resultWaves = await runGreedy(JSON.parse(JSON.stringify(orders)), skus, throttledOnStep);
        break;
  }

  const endTime = performance.now();
  
  // Final stats
  const perfectWaves = resultWaves.filter(w => w.isPerfect).length;
  const totalRemainder = resultWaves.reduce((acc, w) => acc + w.remainderScore, 0);

  return {
    algorithmId: type,
    algorithmName: name,
    waves: resultWaves,
    executionTimeMs: endTime - startTime,
    totalWaves: resultWaves.length,
    perfectWaves,
    totalRemainder
  };
};
