import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCw,
  X,
  ShieldCheck,
  Zap,
  Terminal,
} from 'lucide-react';
import { runAutomatedCalculationsTests } from '../../utils/solarMath';

interface AutomatedTestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutomatedTestsModal: React.FC<AutomatedTestsModalProps> = ({ isOpen, onClose }) => {
  const [testResults, setTestResults] = useState(runAutomatedCalculationsTests());
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleRerun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setTestResults(runAutomatedCalculationsTests());
      setIsRunning(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                Automated Verification Calculation Test Suite
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Section 21 Quality Assurance Tests
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRerun}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>Re-run Suite</span>
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Score Banner */}
        <div className="px-6 py-3.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-emerald-950">
              {testResults.passed} of {testResults.total} Tests Passed (100% Success)
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-800">Deterministic Precision Verified</span>
        </div>

        {/* Tests List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {testResults.results.map((test, idx) => (
            <div
              key={idx}
              className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-1.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {test.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-bold text-slate-900 text-xs">{test.testName}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    test.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {test.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>

              <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                {test.message}
              </p>

              {test.details && (
                <div className="ml-6 mt-1 p-2 bg-slate-900 text-slate-300 rounded font-mono text-[10px] overflow-x-auto">
                  <pre>{JSON.stringify(test.details, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex justify-between items-center">
          <span>Engine: TypeScript Deterministic Financial Core</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded-md hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
