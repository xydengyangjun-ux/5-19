import React, { useState } from 'react';
import AIAssistant from './AIAssistant';

const EXPECTED_ANSWERS: Record<string, string> = {
  node1: '开始',
  node2: '当前位置为 1',
  node3: '当前位置<6',
  node4: '当前数>右侧数',
  node5: '交换两个数位置',
  node6: '当前位置右移 1 位',
  node7: '结束',
};

const ITEMS = [
  '交换两个数位置',
  '当前位置为 1',
  '结束',
  '当前数>右侧数',
  '开始',
  '当前位置右移 1 位',
  '当前位置<6',
];

const nodes = [
  { id: 'node1', type: 'pill', x: 350, y: 60, w: 120, h: 40 },
  { id: 'node2', type: 'rect', x: 350, y: 140, w: 140, h: 40 },
  { id: 'node3', type: 'diamond', x: 350, y: 240, w: 180, h: 70 },
  { id: 'node4', type: 'diamond', x: 350, y: 370, w: 180, h: 70 },
  { id: 'node5', type: 'rect', x: 180, y: 450, w: 140, h: 40 },
  { id: 'node6', type: 'rect', x: 350, y: 530, w: 160, h: 40 },
  { id: 'node7', type: 'pill', x: 350, y: 620, w: 120, h: 40 },
];

interface Props {
  activeNode?: string | null;
  onCompleteChange?: (isComplete: boolean) => void;
}

export default function FlowchartGame({ activeNode, onCompleteChange }: Props) {
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState<{text: string; id: number} | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const NODE_EXPLANATIONS: Record<string, string> = {
    'node1': '开始第 1 步的操作',
    'node2': '从开始两个数进行操作',
    'node3': '对每一对相邻数进行同样的操作，直到最后两个数',
    'node4': '比较相邻的两个数',
    'node5': '如果第一个比第二个大，就交换位置',
    'node6': '移动到下一对相邻的数',
    'node7': '操作后，排在最后面的数就是最大数'
  };

  const isAllCorrect = Object.keys(EXPECTED_ANSWERS).every(
    key => placed[key] === EXPECTED_ANSWERS[key]
  );

  React.useEffect(() => {
    if (onCompleteChange) {
      onCompleteChange(isAllCorrect);
    }
    if (isAllCorrect) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowSuccess(false);
    }
  }, [isAllCorrect, onCompleteChange]);

  const handleDragStart = (e: React.DragEvent, item: string) => {
    e.dataTransfer.setData('text/plain', item);
    setDraggedItem(item);
  };

  const handleDrop = (e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    const item = e.dataTransfer.getData('text/plain');
    if (item) {
      if (item !== EXPECTED_ANSWERS[nodeId]) {
        setAiPrompt({
          text: `SYSTEM_HIDDEN: 学生刚刚把【${item}】拖到了错误的位置（正确答案应该是【${EXPECTED_ANSWERS[nodeId]}】）。请用一两句话启发他为什么不对，引导他思考单次冒泡的逻辑。`,
          id: Date.now()
        });
      }

      setPlaced(prev => {
        const newPlaced = { ...prev };
        for (const key in newPlaced) {
          if (newPlaced[key] === item) {
            delete newPlaced[key];
          }
        }
        newPlaced[nodeId] = item;
        return newPlaced;
      });
    }
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemove = (nodeId: string) => {
    setPlaced(prev => {
      const newPlaced = { ...prev };
      delete newPlaced[nodeId];
      return newPlaced;
    });
  };

  const availableItems = ITEMS.filter(item => !Object.values(placed).includes(item));

  return (
    <div className="flex h-full w-full bg-slate-50 relative">
      {/* 左侧选项栏 */}
      <div className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col shadow-sm z-10">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <span className="mr-2">🧩</span> 流程图拼图
        </h3>
        
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 leading-relaxed">
          <p className="font-bold mb-1">算法描述：</p>
          <p className="text-blue-900 font-medium"><strong>第 1 步:</strong> 比较相邻的两个数，如果第一个比第二个大，就交换位置。对每一对相邻数进行同样的操作，从开始两个数到最后两个数。操作后，排在最后面的数就是最大数。</p>
          <p className="mt-1 text-gray-500">第 2 步: 除已排序的数，重复第 1 步的操作，对其余数进行比较与交换，直到没有任何一对数需要交换位置。</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {availableItems.map((item, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              className="p-3 bg-white border-2 border-slate-200 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-sky-400 hover:shadow-md transition-all text-sm font-medium text-slate-700 text-center"
            >
              {item}
            </div>
          ))}
          {availableItems.length === 0 && !isAllCorrect && (
            <div className="text-center text-slate-400 text-sm mt-8">
              所有模块已放置，请检查是否有错误（红色）
            </div>
          )}
        </div>
      </div>

      {/* 右侧画布区 */}
      <div className="flex-1 relative overflow-hidden bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="absolute inset-0 flex items-start justify-center overflow-hidden pt-4">
          <div className="relative w-[700px] h-[700px]" style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
            {/* SVG Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#0ea5e9" />
                </marker>
              </defs>
              <g stroke="#0ea5e9" strokeWidth="2" fill="none" markerEnd="url(#arrow)">
                {/* 1 to 2 */}
                <line x1="350" y1="80" x2="350" y2="120" />
                {/* 2 to 3 */}
                <line x1="350" y1="160" x2="350" y2="205" />
                {/* 3 to 4 (Yes) */}
                <line x1="350" y1="275" x2="350" y2="335" />
                {/* 3 to 7 (No) */}
                <path d="M 440 240 L 550 240 L 550 580 L 350 580 L 350 600" />
                {/* 4 to 5 (Yes) */}
                <path d="M 260 370 L 180 370 L 180 430" />
                {/* 4 to merge (No) */}
                <path d="M 440 370 L 500 370 L 500 490 L 350 490" markerEnd="none" />
                {/* 5 to merge */}
                <path d="M 180 470 L 180 490 L 350 490" markerEnd="none" />
                {/* merge to 6 */}
                <line x1="350" y1="490" x2="350" y2="510" />
                {/* 6 to loop back */}
                <path d="M 350 550 L 350 580 L 80 580 L 80 180 L 350 180" />
              </g>
              {/* Labels */}
              <text x="360" y="310" fill="#333" fontSize="14" fontWeight="bold">是</text>
              <text x="470" y="230" fill="#333" fontSize="14" fontWeight="bold">否</text>
              <text x="210" y="360" fill="#333" fontSize="14" fontWeight="bold">是</text>
              <text x="470" y="360" fill="#333" fontSize="14" fontWeight="bold">否</text>
            </svg>

            {/* Nodes */}
            {nodes.map(node => {
              const isFilled = !!placed[node.id];
              const isCorrect = placed[node.id] === EXPECTED_ANSWERS[node.id];
              const content = placed[node.id] || '拖拽至此';

              return (
                <div
                  key={node.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${isFilled ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                  style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, node.id)}
                  onClick={() => isFilled && handleRemove(node.id)}
                  draggable={isFilled}
                  onDragStart={(e) => {
                    if (isFilled) {
                      handleDragStart(e, placed[node.id]);
                    }
                  }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Tooltip */}
                  {hoveredNode === node.id && NODE_EXPLANATIONS[node.id] && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-xl z-50 text-center leading-relaxed normal-case tracking-normal font-normal pointer-events-none">
                      {NODE_EXPLANATIONS[node.id]}
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                    </div>
                  )}

                  {node.type === 'pill' && (
                    <div key={content} className={`w-full h-full text-sm rounded-full flex items-center justify-center border-2 transition-all shadow-sm ${
                      activeNode === node.id ? 'ring-4 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)] z-10 scale-110 ' : ''
                    } ${
                      isFilled 
                        ? (isCorrect ? 'bg-[#bbf7d0] border-green-500 text-green-800 font-bold' : 'bg-red-50 border-red-500 text-red-700 font-bold animate-error-shake') 
                        : 'bg-white/80 border-sky-300 text-sky-400 border-dashed hover:bg-sky-50'
                    }`}>
                      {content}
                    </div>
                  )}
                  
                  {node.type === 'rect' && (
                    <div key={content} className={`w-full h-full text-sm flex items-center justify-center border-2 transition-all shadow-sm ${
                      activeNode === node.id ? 'ring-4 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)] z-10 scale-110 ' : ''
                    } ${
                      isFilled 
                        ? (isCorrect ? 'bg-white border-[#0ea5e9] text-sky-900 font-bold' : 'bg-red-50 border-red-500 text-red-700 font-bold animate-error-shake') 
                        : 'bg-white/80 border-sky-300 text-sky-400 border-dashed hover:bg-sky-50'
                    }`}>
                      {content}
                    </div>
                  )}

                  {node.type === 'diamond' && (
                    <div key={content} className={`relative w-full h-full flex items-center justify-center drop-shadow-sm transition-all ${
                      activeNode === node.id ? 'scale-110 z-10 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]' : ''
                    }`}>
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <polygon points="50,0 100,50 50,100 0,50" 
                          fill={isFilled ? (isCorrect ? '#bae6fd' : '#fef2f2') : 'rgba(255,255,255,0.8)'} 
                          stroke={activeNode === node.id ? '#ef4444' : isFilled ? (isCorrect ? '#0ea5e9' : '#ef4444') : '#7dd3fc'} 
                          strokeWidth={activeNode === node.id ? "4" : "2"} 
                          strokeDasharray={!isFilled ? "4 4" : "0"}
                          className="transition-all"
                        />
                      </svg>
                      <div className={`relative z-10 text-center px-4 text-sm transition-colors ${
                        isFilled 
                          ? (isCorrect ? 'text-sky-900 font-bold' : 'text-red-700 font-bold animate-error-shake') 
                          : 'text-sky-400'
                      }`}>
                        {content}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {showSuccess && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-2 border-sky-400 text-center z-50 animate-in zoom-in duration-500">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-sky-600 mb-2">拼图完成！</h2>
                <p className="text-slate-600">你已经掌握了单次冒泡的逻辑，<br/>现在点击左侧的“召唤卡牌”开始实战吧！</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AIAssistant triggerPrompt={aiPrompt} />
    </div>
  );
}
