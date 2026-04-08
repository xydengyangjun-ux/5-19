import React, { useState, useEffect, useRef } from 'react';

const API_KEY = 'sk-eb65e011c69a4e1cb667eecdfce990a8';
const BASE_URL = 'https://api.deepseek.com/chat/completions';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface Props {
  triggerPrompt: { text: string; id: number } | null;
}

export default function AIAssistant({ triggerPrompt }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'system', 
      content: '你是一个温柔、鼓励人的AI编程助教。当前学生正在学习"冒泡排序"的流程图。请你根据冒泡排序的原理，用启发式的问题引导学生思考，不要直接给出正确答案。语言要简短、亲切（多用emoji），适合中小学生。' 
    },
    { 
      role: 'assistant', 
      content: '你好！我是你的AI伴学助手🤖。在搭建流程图时遇到困难可以随时问我哦！' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (triggerPrompt) {
      setIsOpen(true);
      handleSend(triggerPrompt.text, true);
    }
  }, [triggerPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string, isHidden = false) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];

    if (!isHidden) {
      setMessages(newMessages);
      setInput('');
    } else {
      setMessages(newMessages);
    }

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
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.content.replace('SYSTEM_HIDDEN: ', '')
          })),
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
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute bottom-6 right-6 w-14 h-14 bg-sky-500 text-white rounded-full shadow-lg hover:bg-sky-600 transition-all z-50 flex items-center justify-center text-2xl hover:scale-110 border-2 border-white"
          title="召唤AI助教"
        >
          🤖
        </button>
      )}

      {isOpen && (
        <div className="absolute bottom-6 right-6 w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-sky-100 overflow-hidden animate-in slide-in-from-bottom-10">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-500 to-blue-500 p-4 flex justify-between items-center text-white shadow-md z-10">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <span className="font-bold">AI 伴学助教</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors text-xl"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.filter(m => m.role !== 'system' && !m.content.startsWith('SYSTEM_HIDDEN:')).map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-sky-500 text-white rounded-tr-sm shadow-md' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 text-slate-500 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend(input)}
              placeholder="遇到问题？问问我吧..."
              className="flex-1 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 bg-slate-50"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 bg-sky-500 text-white rounded-full flex items-center justify-center hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
