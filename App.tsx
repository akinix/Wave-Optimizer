import React, { useState, useEffect } from 'react';
import { Settings, Play, RefreshCw, BarChart2, Database, Zap } from 'lucide-react';
import { SKU, Order, AlgorithmType, AlgorithmResult, SimulationStep, Wave } from './types';
import { generateSKUs, generateOrders } from './utils/dataGenerator';
import { runAlgorithm } from './services/algorithmEngine';
import VisualizationPanel from './components/VisualizationPanel';
import StatsChart from './components/StatsChart';

const App: React.FC = () => {
  // Data State
  const [skus, setSkus] = useState<SKU[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Settings
  const [orderCount, setOrderCount] = useState(20);
  const [complexity, setComplexity] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmType>(AlgorithmType.GREEDY);

  // Execution State
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState<SimulationStep | null>(null);
  const [results, setResults] = useState<AlgorithmResult[]>([]);
  const [lastResult, setLastResult] = useState<AlgorithmResult | null>(null);

  // Init
  useEffect(() => {
    handleGenerateData();
  }, []);

  const handleGenerateData = () => {
    const newSkus = generateSKUs(4);
    const newOrders = generateOrders(orderCount, newSkus, complexity);
    setSkus(newSkus);
    setOrders(newOrders);
    setResults([]);
    setLastResult(null);
    setCurrentStep(null);
  };

  const handleRun = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setCurrentStep(null);

    const result = await runAlgorithm(selectedAlgo, orders, skus, (step) => {
      setCurrentStep(step);
    });

    setResults(prev => {
        // Replace previous result of same algo if exists, otherwise append
        const filtered = prev.filter(r => r.algorithmId !== result.algorithmId);
        return [...filtered, result];
    });
    setLastResult(result);
    setIsSimulating(false);
  };

  const handleRunAll = async () => {
    if (isSimulating) return;
    // Sequential execution logic could be added here, 
    // but for UI simplicity we just let user click through different algos.
    alert("请逐个选择算法运行以观看动画效果，结果将在下方图表中对比。");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Zap size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">智能波次优化演示系统</h1>
            <p className="text-xs text-slate-500">Warehouse Wave Optimization Visualizer</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-600">
           <div className="flex items-center gap-1"><Database size={14}/> 订单: {orders.length}</div>
           <div className="flex items-center gap-1"><Settings size={14}/> SKU: {skus.length}</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden p-4 gap-4">
        
        {/* Sidebar Controls */}
        <aside className="w-80 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-y-auto">
          
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center">
              <Database size={16} className="mr-2 text-indigo-500"/> 数据生成
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">订单数量</label>
                <input 
                  type="range" min="10" max="100" step="10" 
                  value={orderCount} 
                  onChange={(e) => setOrderCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>10</span>
                  <span className="font-bold text-indigo-600">{orderCount}</span>
                  <span>100</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">数据复杂度</label>
                <div className="flex bg-slate-100 rounded p-1">
                  {(['low', 'medium', 'high'] as const).map(l => (
                    <button
                      key={l}
                      onClick={() => setComplexity(l)}
                      className={`flex-1 py-1 text-xs rounded transition-all ${complexity === l ? 'bg-white shadow text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {l === 'low' ? '简单' : l === 'medium' ? '中等' : '困难'}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleGenerateData}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw size={16} /> 重新生成数据
              </button>
            </div>
          </div>

          <div className="p-5 flex-1">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center">
              <Zap size={16} className="mr-2 text-amber-500"/> 算法选择
            </h2>
            
            <div className="space-y-2 mb-6">
              {[
                { id: AlgorithmType.GREEDY, label: '贪心算法 (Greedy)', desc: '快速简单，局部最优' },
                { id: AlgorithmType.REMAINDER_PAIRING, label: '余数配对贪心', desc: '基于取模互补的匹配策略' },
                { id: AlgorithmType.SIMILARITY_GROUPING, label: '相似度分组 (FP-Growth近似)', desc: '按SKU结构聚类后分波' },
                { id: AlgorithmType.GENETIC, label: '遗传算法 / 模拟退火', desc: '全局搜索，迭代优化' },
              ].map(algo => (
                <button
                  key={algo.id}
                  onClick={() => setSelectedAlgo(algo.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedAlgo === algo.id 
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`text-sm font-bold ${selectedAlgo === algo.id ? 'text-indigo-700' : 'text-slate-700'}`}>{algo.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{algo.desc}</div>
                </button>
              ))}
            </div>

            <button 
              onClick={handleRun}
              disabled={isSimulating}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all
                ${isSimulating ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02]'}
              `}
            >
              {isSimulating ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> 计算中...
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" /> 开始计算
                </>
              )}
            </button>

          </div>

          <div className="p-5 bg-slate-50 border-t border-slate-200">
             <div className="text-xs text-slate-400 leading-relaxed">
               <strong>提示：</strong> 箱规指每个SKU一箱包含的数量。算法目标是将订单组合成波次，使得每种商品的合计数量尽可能为箱规的整数倍，减少拆零作业。
             </div>
          </div>
        </aside>

        {/* Visualization & Stats */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          {/* Visual Panel */}
          <div className="flex-1 min-h-0">
            <VisualizationPanel 
              skus={skus} 
              currentStep={currentStep} 
              finalWaves={lastResult?.waves || null}
              isSimulating={isSimulating}
            />
          </div>

          {/* Stats */}
          <div className="flex-none">
             <StatsChart results={results} />
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
