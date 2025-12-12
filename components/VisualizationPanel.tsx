import React from 'react';
import { Order, SKU, SimulationStep, Wave } from '../types';
import { Package, Truck, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
  skus: SKU[];
  currentStep: SimulationStep | null;
  finalWaves: Wave[] | null;
  isSimulating: boolean;
}

const VisualizationPanel: React.FC<Props> = ({ skus, currentStep, finalWaves, isSimulating }) => {
  // Render a single order as a mini card
  const renderOrder = (order: Order) => (
    <div key={order.id} className="bg-white border border-slate-200 rounded p-1 text-xs shadow-sm w-24 flex-shrink-0">
      <div className="font-bold text-gray-500 mb-1">{order.id}</div>
      <div className="space-y-0.5">
        {order.items.map(item => {
          const sku = skus.find(s => s.id === item.skuId);
          return (
            <div key={item.skuId} className="flex justify-between items-center bg-gray-50 px-1 rounded">
              <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: sku?.color }}></span>
              <span className="font-mono">{item.quantity}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderWave = (wave: Wave, index: number) => {
    return (
      <div key={wave.id} className={`border-2 rounded-lg p-3 ${wave.isPerfect ? 'border-green-500 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
        <div className="flex justify-between items-center mb-2 border-b border-gray-200 pb-1">
          <span className="font-bold text-sm text-gray-700">波次 #{index + 1}</span>
          {wave.isPerfect ? 
            <span className="flex items-center text-green-600 text-xs font-bold"><CheckCircle size={12} className="mr-1"/> 完美整箱</span> : 
            <span className="flex items-center text-amber-600 text-xs font-bold"><AlertTriangle size={12} className="mr-1"/> 拼箱余量: {wave.remainderScore}</span>
          }
        </div>
        
        {/* SKU Summary for Wave */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {Object.entries(wave.skuDetails).map(([skuId, detail]) => {
              const sku = skus.find(s => s.id === skuId);
              if (!sku || detail.total === 0) return null;
              return (
                  <div key={skuId} className="flex items-center text-xs bg-white p-1 rounded border border-gray-100">
                      <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: sku.color }}></div>
                      <div className="flex-1">
                          <div className="flex justify-between">
                              <span className="text-gray-600">{sku.name}</span>
                              <span className="font-mono font-bold">{detail.total}</span>
                          </div>
                          <div className="text-[10px] text-gray-400">
                             {detail.cases}箱 + {detail.remainder}件 (规:{sku.caseSize})
                          </div>
                      </div>
                  </div>
              )
          })}
        </div>

        <div className="flex flex-wrap gap-1">
          {wave.orders.map(o => (
            <div key={o.id} className="text-[10px] bg-white border px-1 rounded text-gray-500">{o.id}</div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-xl overflow-hidden shadow-inner border border-slate-200">
      
      {/* Simulation Area */}
      {isSimulating && currentStep && (
        <div className="p-6 flex-1 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute top-2 left-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold animate-pulse">
            {currentStep.algorithmName} 运行中...
          </div>
          <div className="absolute top-2 right-2 text-gray-500 text-sm">
             {currentStep.description}
          </div>

          <div className="w-full max-w-4xl flex items-start gap-8">
            {/* Pool */}
            <div className="flex-1 bg-white/50 p-4 rounded-xl border border-dashed border-slate-300 min-h-[200px]">
               <h4 className="text-sm font-bold text-gray-400 mb-2 flex items-center"><Package className="mr-2" size={16}/> 订单池 ({currentStep.poolOrders.length})</h4>
               <div className="flex flex-wrap gap-2 content-start">
                  {currentStep.poolOrders.slice(0, 12).map(renderOrder)}
                  {currentStep.poolOrders.length > 12 && <div className="text-gray-400 text-xs p-2">...以及更多</div>}
               </div>
            </div>

            {/* Processing Arrow */}
            <div className="flex flex-col items-center justify-center pt-10">
                <div className="w-16 h-1 bg-blue-400 rounded animate-pulse"></div>
                <div className="text-blue-500 text-xs mt-1">处理中</div>
            </div>

            {/* Current Wave Being Built */}
            <div className="flex-1 bg-blue-50/50 p-4 rounded-xl border border-blue-200 min-h-[200px] shadow-sm">
                <h4 className="text-sm font-bold text-blue-500 mb-2 flex items-center"><Truck className="mr-2" size={16}/> 当前构建波次</h4>
                <div className="flex flex-wrap gap-2">
                    {currentStep.currentWaveOrders.map(renderOrder)}
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Grid */}
      {!isSimulating && finalWaves && (
        <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                算法结果展示 
                <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    共生成 {finalWaves.length} 个波次
                </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {finalWaves.map((wave, idx) => renderWave(wave, idx))}
            </div>
        </div>
      )}

      {/* Empty State */}
      {!isSimulating && !finalWaves && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Package size={48} className="mb-2 opacity-20"/>
            <p>请在左侧生成数据并选择算法开始</p>
        </div>
      )}

    </div>
  );
};

export default VisualizationPanel;
