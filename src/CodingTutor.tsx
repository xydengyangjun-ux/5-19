import React, { useState, useRef, useEffect } from 'react';

const API_KEY = 'sk-eb65e011c69a4e1cb667eecdfce990a8';
const BASE_URL = 'https://api.deepseek.com/chat/completions';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export default function CodingTutor() {
  const [code, setCode] = useState('# 在这里编写你的冒泡排序 Python 代码\narr = [5, 2, 8, 1, 9]\n\n');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: '你是一个温柔、鼓励人的AI编程助教。学生已经通过流程图学习了冒泡排序的逻辑，现在要用Python写出来。请你一步步引导他写代码，绝对不要直接给出完整的代码，每次只引导一行或一个逻辑块。特别注意：你需要引导学生使用 `for` 循环来实现冒泡排序，并在过程中用简单易懂的语言讲解 `for` 循环和 `range()` 函数的知识点。如果学生写错了，指出错误并启发他修改。如果学生问你代码怎么写，你要用反问或提示的方式引导他自己想出来。语言要简短、亲切（多用emoji），适合中小学生。当前学生的代码会附在每次提问的末尾供你参考。'
    },
    {
      role: 'assistant',
      content: '太棒了！你已经成功通关了流程图挑战 🎉 现在我们来把冒泡排序变成真正的 Python 代码吧！\n\n我已经帮你写好了一个测试数组 `arr`。根据我们刚才学的流程图，第一步我们需要一个外层循环来控制“轮数”。\n\n在 Python 中，我们通常用 `for` 循环来做这种有明确次数的重复动作。你知道怎么用 `for` 和 `range()` 来写一个循环吗？你可以先试着写写看，或者如果需要我给你讲讲 `for` 循环的魔法，随时告诉我哦！'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    // 将当前代码状态附加到发给大模型的 prompt 中，但不显示在 UI 上
    const codeContext = `\n\n[当前学生的代码状态]：\n\`\`\`python\n${code}\n\`\`\``;
    
    const userMsg: Message = { role: 'user', content: userText };
    const apiUserMsg: Message = { role: 'user', content: userText + codeContext };

    const newMessages = [...messages, userMsg];
    const apiMessages = [...messages, apiUserMsg];

    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: apiMessages.map(m => ({ role: m.role, content: m.content })),
          temperature: 0.7
        })
      });

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        const reply = data.choices[0].message.content;
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      } else {
        throw new Error('No choices in response');
      }
    } catch (error) {
      console.error('AI API Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: '哎呀，我的大脑暂时短路了，请稍后再试哦。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl h-[800px] flex flex-col md:flex-row gap-6 bg-slate-900/50 p-4 md:p-6 rounded-3xl border border-slate-700 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* 左侧：代码编辑器 */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e] rounded-2xl overflow-hidden border border-slate-600 shadow-inner">
        <div className="bg-[#2d2d2d] px-4 py-3 text-slate-300 text-sm font-mono flex justify-between items-center border-b border-slate-600">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">🐍</span>
            <span>bubble_sort.py</span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </div>
        <div className="flex-1 relative flex">
          {/* 简易行号 */}
          <div className="w-10 bg-[#1e1e1e] border-r border-slate-700 text-slate-500 text-right pr-2 py-4 font-mono text-sm select-none">
            {code.split('\n').map((_, i) => (
              <div key={i} className="leading-relaxed">{i + 1}</div>
            ))}
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 w-full bg-transparent text-green-400 font-mono p-4 outline-none resize-none leading-relaxed text-sm md:text-base whitespace-pre"
            spellCheck={false}
            placeholder="# 在这里编写 Python 代码..."
          />
        </div>
      </div>

      {/* 右侧：AI 助教聊天 */}
      <div className="w-full md:w-[400px] flex flex-col bg-slate-800 rounded-2xl overflow-hidden border border-sky-500/30 shadow-[0_0_20px_rgba(14,165,233,0.1)]">
        <div className="bg-gradient-to-r from-sky-900 to-indigo-900 px-4 py-4 border-b border-sky-500/30 flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-2xl shadow-lg border-2 border-sky-300">
            🤖
          </div>
          <div>
            <div className="font-bold text-sky-100 text-lg">AI 编程导师</div>
            <div className="text-xs text-sky-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              在线引导中
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-800/50">
          {messages.filter(m => m.role !== 'system').map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                msg.role === 'user' 
                  ? 'bg-sky-600 text-white rounded-tr-sm' 
                  : 'bg-slate-700 text-sky-50 rounded-tl-sm border border-slate-600'
              }`}>
                <div className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{msg.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-700 text-sky-50 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center border border-slate-600">
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-slate-800 border-t border-slate-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="告诉导师你的想法..."
              className="flex-1 bg-slate-900 text-white rounded-xl px-4 py-3 outline-none border border-slate-600 focus:border-sky-500 transition-colors shadow-inner"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 rounded-xl transition-all shadow-lg flex items-center justify-center shrink-0 font-bold"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
