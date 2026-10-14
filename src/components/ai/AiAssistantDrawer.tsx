import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Zap,
  HelpCircle,
  FileText,
  DollarSign,
  Bot,
  User,
} from 'lucide-react';
import { Proposal, Customer } from '../../types';
import { askGeminiAssistant } from '../../services/api';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal;
  customer: Customer;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  proposal,
  customer,
}) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; isSimulated?: boolean }[]>([
    {
      role: 'assistant',
      content: `Hello! I'm SolarPitch AI. I have full context on the current proposal for ${customer.fullName} (${proposal.design.dcSystemSizeKw} kW DC, ${proposal.design.estimatedAnnualKwh} kWh/yr). How can I assist with client explanations, sizing rationale, or financing comparisons?`,
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputPrompt;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: 'user' as const, content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    const context = {
      customerName: customer.fullName,
      propertyAddress: customer.propertyAddress,
      utility: customer.utilityProvider,
      annualUsageKWh: customer.annualConsumptionKWh,
      dcSystemSizeKw: proposal.design.dcSystemSizeKw,
      panelCount: proposal.design.panelCount,
      estimatedAnnualKwh: proposal.design.estimatedAnnualKwh,
      offsetPercent: proposal.design.consumptionOffsetPercent,
      preTaxPrice: proposal.pricing.netPreTaxPrice,
      totalCustomerPrice: proposal.pricing.totalCustomerPrice,
    };

    const result = await askGeminiAssistant(textToSend, context);
    setLoading(false);

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: result.reply,
        isSimulated: result.isSimulated,
      },
    ]);
  };

  const quickQuestions = [
    'Explain how Alberta Solar Club high export tariffs work for this customer',
    'Draft a 2-paragraph personalized proposal cover letter for Alex Morgan',
    'Compare the Canada Greener Homes 0% loan vs paying cash',
    'Why is a 4.5 kW DC system with 9 panels optimal for 5,400 kWh annual usage?',
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-96 max-w-full bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col text-xs">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center font-bold text-slate-950">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold text-xs">SolarPitch AI Copilot</div>
            <div className="text-[10px] text-slate-400 font-mono">Gemini 3.8 Flash Assistant</div>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Proposal Context Pill */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
        <span className="truncate">Context: {customer.fullName} ({proposal.design.dcSystemSizeKw} kW)</span>
        <span className="font-mono text-emerald-700 font-semibold">{proposal.design.consumptionOffsetPercent}% Offset</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-xl leading-relaxed ${
                m.role === 'user'
                  ? 'bg-slate-900 text-white font-medium'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              <div className="text-[10px] font-semibold text-slate-400 mb-0.5">
                {m.role === 'user' ? 'You' : 'SolarPitch Assistant'}
              </div>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
            {m.isSimulated && (
              <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                Simulated response (Gemini API key fallback)
              </span>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-[11px] p-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Analyzing proposal metrics with Gemini...</span>
          </div>
        )}
      </div>

      {/* Quick Suggestions */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-1.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
          Quick Prompts
        </span>
        <div className="flex flex-col gap-1">
          {quickQuestions.slice(0, 2).map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="text-left text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 p-1.5 rounded transition-colors truncate"
            >
              • {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask questions about this solar proposal..."
            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-50"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || loading}
            className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
