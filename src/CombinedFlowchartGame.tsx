import React, { useState } from 'react';
import AIAssistant from './AIAssistant';

const EXPECTED_ANSWERS: Record<string, string> = {
  node1: '开始',
  node2: '轮数 n 设为 1',
  node3: '轮数 n < 6',
  node4: '当前位置为 1',
  node5: '当前位置 < 7 - n',
  node6: '当前数 > 右侧数',
  node7: '交换两个数位置',
  node8: '当前位置右移 1 位',
  node9: '已排序个数 n 加 1',
  node10: '按顺序输出 6 个数',
  node11: '结束',
};

const ITEMS = [
  '开始',
  '结束',
  '轮数 n 设为 1',
  '轮数 n < 6',
  '当前位置为 1',
  '当前位置 < 7 - n',
  '当前数 > 右侧数',
  '交换两个数位置',
  '当前位置右移 1 位',
  '已排序个数 n 加 1',
  '按顺序输出 6 个数',
];

const nodes = [
  { id: 'node1', type: 'pill', x: 350, y: 40, w: 120, h: 40 },
  { id: 'node2', type: 'rect', x: 350, y: 110, w: 160, h: 45 },
  { id: 'node3', type: 'diamond', x: 350, y: 200, w: 180, h: 70 },
  { id: 'node4', type: 'rect', x: 350, y: 300, w: 160, h: 45 },
  { id: 'node5', type: 'diamond', x: 350, y: 400, w: 200, h: 70 },
  { id: 'node6', type: 'diamond', x: 350, y: 510, w: 180, h: 70 },
  { id: 'node7', type: 'rect', x: 160, y: 590, w: 160, h: 45 },
  { id: 'node8', type: 'rect', x: 350, y: 670, w: 180, h: 45 },
  { id: 'node9', type: 'rect', x: 600, y: 400, w: 180, h: 45 },
  { id: 'node10', type: 'parallelogram', x: 350, y: 780, w: 200, h: 45 },
  { id: 'node11', type: 'pill', x: 350, y: 860, w: 120, h: 40 },
];

const PREFILLED_NODES = ['node1', 'node8', 'node9', 'node10', 'node11'];

interface Props {
  activeNode?: string | null;
  onCompleteChange?: (isComplete: boolean) => void;
}

export default function CombinedFlowchartGame({ activeNode, onCompleteChange }: Props) {
  const [placed, setPlaced] = useState<Record<string, string>>({
    node1: '开始',
    node8: '当前位置右移 1 位',
    node9: '已排序个数 n 加 1',
    node10: '按顺序输出 6 个数',
    node11: '结束',
  });
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState<{text: string; id: number} | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const isAllCorrect = Object.keys(EXPECTED_ANSWERS).every(
    key => placed[key] === EXPECTED_ANSWERS[key]
  );

  React.useEffect(() => {
    if (onCompleteChange) {
      onCompleteChange(isAllCorrect);
    }
    
    if (isAllCorrect) {
      setShowSuccessModal(true);
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowSuccessModal(false);
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
          text: `SYSTEM_HIDDEN: 学生刚刚把【${item}】拖到了错误的位置（正确答案应该是【${EXPECTED_ANSWERS[nodeId]}】）。请用一两句话启发他为什么不对，引导他思考完整的冒泡排序逻辑。`,
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
          <span className="mr-2">🧩</span> 终极挑战
        </h3>
        
        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800 leading-relaxed">
          <p className="font-bold mb-1">终极挑战：</p>
          <p className="text-purple-900 font-medium">请将内层循环（单次冒泡）和外层循环（多轮冒泡）整合到一张完整的流程图中！</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {availableItems.map((item, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              className="p-3 bg-white border-2 border-slate-200 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-purple-400 hover:shadow-md transition-all text-sm font-medium text-slate-700 text-center"
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
          <div className="relative w-[800px] h-[950px]" style={{ transform: 'scale(0.75)', transformOrigin: 'top center' }}>
            {/* SVG Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
                </marker>
              </defs>
              <g stroke="#a855f7" strokeWidth="2" fill="none" markerEnd="url(#arrow)">
                {/* 1 to 2 */}
                <line x1="350" y1="60" x2="350" y2="87.5" />
                {/* 2 to 3 */}
                <line x1="350" y1="132.5" x2="350" y2="165" />
                {/* 3 to 4 (Yes) */}
                <line x1="350" y1="235" x2="350" y2="277.5" />
                {/* 3 to 10 (No) */}
                <path d="M 440 200 L 780 200 L 780 757.5 L 460 757.5" />
                {/* 10 to 11 */}
                <line x1="350" y1="802.5" x2="350" y2="840" />
                {/* 4 to 5 */}
                <line x1="350" y1="322.5" x2="350" y2="365" />
                {/* 5 to 6 (Yes) */}
                <line x1="350" y1="435" x2="350" y2="475" />
                {/* 5 to 9 (No) */}
                <line x1="450" y1="400" x2="510" y2="400" />
                {/* 9 to loop back to 3 */}
                <path d="M 690 400 L 730 400 L 730 148 L 350 148" markerEnd="none" />
                <line x1="350" y1="148" x2="350" y2="165" />
                {/* 6 to 7 (Yes) */}
                <path d="M 260 510 L 160 510 L 160 567.5" />
                {/* 6 to merge (No) */}
                <path d="M 440 510 L 490 510 L 490 640 L 350 640" markerEnd="none" />
                {/* 7 to merge */}
                <path d="M 160 612.5 L 160 640 L 350 640" markerEnd="none" />
                {/* merge to 8 */}
                <line x1="350" y1="640" x2="350" y2="647.5" />
                {/* 8 to loop back to 5 */}
                <path d="M 350 692.5 L 350 720 L 60 720 L 60 343 L 350 343" markerEnd="none" />
                <line x1="350" y1="343" x2="350" y2="365" />
              </g>
              {/* Labels */}
              <text x="360" y="260" fill="#333" fontSize="12" fontWeight="bold">是</text>
              <text x="460" y="190" fill="#333" fontSize="12" fontWeight="bold">否</text>
              <text x="360" y="460" fill="#333" fontSize="12" fontWeight="bold">是</text>
              <text x="470" y="390" fill="#333" fontSize="12" fontWeight="bold">否</text>
              <text x="210" y="500" fill="#333" fontSize="12" fontWeight="bold">是</text>
              <text x="455" y="500" fill="#333" fontSize="12" fontWeight="bold">否</text>
            </svg>

            {/* Nodes */}
            {nodes.map(node => {
              const isFilled = !!placed[node.id];
              const isCorrect = placed[node.id] === EXPECTED_ANSWERS[node.id];
              const isPrefilled = PREFILLED_NODES.includes(node.id);
              const content = placed[node.id] || '拖拽至此';
              const isActive = activeNode === node.id;

              return (
                <div
                  key={node.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10 ${isFilled && !isPrefilled ? 'cursor-grab active:cursor-grabbing' : isPrefilled ? 'cursor-default' : 'cursor-pointer'} ${isActive ? 'ring-4 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)] scale-110 z-20 rounded-xl' : ''}`}
                  style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => {
                    if (!isPrefilled) handleDrop(e, node.id);
                  }}
                  onClick={() => {
                    if (isFilled && !isPrefilled) handleRemove(node.id);
                  }}
                  draggable={isFilled && !isPrefilled}
                  onDragStart={(e) => {
                    if (isFilled && !isPrefilled) {
                      handleDragStart(e, placed[node.id]);
                    } else {
                      e.preventDefault();
                    }
                  }}
                >
                  {node.type === 'pill' && (
                    <div key={content} className={`w-full h-full text-xs rounded-full flex items-center justify-center border-2 transition-all shadow-sm ${
                      isFilled 
                        ? (isCorrect ? 'bg-[#bbf7d0] border-green-500 text-green-800 font-bold' : 'bg-red-50 border-red-500 text-red-700 font-bold animate-error-shake') 
                        : 'bg-white/80 border-purple-300 text-purple-400 border-dashed hover:bg-purple-50'
                    }`}>
                      {content}
                    </div>
                  )}
                  
                  {node.type === 'rect' && (
                    <div key={content} className={`w-full h-full text-xs flex items-center justify-center border-2 transition-all shadow-sm ${
                      isFilled 
                        ? (isCorrect ? 'bg-white border-[#a855f7] text-purple-900 font-bold' : 'bg-red-50 border-red-500 text-red-700 font-bold animate-error-shake') 
                        : 'bg-white/80 border-purple-300 text-purple-400 border-dashed hover:bg-purple-50'
                    }`}>
                      {content}
                    </div>
                  )}

                  {node.type === 'parallelogram' && (
                    <div key={content} className={`relative w-full h-full flex items-center justify-center drop-shadow-sm transition-all`}>
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <polygon points="20,0 100,0 80,100 0,100" 
                          fill={isFilled ? (isCorrect ? '#f3e8ff' : '#fef2f2') : 'rgba(255,255,255,0.8)'} 
                          stroke={isFilled ? (isCorrect ? '#a855f7' : '#ef4444') : '#d8b4fe'} 
                          strokeWidth="2" 
                          strokeDasharray={!isFilled ? "4 4" : "0"}
                          className="transition-all"
                        />
                      </svg>
                      <div className={`relative z-10 text-center px-6 text-xs transition-colors ${
                        isFilled 
                          ? (isCorrect ? 'text-purple-900 font-bold' : 'text-red-700 font-bold animate-error-shake') 
                          : 'text-purple-400'
                      }`}>
                        {content}
                      </div>
                    </div>
                  )}

                  {node.type === 'diamond' && (
                    <div key={content} className={`relative w-full h-full flex items-center justify-center drop-shadow-sm transition-all`}>
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <polygon points="50,0 100,50 50,100 0,50" 
                          fill={isFilled ? (isCorrect ? '#f3e8ff' : '#fef2f2') : 'rgba(255,255,255,0.8)'} 
                          stroke={isFilled ? (isCorrect ? '#a855f7' : '#ef4444') : '#d8b4fe'} 
                          strokeWidth="2" 
                          strokeDasharray={!isFilled ? "4 4" : "0"}
                          className="transition-all"
                        />
                      </svg>
                      <div className={`relative z-10 text-center px-4 text-xs transition-colors ${
                        isFilled 
                          ? (isCorrect ? 'text-purple-900 font-bold' : 'text-red-700 font-bold animate-error-shake') 
                          : 'text-purple-400'
                      }`}>
                        {content}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {showSuccessModal && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-2 border-purple-400 text-center z-50 animate-in zoom-in duration-500">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-2xl font-bold text-purple-600 mb-2">太棒了！</h2>
                <p className="text-slate-600">你已经完全掌握了冒泡排序的完整逻辑！</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AIAssistant triggerPrompt={aiPrompt} />
    </div>
  );
}
