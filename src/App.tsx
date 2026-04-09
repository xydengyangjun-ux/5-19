import React, { useState, useEffect, useRef } from 'react';
import FlowchartGame from './FlowchartGame';
import OuterFlowchartGame from './OuterFlowchartGame';
import CombinedFlowchartGame from './CombinedFlowchartGame';
import CodingTutor from './CodingTutor';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const CARD_POOL = [
  { value: 1, pattern: '🦄', color: 'from-pink-400 to-rose-500', shadow: 'rgba(244,63,94,0.5)' },
  { value: 2, pattern: '🐉', color: 'from-red-500 to-orange-500', shadow: 'rgba(249,115,22,0.5)' },
  { value: 3, pattern: '🐸', color: 'from-green-400 to-emerald-600', shadow: 'rgba(16,185,129,0.5)' },
  { value: 4, pattern: '🦋', color: 'from-blue-400 to-indigo-500', shadow: 'rgba(99,102,241,0.5)' },
  { value: 5, pattern: '🦊', color: 'from-orange-400 to-amber-500', shadow: 'rgba(245,158,11,0.5)' },
  { value: 6, pattern: '🦉', color: 'from-stone-500 to-neutral-700', shadow: 'rgba(87,83,78,0.5)' },
  { value: 7, pattern: '🐙', color: 'from-purple-500 to-fuchsia-600', shadow: 'rgba(192,38,211,0.5)' },
  { value: 8, pattern: '🦀', color: 'from-rose-500 to-red-600', shadow: 'rgba(225,29,72,0.5)' },
  { value: 9, pattern: '🐢', color: 'from-teal-400 to-emerald-500', shadow: 'rgba(16,185,129,0.5)' },
  { value: 10, pattern: '🐳', color: 'from-cyan-400 to-blue-500', shadow: 'rgba(59,130,246,0.5)' },
];

interface CardData {
  id: string;
  value: number;
  pattern: string;
  color: string;
  shadow: string;
  index: number;
  isVisible: boolean;
}

export default function App() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [logs, setLogs] = useState<string[]>([
    '系统初始化完成...',
    '请点击“召唤卡牌”开始！'
  ]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const [hasDealt, setHasDealt] = useState(false);
  const [i, setI] = useState(0);
  const [j, setJ] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeIndices, setActiveIndices] = useState<number[]>([]);
  const [sortedIndices, setSortedIndices] = useState<number[]>([]);
  const [isManualComparing, setIsManualComparing] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [activeNode, _setActiveNode] = useState<string | null>('node1');
  const [flowchartLevel, setFlowchartLevel] = useState<1 | 2 | 3>(1);
  const [isFlowchart1Complete, setIsFlowchart1Complete] = useState(false);
  const [isFlowchart2Complete, setIsFlowchart2Complete] = useState(false);
  const [isFlowchart3Complete, setIsFlowchart3Complete] = useState(false);
  const [isCodingMode, setIsCodingMode] = useState(false);
  const [isAutoSorting, setIsAutoSorting] = useState(false);
  const [autoSortSpeed, setAutoSortSpeed] = useState<0.5 | 1>(1);

  const log = (message: string) => {
    setLogs(prev => [...prev, message.startsWith('>') ? message : `> ${message}`]);
  };

  const setActiveNode = (nodeId: string | null) => {
    _setActiveNode(nodeId);
    if (!nodeId) return;
    
    let stepName = '';
    if (flowchartLevel === 1) {
      const names: Record<string, string> = {
        node1: '开始',
        node2: '当前位置为 1',
        node3: '当前位置<6',
        node4: '当前数>右侧数',
        node5: '交换两个数位置',
        node6: '当前位置右移 1 位',
        node7: '结束',
      };
      stepName = names[nodeId];
    } else if (flowchartLevel === 2) {
      const names: Record<string, string> = {
        node1: '开始',
        node2: '轮数 i = 1',
        node3: 'i < 6',
        node4: '执行单次冒泡',
        node5: 'i = i + 1',
        node6: '结束',
      };
      stepName = names[nodeId];
    } else if (flowchartLevel === 3) {
      const names: Record<string, string> = {
        node1: '开始',
        node2: 'i = 1',
        node3: 'i < 6',
        node4: 'j = 1',
        node5: 'j < 6 - i',
        node6: '第 j 个数 > 第 j+1 个数',
        node7: '交换位置',
        node8: 'j = j + 1',
        node9: 'i = i + 1',
        node10: '结束',
      };
      stepName = names[nodeId];
    }
    
    if (stepName) {
      log(`📍 流程图执行到：【${stepName}】`);
    }
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [logs]);

  useEffect(() => {
    if (isAutoSorting && flowchartLevel === 2 && !isAnimating && isManualComparing) {
      const timer = setTimeout(() => {
        const card1 = cards.find(c => c.index === j);
        const card2 = cards.find(c => c.index === j + 1);
        if (card1 && card2) {
          if (card1.value > card2.value) {
            handleManualSwap();
          } else {
            handleNextCompare();
          }
        } else {
          handleNextCompare();
        }
      }, autoSortSpeed === 1 ? 600 : 1200);
      return () => clearTimeout(timer);
    }
  }, [isAutoSorting, flowchartLevel, isAnimating, isManualComparing, j, cards, autoSortSpeed]);

  const handleDeal = async (numCards: number = 8) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsAutoSorting(false);
    setActiveNode('node2');
    setHasDealt(false);
    setIsManualComparing(false);
    setCards([]);
    log('执行：🃏 召唤卡牌');

    // 随机抽取指定数量的不重复卡牌
    const shuffled = [...CARD_POOL].sort(() => Math.random() - 0.5).slice(0, numCards);
    const newCards = shuffled.map((c, idx) => ({
      ...c,
      id: Math.random().toString(),
      index: idx,
      isVisible: false
    }));
    
    setCards(newCards);
    setI(0); setJ(0); setSortedIndices([]); setActiveIndices([]);

    await sleep(300);

    // 从左到右依次发牌动画
    for (let k = 0; k < numCards; k++) {
      setCards(prev => prev.map((c, idx) => idx === k ? { ...c, isVisible: true } : c));
      log(`> 召唤：${newCards[k].pattern} 数值 ${newCards[k].value}`);
      await sleep(150);
    }

    setHasDealt(true);
    log('> 卡牌召唤完毕！');
    setIsManualComparing(true);
    setActiveIndices([0, 1]);
    setActiveNode(flowchartLevel === 3 ? 'node6' : 'node4');
    log(`> 正在比对第1位和第2位：${newCards[0].pattern}${newCards[0].value} 和 ${newCards[1].pattern}${newCards[1].value}`);
    log(`> 请判断是否需要交换？`);
    
    setIsAnimating(false);
    setShowStartModal(true);
  };

  const handleManualSwap = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    const card1 = cards.find(c => c.index === j)!;
    const card2 = cards.find(c => c.index === j + 1)!;
    
    if (card1.value <= card2.value) {
      log(`❌ 错误：${card1.value} 不大于 ${card2.value}，不需要交换！请直接点击“比较下一个数”。`);
      setHasError(true);
      await sleep(500);
      setHasError(false);
      setIsAnimating(false);
      return;
    }

    log(`> 正确！${card1.value} > ${card2.value}，执行【交换】！`);
    setActiveNode(flowchartLevel === 3 ? 'node7' : 'node5');
    
    setCards(prev => prev.map(c => {
      if (c.id === card1.id) return { ...c, index: j + 1 };
      if (c.id === card2.id) return { ...c, index: j };
      return c;
    }));
    
    await sleep(600);
    setIsAnimating(false);
  };

  const handleNextCompare = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    const card1 = cards.find(c => c.index === j)!;
    const card2 = cards.find(c => c.index === j + 1)!;

    if (card1.value > card2.value) {
      log(`❌ 错误：${card1.value} 大于 ${card2.value}，必须先执行【交换】！`);
      setHasError(true);
      await sleep(500);
      setHasError(false);
      setIsAnimating(false);
      return;
    }

    log(`> 操作正确！准备比较下一组...`);
    setActiveNode(flowchartLevel === 3 ? 'node8' : 'node6');
    await sleep(600);
    
    setActiveIndices([]);
    
    let nextJ = j + 1;
    let nextI = i;
    let newSorted = [...sortedIndices];

    if (nextJ >= cards.length - 1 - i) {
      newSorted.push(cards.length - 1 - i);
      nextJ = 0;
      nextI = i + 1;
      
      if (nextI === 1 && flowchartLevel === 1) {
        setFlowchartLevel(2);
        log('✨ 第一轮结束！进入第二轮，请完成外层循环流程图！');
      }
      
      if (nextI >= cards.length - 1) {
        newSorted.push(0);
        log('✨ 全部卡牌排列完毕！');
        setActiveNode(flowchartLevel === 3 ? 'node10' : 'node7');
        setI(nextI);
        setJ(nextJ);
        setSortedIndices(newSorted);
        setIsAnimating(false);
        setActiveIndices([]);
        setIsManualComparing(false);
        
        if (flowchartLevel === 2) {
          setFlowchartLevel(3);
          setIsAutoSorting(false);
          setTimeout(() => {
            log('✨ 排序完成！请整合内层循环和外层循环的流程图到一大张中！');
          }, 1000);
        }
        return;
      } else {
        log(`> 第 ${nextI} 轮探测结束，最大值已归位。`);
        setActiveNode(flowchartLevel === 3 ? 'node9' : (flowchartLevel === 1 ? 'node3' : 'node4'));
        await sleep(600);
        if (flowchartLevel === 3) {
           setActiveNode('node3');
           await sleep(600);
           setActiveNode('node4');
           await sleep(600);
        }
      }
    } else {
      setActiveNode(flowchartLevel === 3 ? 'node5' : 'node3');
      await sleep(600);
    }

    setJ(nextJ);
    setI(nextI);
    setSortedIndices(newSorted);
    setActiveIndices([nextJ, nextJ + 1]);

    const nextCard1 = cards.find(c => c.index === nextJ)!;
    const nextCard2 = cards.find(c => c.index === nextJ + 1)!;
    if (nextCard1 && nextCard2) {
      setActiveNode(flowchartLevel === 3 ? 'node6' : 'node4');
      log(`> 正在比对第${nextJ + 1}位和第${nextJ + 2}位：${nextCard1.pattern}${nextCard1.value} 和 ${nextCard2.pattern}${nextCard2.value}`);
      log(`> 请判断是否需要交换？`);
    }
    
    await sleep(300);
    setIsAnimating(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans flex flex-col items-center pt-2 pb-8 px-4 overflow-hidden">
      {/* 顶部导航 */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6 gap-4">
        <h1 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 drop-shadow-[0_0_15px_rgba(192,132,252,0.8)] tracking-wider text-center">
          {isCodingMode ? '💻 AI 编程实战' : '魔法卡牌对决：冒泡排序引擎'}
        </h1>
        {isCodingMode && (
          <button 
            onClick={() => setIsCodingMode(false)}
            className="px-6 py-2.5 rounded-lg font-bold bg-slate-700 hover:bg-slate-600 text-white border border-slate-500 transition-colors shrink-0"
          >
            返回流程图
          </button>
        )}
      </div>

      <div className={isCodingMode ? 'w-full flex justify-center' : 'hidden'}>
        <CodingTutor />
      </div>

      <div className={!isCodingMode ? `w-full flex gap-8 justify-center ${isAutoSorting ? 'flex-col xl:flex-row xl:items-start' : 'flex-col items-center'}` : 'hidden'}>
        {/* 上方：排序游戏区 */}
        <div className={`w-full flex flex-col items-center relative transition-all duration-500 ${isAutoSorting ? 'xl:w-1/2 xl:scale-90 xl:origin-top' : ''}`}>
          {/* 未完成流程图时的遮罩层 */}
          {((flowchartLevel === 1 && !isFlowchart1Complete) || (flowchartLevel === 2 && !isFlowchart2Complete) || (flowchartLevel === 3 && !isFlowchart3Complete)) && (
            <div className="absolute inset-0 z-30 bg-slate-900/60 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center border border-sky-500/30 shadow-[0_0_30px_rgba(14,165,233,0.2)]">
              <div className="text-6xl mb-4 animate-bounce">🧩</div>
              <h3 className="text-2xl font-bold text-sky-300 mb-2 drop-shadow-md text-center px-4">
                请先在下方完成流程图拼图
              </h3>
              <p className="text-sky-100/80 text-center px-4 max-w-sm">
                只有正确搭建冒泡排序的逻辑，魔法卡牌引擎才能启动！
              </p>
            </div>
          )}

          {/* 控制区 */}
          <div className="flex flex-wrap justify-center gap-4 mb-4 md:mb-6 w-full min-h-[50px]">
            {!hasDealt ? (
              <button onClick={() => handleDeal(8)} disabled={isAnimating || (flowchartLevel === 1 && !isFlowchart1Complete)} className="px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(245,158,11,0.8)] font-bold text-xl border border-orange-300/50 animate-bounce">
                🃏 召唤卡牌
              </button>
            ) : isManualComparing ? (
              flowchartLevel === 2 ? (
                <>
                  <button onClick={() => setIsAutoSorting(true)} disabled={isAnimating || isAutoSorting || !isFlowchart2Complete} className="px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(79,70,229,0.8)] font-semibold text-lg border border-indigo-400/30">
                    ▶️ 自动排序
                  </button>
                  <select 
                    value={autoSortSpeed} 
                    onChange={(e) => setAutoSortSpeed(Number(e.target.value) as 0.5 | 1)}
                    className="px-4 py-2 rounded-full border border-slate-300 bg-white text-slate-700 font-bold"
                    disabled={isAutoSorting}
                  >
                    <option value={1}>1.0x 速度</option>
                    <option value={0.5}>0.5x 速度</option>
                  </select>
                </>
              ) : (
                <>
                  <button onClick={handleManualSwap} disabled={isAnimating || (flowchartLevel === 1 && !isFlowchart1Complete) || (flowchartLevel === 2 && !isFlowchart2Complete)} className="px-6 py-3 rounded-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(234,88,12,0.8)] font-semibold text-lg border border-orange-400/30">
                    🔄 交换
                  </button>
                  <button onClick={handleNextCompare} disabled={isAnimating || (flowchartLevel === 1 && !isFlowchart1Complete) || (flowchartLevel === 2 && !isFlowchart2Complete)} className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(37,99,235,0.8)] font-semibold text-lg border border-blue-400/30">
                    ➡️ 比较下一个数
                  </button>
                </>
              )
            ) : (
              <>
                <button onClick={() => {
                  setHasDealt(false);
                  setCards([]);
                  setLogs(['系统已重置，请重新召唤卡牌！']);
                  setI(0);
                  setJ(0);
                  setSortedIndices([]);
                  setActiveIndices([]);
                  setIsManualComparing(false);
                  setActiveNode('node1');
                  setFlowchartLevel(1);
                  setIsFlowchart1Complete(false);
                  setIsFlowchart2Complete(false);
                  setIsFlowchart3Complete(false);
                  setIsCodingMode(false);
                }} disabled={isAnimating || (flowchartLevel === 1 && !isFlowchart1Complete)} className="px-6 py-3 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(71,85,105,0.8)] font-semibold text-lg border border-slate-500/30">
                  🔄 重新发牌
                </button>
              </>
            )}
          </div>

          {/* 核心舞台区：毛玻璃透明容器 */}
          <div id="active-cards-area" className="relative w-full max-w-4xl h-48 md:h-56 mb-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-x-auto overflow-y-hidden flex items-center justify-center">
            {/* 魔法阵装饰背景 */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
              <div className="w-40 h-40 rounded-full border-2 border-dashed border-purple-400 animate-[spin_20s_linear_infinite]"></div>
              <div className="absolute w-28 h-28 rounded-full border border-pink-400 animate-[spin_15s_linear_infinite_reverse]"></div>
            </div>

            <div className="relative w-full h-full max-w-[900px]" style={{ minWidth: cards.length > 6 ? '500px' : 'auto' }}>
              {cards.map((card) => {
                const offsetMultiplier = cards.length > 6 
                  ? (window.innerWidth < 768 ? 50 : 80) 
                  : (window.innerWidth < 768 ? 65 : 100);
                const offset = (card.index - (cards.length - 1) / 2) * offsetMultiplier; 
                const topPos = '50%';
                
                const isSorted = sortedIndices.includes(card.index);
                const isActive = activeIndices.includes(card.index);
                
                const sizeClasses = cards.length > 6
                  ? "w-[45px] h-[65px] md:w-[75px] md:h-[110px]"
                  : "w-[60px] h-[85px] md:w-[75px] md:h-[110px]";
                
                let cardClass = `absolute -translate-y-1/2 -translate-x-1/2 ${sizeClasses} rounded-xl md:rounded-2xl flex flex-col justify-between p-1 md:p-2 border-2 cursor-pointer text-white transition-all duration-500 ease-out bg-gradient-to-br ${card.color} `;
                
                if (!card.isVisible) {
                  cardClass += " opacity-0 scale-50 border-transparent";
                } else if (isActive) {
                  if (hasError) {
                    cardClass += " ring-4 ring-red-500 shadow-[0_0_30px_rgba(239,68,68,1)] scale-110 z-20 border-transparent animate-error-shake";
                  } else {
                    cardClass += " ring-4 ring-blue-400 shadow-[0_0_30px_rgba(96,165,250,1)] scale-110 z-20 border-transparent";
                  }
                } else if (isSorted) {
                  cardClass += " ring-4 ring-green-400 shadow-[0_0_20px_rgba(52,211,153,0.8)] z-10 border-transparent brightness-110";
                } else {
                  cardClass += " border-white/40 hover:scale-110 z-10";
                }
                
                return (
                  <div
                    key={card.id}
                    className={cardClass}
                    style={{
                      left: `calc(50% + ${offset}px)`,
                      top: topPos,
                      boxShadow: (!isActive && !isSorted && card.isVisible) ? `0 0 20px ${card.shadow}` : undefined
                    }}
                  >
                    <div className={`self-start leading-none ${cards.length > 6 ? 'text-xs md:text-base' : 'text-sm md:text-base'}`}>{card.pattern}</div>
                    <div className={`self-center font-black drop-shadow-md ${cards.length > 6 ? 'text-2xl md:text-4xl' : 'text-3xl md:text-4xl'}`}>{card.value}</div>
                    <div className={`self-end leading-none rotate-180 ${cards.length > 6 ? 'text-xs md:text-base' : 'text-sm md:text-base'}`}>{card.pattern}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 日志区：黑客终端面板 */}
          <div className="w-full max-w-4xl bg-[#050505] border border-green-500/30 rounded-xl p-4 md:p-5 h-36 md:h-40 overflow-y-auto font-mono text-green-400 text-sm md:text-base shadow-[inset_0_0_30px_rgba(0,255,0,0.05)] flex-grow-0 mb-8">
            <div className="mb-2 md:mb-3 text-green-600 border-b border-green-800/50 pb-2 flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                魔法引擎终端 v1.0.0
              </div>
              <div className="space-y-1.5">
                {logs.map((l, idx) => (
                  <div key={idx} className="leading-relaxed opacity-90">{l}</div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
        </div>

        {/* 下方：流程图游戏区 */}
        <div className={`w-full flex flex-col items-center relative transition-all duration-500 ${isAutoSorting ? 'xl:w-1/2 xl:scale-90 xl:origin-top' : ''}`}>
            {/* 连接虚线指示器 (仅在大屏幕显示) */}
            <div className="hidden xl:flex absolute left-1/2 -top-8 h-8 w-0 border-l-4 border-dashed border-sky-400 animate-pulse z-20">
              <div className="absolute -bottom-2.5 -left-2 text-sky-400 rotate-90">▶</div>
            </div>
            
            <div className="w-full bg-white rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(14,165,233,0.2)] border border-slate-700 flex flex-col h-[800px]">
              {flowchartLevel === 1 && (
                <FlowchartGame activeNode={hasDealt ? activeNode : null} onCompleteChange={setIsFlowchart1Complete} />
              )}
              {flowchartLevel === 2 && (
                <OuterFlowchartGame activeNode={hasDealt ? activeNode : null} onCompleteChange={setIsFlowchart2Complete} isAutoSorting={isAutoSorting} />
              )}
              {flowchartLevel === 3 && (
                <CombinedFlowchartGame 
                  activeNode={hasDealt ? activeNode : undefined} 
                  onCompleteChange={setIsFlowchart3Complete} 
                />
              )}
            </div>
            
            {isFlowchart3Complete && (
              <div className="mt-8 w-full flex justify-center">
                <button 
                  onClick={() => setIsCodingMode(true)} 
                  className="px-10 py-4 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 transition-all font-bold text-white text-xl shadow-[0_0_25px_rgba(168,85,247,0.6)] animate-bounce"
                >
                  💻 进入代码实战
                </button>
              </div>
            )}
          </div>
      </div>

      {/* 规则弹窗 */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-purple-500/50 rounded-2xl p-8 max-w-md w-full shadow-[0_0_40px_rgba(168,85,247,0.4)] transform transition-all animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6 text-center drop-shadow-md">
              ✨ 魔法排序开始
            </h2>
            <div className="text-slate-200 space-y-4 mb-8 text-lg font-medium text-center">
              <p>请操作卡牌进行冒泡排序！</p>
              <p className="text-sm text-slate-400">所有卡牌排序完成后，我们将进入流程图挑战。</p>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setShowStartModal(false);
                  log('> 请点击“单步探测”或“自动魔法”开始！');
                }}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(219,39,119,0.6)]"
              >
                开始操作
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
