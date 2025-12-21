
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { ChevronLeft, CheckCircle2, X, Plus, Trophy, Home, Download, Loader2, CloudUpload, Check, AlertCircle, PlusCircle, Search, ArrowRight, Sparkles, Send, Info, BarChart2, Terminal, Play, Copy, Flame, Minus, Circle, Activity, Trash2, Edit3 } from 'lucide-react';
import { BodyPart, Exercise, ViewState, SetLog, AIWorkoutPlan, AIPlanDetails } from './types';
import { BODY_PARTS, EXERCISES, SYSTEM_PROMPT } from './data';
import { supabase } from './supabaseClient';
import { GoogleGenAI } from "@google/genai";

// --- Utility Components ---

const Header = ({ 
  title, 
  onBack, 
  showBack,
  action
}: { 
  title: string; 
  onBack?: () => void; 
  showBack?: boolean;
  action?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between px-6 py-5 sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md border-b border-slate-100/50">
    <div className="w-16 flex justify-start">
      {showBack && (
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-slate-800" />
        </button>
      )}
    </div>
    <h1 className="text-lg font-semibold text-slate-800 tracking-tight text-center truncate flex-1">{title}</h1>
    <div className="w-16 flex justify-end items-center">
      {action}
    </div>
  </div>
);

// --- Loading Logger Component ---

const LoadingLogger = ({ logs }: { logs: string[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[60vh] border border-slate-700">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
            <div className="flex items-center gap-3">
                <Loader2 className="text-blue-500 animate-spin" size={20} />
                <span className="text-slate-200 font-mono font-bold tracking-tight">Gemini AI Agent Working...</span>
            </div>
            <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
            </div>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 font-mono text-xs md:text-sm text-slate-300 space-y-3 bg-[#0f172a]">
            {logs.map((log, i) => (
                <div key={i} className="break-words whitespace-pre-wrap leading-relaxed border-l-2 border-slate-700 pl-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {log}
                </div>
            ))}
            <div className="h-4" /> 
        </div>
      </div>
    </div>
  )
};

// --- Picker Components ---

const WeightPicker = ({
  initialWeight,
  onConfirm,
  onClose
}: {
  initialWeight: number;
  onConfirm: (val: number) => void;
  onClose: () => void;
}) => {
  const [weight, setWeight] = useState(initialWeight);

  const adjust = (amount: number) => {
    setWeight(prev => {
        const newVal = prev + amount;
        return newVal < 0 ? 0 : Math.round(newVal * 10) / 10;
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 relative z-10 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">调整重量</h3>
            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
        </div>

        <div className="flex flex-col items-center mb-8">
            <div className="text-6xl font-bold text-slate-800 mb-2">{weight}</div>
            <div className="text-sm font-medium text-slate-400">KG</div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
            <button onClick={() => adjust(-5)} className="py-4 rounded-xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200">-5</button>
            <button onClick={() => adjust(-2.5)} className="py-4 rounded-xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200">-2.5</button>
            <button onClick={() => adjust(2.5)} className="py-4 rounded-xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200">+2.5</button>
            <button onClick={() => adjust(5)} className="py-4 rounded-xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200">+5</button>
            
            <button onClick={() => adjust(-1)} className="py-4 rounded-xl bg-slate-50 font-medium text-slate-500 hover:bg-slate-100">-1</button>
             <div className="col-span-2"></div>
            <button onClick={() => adjust(1)} className="py-4 rounded-xl bg-slate-50 font-medium text-slate-500 hover:bg-slate-100">+1</button>
        </div>

        <button 
          onClick={() => { onConfirm(weight); onClose(); }}
          className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl text-lg active:scale-95 transition-transform"
        >
            确定
        </button>
      </motion.div>
    </div>
  );
};

const RepsPicker = ({
  initialReps,
  onConfirm,
  onClose
}: {
  initialReps: number;
  onConfirm: (val: number) => void;
  onClose: () => void;
}) => {
  const options = Array.from({ length: 18 }, (_, i) => i + 3); // 3 to 20

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 relative z-10 shadow-2xl max-h-[80vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">选择次数</h3>
            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
        </div>

        <div className="grid grid-cols-4 gap-3 overflow-y-auto no-scrollbar pb-safe">
            {options.map(num => (
                <button
                    key={num}
                    onClick={() => { onConfirm(num); onClose(); }}
                    className={`py-4 rounded-xl font-bold text-xl transition-all ${
                        num === initialReps 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' 
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                    {num}
                </button>
            ))}
        </div>
      </motion.div>
    </div>
  );
};

const RpePicker = ({
  initialRpe,
  onConfirm,
  onClose
}: {
  initialRpe?: number;
  onConfirm: (val: number) => void;
  onClose: () => void;
}) => {
  const options = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 relative z-10 shadow-2xl max-h-[80vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">选择 RPE (自觉强度)</h3>
            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
        </div>

        <div className="grid grid-cols-5 gap-3 pb-safe">
            {options.map(num => (
                <button
                    key={num}
                    onClick={() => { onConfirm(num); onClose(); }}
                    className={`py-4 rounded-xl font-bold text-xl transition-all ${
                        num === initialRpe 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' 
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                    {num}
                </button>
            ))}
        </div>
      </motion.div>
    </div>
  );
};

const NotePicker = ({
  initialNote,
  onConfirm,
  onClose
}: {
  initialNote?: string;
  onConfirm: (val: string) => void;
  onClose: () => void;
}) => {
  const [note, setNote] = useState(initialNote || '');
  const presets = ['热身', '控制', '主力', '慢放'];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 relative z-10 shadow-2xl max-h-[80vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">选择节奏</h3>
            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
            {presets.map(p => (
                <button
                    key={p}
                    onClick={() => setNote(p)}
                    className={`px-4 py-3 rounded-xl font-bold text-sm transition-all border ${
                        note === p 
                        ? 'bg-slate-800 text-white border-slate-800' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    {p}
                </button>
            ))}
        </div>

        <div className="mb-6">
             <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="自定义节奏..."
                className="w-full px-4 py-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-medium"
             />
        </div>

        <button 
          onClick={() => { onConfirm(note); onClose(); }}
          className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl text-lg active:scale-95 transition-transform"
        >
            确定
        </button>
      </motion.div>
    </div>
  );
};

const FatigueModal = ({
    onConfirm,
    loading
}: {
    onConfirm: (score: number) => void;
    loading: boolean;
}) => {
    const [score, setScore] = useState<number | null>(null);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl text-center"
            >
                <h3 className="text-xl font-bold text-slate-800 mb-2">本次训练疲劳度</h3>
                <p className="text-slate-500 text-sm mb-6">请根据身体感受打分 (5-10)</p>
                
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[5, 6, 7, 8, 9, 10].map(num => (
                        <button
                            key={num}
                            onClick={() => setScore(num)}
                            className={`py-4 rounded-xl font-bold text-xl transition-all border ${
                                score === num 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105' 
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {num}
                        </button>
                    ))}
                </div>

                <div className="space-y-2">
                    <button
                        onClick={() => score && onConfirm(score)}
                        disabled={!score || loading}
                        className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
                    >
                        {loading ? <Loader2 className="animate-spin mx-auto"/> : '提交并结束'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// --- View Components ---

const HomeView = ({ 
  onSelect,
}: { 
  onSelect: (part: BodyPart) => void;
}) => {
  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-slate-800 mb-4 text-center"
        >
          今天练哪里?
        </motion.h2>
        
        <div className="w-full max-w-md flex flex-wrap justify-center gap-6 mb-8">
          {BODY_PARTS.map((part, index) => (
            <motion.button
              key={part.id}
              onClick={() => onSelect(part)}
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: index * 0.4, 
              }}
              whileTap={{ 
                scale: 0.9, 
                transition: { type: "spring", stiffness: 400, damping: 10 } 
              }}
              whileHover={{ scale: 1.05 }}
              className={`
                relative w-36 h-36 rounded-[2.5rem] 
                flex items-center justify-center 
                shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)]
                border border-white/50
                backdrop-blur-sm
                ${part.color}
                bg-opacity-20 bg-white
              `}
              style={{
                background: "rgba(255, 255, 255, 0.6)",
              }}
            >
              <div className={`absolute inset-0 opacity-20 rounded-[2.5rem] ${part.color.split(' ')[0]}`} />
              <span className="text-2xl font-bold z-10 tracking-widest">{part.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

const SurveyModal = ({
  bodyPart,
  onClose,
  onGenerate,
  loading
}: {
  bodyPart: BodyPart;
  onClose: () => void;
  onGenerate: (data: any) => void;
  loading: boolean;
}) => {
  const [formData, setFormData] = useState<{
    sleep: string;
    diet: string;
    doms: string;
    stress: string;
    domsPart?: string;
    otherActivity: string;
  }>({
    sleep: '好',
    diet: '正常',
    doms: '无感',
    stress: '放松',
    domsPart: '',
    otherActivity: '无'
  });

  const handleOptionChange = (key: keyof typeof formData, value: string) => {
    setFormData(prev => {
        const newData = { ...prev, [key]: value };
        // Reset domsPart if DOMS becomes None
        if (key === 'doms' && value === '无感') {
            newData.domsPart = '';
        }
        return newData;
    });
  };

  const handleConfirm = () => {
    onGenerate(formData);
  };

  const renderOption = (key: keyof typeof formData, label: string, value: string) => {
    const isSelected = formData[key] === value;
    return (
      <button
        onClick={() => handleOptionChange(key, value)}
        className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
          isSelected
            ? 'bg-slate-800 text-white border-slate-800 shadow-md'
            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex-shrink-0">
          <h3 className="text-xl font-bold text-slate-800 text-center">今日状态检查</h3>
          <p className="text-slate-400 text-sm text-center mt-1">为 {bodyPart.name}部训练调整强度</p>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto no-scrollbar flex-1">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-indigo-500"/> 睡眠质量
            </label>
            <div className="flex gap-2">
              {renderOption('sleep', '差 (Poor)', '差')}
              {renderOption('sleep', '一般 (Normal)', '一般')}
              {renderOption('sleep', '好 (Excel)', '好')}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
               <span className="w-1 h-4 rounded-full bg-green-500"/> 饮食/碳水
            </label>
            <div className="flex gap-2">
              {renderOption('diet', '少 (Poor)', '少')}
              {renderOption('diet', '正常 (Normal)', '正常')}
              {renderOption('diet', '多 (Excel)', '多')}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-rose-500"/> 肌肉酸痛 (DOMS)
            </label>
            <div className="flex gap-2">
              {renderOption('doms', '严重', '严重')}
              {renderOption('doms', '轻微', '轻微')}
              {renderOption('doms', '无感', '无感')}
            </div>
            
            {/* Conditional Body Part Selection for DOMS */}
            {formData.doms !== '无感' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-1 overflow-hidden"
                >
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                        <p className="text-xs font-bold text-rose-400 mb-2 uppercase tracking-wide">哪个部位酸痛?</p>
                        <div className="flex flex-wrap gap-2">
                            {BODY_PARTS.map((part) => (
                                <button
                                key={part.id}
                                onClick={() => handleOptionChange('domsPart', part.name)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                    formData.domsPart === part.name
                                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200'
                                    : 'bg-white text-rose-400 border-rose-200 hover:bg-white/80'
                                }`}
                                >
                                {part.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
          </div>

           <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-orange-500"/> 压力水平
            </label>
            <div className="flex gap-2">
              {renderOption('stress', '大', '大')}
              {renderOption('stress', '轻微', '轻微')}
              {renderOption('stress', '放松', '放松')}
            </div>
          </div>

           <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-cyan-500"/> 其他运动计划
            </label>
            <div className="flex flex-col gap-2">
              {renderOption('otherActivity', '无 (None)', '无')}
              {renderOption('otherActivity', '健身前打了羽毛球', '健身前打了羽毛球')}
              {renderOption('otherActivity', '健身后要打羽毛球', '健身后要打羽毛球')}
            </div>
          </div>

          <div className="pt-4 pb-2">
             <button 
               onClick={handleConfirm}
               disabled={loading}
               className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
             >
               {loading ? (
                 <>
                  <Loader2 className="animate-spin" />
                  <span>生成计划中...</span>
                 </>
               ) : (
                 <span>下一步</span>
               )}
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const PlanDetailsModal = ({
  details,
  onClose
}: {
  details: AIPlanDetails;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="bg-slate-800 p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/10 rounded-full">
               <BarChart2 size={24} className="text-blue-300" />
             </div>
             <div>
               <h3 className="text-xl font-bold">训练计划详情</h3>
               <p className="text-slate-400 text-xs">Generated by Gemini 3 Pro</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50 flex-1">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">训练概述</h4>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">{details.summary}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">疲劳与调整</h4>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">{details.adjustments || "无特殊调整"}</p>
          </div>
          
          {details.feedbackRequired.length > 0 && (
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">课后关注点</h4>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                {details.feedbackRequired.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
             <div className="flex items-center justify-between mb-2">
                 <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">完整 AI 回复</h4>
                 <button 
                   onClick={() => navigator.clipboard.writeText(details.rawContent)}
                   className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                 >
                   <Copy size={12}/> 复制
                 </button>
             </div>
             <pre className="text-xs text-slate-600 whitespace-pre-wrap overflow-x-auto font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-64 overflow-y-auto">
               {details.rawContent}
             </pre>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ExerciseListView = ({ 
  bodyPart, 
  exercises,
  onSelect, 
  onBack,
  onFinishWorkout,
  onAddExerciseClick,
  completedIds,
  planDetails,
  onShowDetails,
  isFinishing,
  onDelete
}: { 
  bodyPart: BodyPart; 
  exercises: Exercise[];
  onSelect: (ex: Exercise) => void;
  onBack: () => void;
  onFinishWorkout: () => void;
  onAddExerciseClick: () => void;
  completedIds: string[];
  planDetails?: AIPlanDetails;
  onShowDetails?: () => void;
  isFinishing: boolean;
  onDelete: (id: string) => void;
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <Header 
        title={`${bodyPart.name}部训练`} 
        showBack 
        onBack={onBack} 
        action={
          planDetails && (
            <button 
              onClick={onShowDetails}
              className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg flex items-center gap-1 active:scale-95 transition-transform"
            >
              <Info size={14} />
              详情
            </button>
          )
        }
      />
      
      <div className="flex-1 overflow-y-auto px-4 pb-4 no-scrollbar">
        <div className="space-y-3 pt-2 pb-24">
          {exercises.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
               <p>暂无该部位的动作记录</p>
               <p className="text-sm mt-2">点击下方按钮添加动作</p>
            </div>
          ) : (
            exercises.map((ex, index) => {
              const isCompleted = completedIds.includes(ex.id);

              return (
                <motion.div
                  key={ex.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`w-full bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group relative overflow-hidden`}
                >
                  <button
                    onClick={() => onSelect(ex)}
                    className="flex-1 p-5 flex items-center gap-4 text-left active:bg-slate-50 transition-colors"
                  >
                    <CheckCircle2 
                      size={24} 
                      className={`${isCompleted ? "text-green-500 fill-green-50" : "text-slate-200"}`}
                    />
                    
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-lg font-medium text-slate-700 capitalize text-left truncate">
                          {ex.name}
                        </span>
                      </div>
                    </div>
                  </button>
                  
                  <div className="flex items-center gap-1 pr-4">
                     <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(ex.id);
                        }}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors z-20"
                     >
                        <Trash2 size={18} />
                     </button>
                     <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 group-hover:text-blue-500 transition-colors pointer-events-none">
                        <ChevronLeft className="w-5 h-5 rotate-180" />
                     </div>
                  </div>
                </motion.div>
              );
            })
          )}
          
          <motion.button
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: exercises.length * 0.05 }}
             onClick={onAddExerciseClick}
             className="w-full py-5 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-100/50 transition-all"
          >
             <PlusCircle size={20} />
             <span className="font-medium">添加动作</span>
          </motion.button>
        </div>
      </div>

      <div className="bg-white border-t border-slate-100 p-4 pb-8 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-20">
        <button
          onClick={onFinishWorkout}
          disabled={isFinishing}
          className="w-full py-4 bg-slate-800 text-white text-lg font-semibold rounded-2xl shadow-lg shadow-slate-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isFinishing ? (
             <>
               <Loader2 className="animate-spin" />
               <span>保存记录中...</span>
             </>
          ) : (
            <>
              <Trophy size={20} className="text-yellow-400" />
              <span>完成今日训练</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const SetItem: React.FC<{ 
    item: SetLog, 
    onDelete: () => void, 
    onOpenPicker: (type: 'weight' | 'reps' | 'rpe' | 'note', id: string, val: number | string) => void
}> = ({ item, onDelete, onOpenPicker }) => {
    return (
        <Reorder.Item value={item} id={item.id} className="flex items-center gap-2 mb-3 cursor-grab active:cursor-grabbing">
            <div className="w-6 flex justify-center text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            </div>
            <div className="flex-1 flex gap-2 overflow-hidden">
                <div className="flex-[1.2] relative min-w-0">
                    <button
                        onClick={() => onOpenPicker('weight', item.id, item.weight)}
                        className="w-full bg-slate-100 rounded-xl px-2 py-3 text-center font-bold text-slate-700 hover:bg-slate-200 active:bg-slate-300 transition-colors truncate"
                    >
                        {item.weight || 0}
                    </button>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium pointer-events-none">KG</span>
                </div>
                <div className="flex-1 relative min-w-0">
                    <button
                        onClick={() => onOpenPicker('reps', item.id, item.reps)}
                        className="w-full bg-slate-100 rounded-xl px-2 py-3 text-center font-bold text-slate-700 hover:bg-slate-200 active:bg-slate-300 transition-colors truncate"
                    >
                        {item.reps || 0}
                    </button>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium pointer-events-none">次</span>
                </div>
                <div className="flex-[1.2] relative min-w-0">
                    <button
                        onClick={() => onOpenPicker('note', item.id, item.note || '')}
                        className={`w-full rounded-xl px-2 py-3 text-center font-bold text-xs truncate transition-colors ${
                            item.note 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-slate-50 text-slate-300'
                        }`}
                    >
                        {item.note || '节奏'}
                    </button>
                </div>
                <div className="flex-1 relative min-w-0">
                    <button
                        onClick={() => onOpenPicker('rpe', item.id, item.rpe || 0)}
                        className="w-full bg-slate-100 rounded-xl px-2 py-3 text-center font-bold text-slate-700 hover:bg-slate-200 active:bg-slate-300 transition-colors truncate"
                    >
                        {item.rpe || '-'}
                    </button>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium pointer-events-none">RPE</span>
                </div>
            </div>
            <button
                onClick={onDelete}
                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all flex-shrink-0"
            >
                <X size={18} />
            </button>
        </Reorder.Item>
    );
};

// --- Fallback Generator for Offline Mode ---
const generateFallbackPlan = (part: BodyPart): { exercises: Exercise[], logs: Record<string, SetLog[]>, details: AIPlanDetails } => {
    const availableExercises = EXERCISES[part.id] || [];
    const count = Math.min(availableExercises.length, 4);
    const shuffled = [...availableExercises].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    const exercises: Exercise[] = [];
    const logs: Record<string, SetLog[]> = {};

    exercises.push({
        id: 'fallback_warmup',
        name: '热身环节',
        bodyPartId: part.id,
        warmupDetails: [
            { action: '动态拉伸', reps: '30秒', note: '激活' },
            { action: '小重量预热', reps: '15次', note: '轻重量' }
        ]
    });

    selected.forEach((ex, idx) => {
        const exId = `fallback_ex_${idx}`;
        exercises.push({
            id: exId,
            name: ex.name,
            bodyPartId: part.id,
            suggestion: {
                sets: "4组",
                reps: "8-12次",
                weight: "适中",
                reasoning: "离线模式默认计划"
            }
        });

        logs[exId] = Array(4).fill(0).map((_, i) => ({
            id: `fb_${exId}_${i}`,
            weight: 0,
            reps: 0,
            rpe: 0
        }));
    });

    return {
        exercises,
        logs,
        details: {
            summary: "⚠️ 无法连接 AI 建议模型。已为您生成本地基础训练模版。",
            adjustments: "请根据自身状态手动调整重量。",
            feedbackRequired: [],
            rawContent: "Local Fallback Mode"
        }
    };
};

// --- Main App Component ---

const App = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  
  const [currentExercises, setCurrentExercises] = useState<Exercise[]>([]);
  const [sessionLogs, setSessionLogs] = useState<Record<string, SetLog[]>>({});
  
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyBodyPart, setSurveyBodyPart] = useState<BodyPart | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState<string[]>([]);
  
  const [aiPlanDetails, setAIPlanDetails] = useState<AIPlanDetails | null>(null);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  
  const [isFinishing, setIsFinishing] = useState(false);
  const [showFatigueModal, setShowFatigueModal] = useState(false);

  const [logs, setLogs] = useState<SetLog[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  
  const [pickerState, setPickerState] = useState<{
      isOpen: boolean;
      type: 'weight' | 'reps' | 'rpe' | 'note';
      setId: string;
      value: number | string;
  } | null>(null);

  useEffect(() => {
    if (view === 'SESSION' && selectedExercise) {
      if (sessionLogs[selectedExercise.id]) {
        setLogs(sessionLogs[selectedExercise.id]);
      } else {
        setLogs([{ id: String(Date.now()), weight: 0, reps: 0 }]);
      }
    }
  }, [view, selectedExercise]);

  const addLog = (message: string) => {
    setLoadingLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const fetchHistoryContext = async (bodyPartId: string, addLogCallback: (msg: string) => void) => {
    try {
        const { data: rawTargetLogs, error: targetError } = await supabase
            .from('workout_logs')
            .select('*')
            .eq('body_part', bodyPartId) 
            .order('date', { ascending: false })
            .limit(20);

        if (targetError) {
             addLogCallback(`❌ 数据库错误 (Target): ${targetError.message}`);
        } else {
             if (!rawTargetLogs || rawTargetLogs.length === 0) {
                 addLogCallback(`⚠️ 未找到同部位历史数据 (ID: ${bodyPartId})`);
             } else {
                 addLogCallback(`✅ 成功获取 ${rawTargetLogs.length} 条同部位记录`);
             }
        }

        const groupedTargetLogs = (rawTargetLogs || []).reduce((acc: any[], curr) => {
            const date = curr.date;
            let session = acc.find(s => s.date === date);
            if (!session) {
                session = { date, exercises: [] };
                acc.push(session);
            }
            session.exercises.push({
                name: curr.exercise,
                sets: curr.sets
            });
            return acc;
        }, []).slice(0, 4);

        const { data: rawOtherLogs, error: otherError } = await supabase
            .from('workout_logs')
            .select('*')
            .neq('body_part', bodyPartId)
            .order('date', { ascending: false })
            .limit(20);

        if (otherError) {
             addLogCallback(`❌ 数据库错误 (Other): ${otherError.message}`);
        } else {
             addLogCallback(`✅ 成功获取 ${rawOtherLogs?.length || 0} 条其他部位记录`);
        }
            
        return { targetLogs: groupedTargetLogs || [], otherLogs: rawOtherLogs || [] };
    } catch (e: any) {
        addLogCallback(`❌ 严重错误: ${e.message}`);
        return { targetLogs: [], otherLogs: [] };
    }
  };

  const handleGeneratePlan = async (surveyData: any) => {
    if (!surveyBodyPart) return;
    setIsGenerating(true);
    setLoadingLogs([]);

    addLog("🚀 初始化 Gemini AI 训练计划生成任务...");
    addLog(`📍 目标部位: ${surveyBodyPart.name}`);

    try {
      addLog("⏳ 正在读取历史训练数据...");
      const { targetLogs, otherLogs } = await fetchHistoryContext(surveyBodyPart.id, addLog);
      
      const inputData = {
          recent_target_logs: targetLogs,
          recent_other_logs: otherLogs,
          state_survey: surveyData,
          user_feedback: { note: "No specific feedback from previous session recorded." } 
      };
      
      const userPrompt = JSON.stringify(inputData, null, 2);
      
      addLog("📡 正在向 Gemini 3 Pro 提交请求...");
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: userPrompt,
        config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.3,
        },
      });

      const content = response.text || "";
      if (!content) throw new Error("AI 返回内容为空");

      addLog("📥 解析 AI 响应数据...");
      
      let summaryText = "";
      let jsonString = content;
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1) {
          summaryText = content.substring(0, firstBrace).trim();
          jsonString = content.substring(firstBrace, lastBrace + 1);
      }
      
      const cleanJsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();

      let parsedRoot;
      try {
        parsedRoot = JSON.parse(cleanJsonString);
      } catch (e) {
        throw new Error("JSON 解析失败");
      }
      
      const plan = parsedRoot['训练计划'];
      if (!plan) throw new Error("计划数据格式错误");

      const aiExercises: Exercise[] = [];
      const initialSessionLogs: Record<string, SetLog[]> = {};
      
      Object.keys(plan).forEach((key, index) => {
          if (key === '日期') return;
          const value = plan[key];
          
          if (Array.isArray(value)) {
              const isWarmup = key.includes("热身");
              if (isWarmup) {
                  aiExercises.push({
                      id: 'ai_warmup_combined',
                      name: '热身环节',
                      bodyPartId: surveyBodyPart.id,
                      warmupDetails: value.map((item: any) => ({
                          action: item['动作'],
                          reps: item['次数'],
                          note: item['备注'] || item['节奏']
                      }))
                  });
              }
          } else if (typeof value === 'object') {
              let exerciseName = key.replace(/主项[:：]/g, '').trim();
              exerciseName = exerciseName.replace(/[(（].*?[)）]/g, '').trim();
              
              const exId = `ai_main_${index}`;
              const table = value['表格'] || [];
              const goal = value['目标'] || '';
              
              const mainSet = table.find((s: any) => s['节奏']?.includes('冲击') || s['节奏']?.includes('主力')) || table[table.length - 1];
              
              aiExercises.push({
                  id: exId,
                  name: exerciseName,
                  bodyPartId: surveyBodyPart.id,
                  suggestion: {
                      sets: `${table.length}组`,
                      reps: mainSet ? `${mainSet['次数']}次` : '-',
                      weight: mainSet ? `${mainSet['重量']}` : '-',
                      reasoning: goal
                  }
              });

              if (table.length > 0) {
                  const logsForThisExercise: SetLog[] = table.map((row: any, i: number) => {
                      const wStr = String(row['重量'] || '0');
                      const weight = parseFloat(wStr.replace(/[^0-9.]/g, '')) || 0;
                      const reps = parseFloat(String(row['次数'] || '0').replace(/[^0-9.]/g, '')) || 0;
                      const rpe = parseFloat(String(row['RPE'] || '0').replace(/[^0-9.]/g, '')) || 0;
                      const note = row['节奏'] || row['备注'] || ''; 

                      return {
                          id: `auto_${exId}_${i}`,
                          weight: weight,
                          reps: reps,
                          rpe: rpe,
                          note: note
                      };
                  });
                  initialSessionLogs[exId] = logsForThisExercise;
              }
          }
      });

      setCurrentExercises(aiExercises);
      setSessionLogs(initialSessionLogs);
      
      // Update details from root keys in the JSON if provided
      setAIPlanDetails({
          summary: parsedRoot['概要'] || summaryText || "训练概要已生成",
          adjustments: parsedRoot['调整说明'] || "",
          feedbackRequired: parsedRoot['注意事项'] || [],
          rawContent: content 
      });
      
      addLog("✨ 计划已准备就绪！");
      await new Promise(r => setTimeout(r, 1000));
      setSelectedBodyPart(surveyBodyPart);
      setShowSurvey(false);
      setView('EXERCISES');

    } catch (error: any) {
        console.error("Gemini Generation Error", error);
        addLog(`❌ 错误: ${error.message}`);
        addLog("⚠️ 正在尝试生成本地基础计划...");
        await new Promise(r => setTimeout(r, 1500));
        
        try {
            const fallback = generateFallbackPlan(surveyBodyPart);
            setCurrentExercises(fallback.exercises);
            setSessionLogs(fallback.logs);
            setAIPlanDetails(fallback.details);
            setSelectedBodyPart(surveyBodyPart);
            setShowSurvey(false);
            setView('EXERCISES');
        } catch (fbError) {
             addLog("❌ 本地生成失败。");
        }
    } finally {
        setIsGenerating(false);
    }
  };

  const handleBodyPartSelect = (part: BodyPart) => {
    setSurveyBodyPart(part);
    setShowSurvey(true);
  };

  const handleExerciseSelect = (ex: Exercise) => {
    setSelectedExercise(ex);
    setView('SESSION');
  };

  const saveExerciseLogs = () => {
    if (selectedExercise && logs.length > 0) {
      setSessionLogs(prev => ({
        ...prev,
        [selectedExercise.id]: logs
      }));
      if (!completedExercises.includes(selectedExercise.id)) {
        setCompletedExercises(prev => [...prev, selectedExercise.id]);
      }
    }
    setView('EXERCISES');
  };

  const handleFinishWorkoutClick = () => {
    if (!selectedBodyPart) return;
    setShowFatigueModal(true);
  };

  const handleConfirmFinish = async (fatigueScore: number) => {
    setShowFatigueModal(false);
    setIsFinishing(true);

    try {
      const recordsToInsert = [];
      const dateStr = new Date().toISOString().split('T')[0];

      for (const [exerciseId, exerciseLogs] of Object.entries(sessionLogs)) {
        const exerciseDef = currentExercises.find(e => e.id === exerciseId);
        if (exerciseDef?.warmupDetails) continue;

        const validLogs = (exerciseLogs as SetLog[]).filter(l => l.weight > 0 || l.reps > 0);
        if (validLogs.length > 0) {
            const setsData = validLogs.map((log, index) => ({
                set: index + 1,
                reps: log.reps,
                weight_kg: log.weight,
                rpe: log.rpe,
                note: log.note
            }));

            recordsToInsert.push({
              body_part: selectedBodyPart?.id, 
              exercise: exerciseDef?.name || exerciseId, 
              sets: setsData,
              date: dateStr
            });
        }
      }

      if (recordsToInsert.length > 0) {
        const { error } = await supabase.from('workout_logs').insert(recordsToInsert);
        if (error) throw error;
      }
      
      try {
          await supabase.from('user_feedback').insert({
              date: dateStr,
              fatigue_score: fatigueScore,
              note: 'App Session'
          });
      } catch (feedbackErr) {}

      setCompletedExercises([]);
      setSessionLogs({});
      setView('SUMMARY');
    } catch (err: any) {
      alert("保存失败，请检查网络");
    } finally {
      setIsFinishing(false);
    }
  };

  const handleDeleteExercise = (id: string) => {
    if (window.confirm("确定要移除这个动作吗？")) {
        setCurrentExercises(prev => prev.filter(e => e.id !== id));
        setSessionLogs(prev => {
            const newLogs = { ...prev };
            delete newLogs[id];
            return newLogs;
        });
        setCompletedExercises(prev => prev.filter(eid => eid !== id));
    }
  };

  return (
    <div className="h-screen w-full bg-slate-50 relative overflow-hidden text-slate-800 font-sans selection:bg-blue-100">
      <AnimatePresence mode="wait">
        
        {view === 'HOME' && (
          <motion.div 
            key="home"
            className="h-full"
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <HomeView onSelect={handleBodyPartSelect} />
          </motion.div>
        )}

        {view === 'EXERCISES' && selectedBodyPart && (
          <motion.div 
            key="exercises"
            className="h-full"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <ExerciseListView 
              bodyPart={selectedBodyPart}
              exercises={currentExercises}
              onSelect={handleExerciseSelect}
              onBack={() => {
                  setView('HOME');
                  setAIPlanDetails(null);
                  setSessionLogs({});
                  setCompletedExercises([]);
              }}
              onFinishWorkout={handleFinishWorkoutClick}
              onAddExerciseClick={() => setShowAddModal(true)}
              completedIds={completedExercises}
              planDetails={aiPlanDetails || undefined}
              onShowDetails={() => setShowPlanDetails(true)}
              isFinishing={isFinishing}
              onDelete={handleDeleteExercise}
            />
          </motion.div>
        )}

        {view === 'SESSION' && selectedExercise && (
           <motion.div 
             key="session"
             className="h-full flex flex-col"
             initial={{ opacity: 0, y: 50 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 50 }}
           >
             <Header 
               title={selectedExercise.name} 
               showBack 
               onBack={() => {
                 setSessionLogs(prev => ({
                   ...prev,
                   [selectedExercise.id]: logs
                 }));
                 setView('EXERCISES');
               }} 
             />
             
             {selectedExercise.warmupDetails ? (
                 <div className="flex-1 overflow-y-auto p-6 space-y-4">
                     {selectedExercise.warmupDetails.map((item, index) => (
                         <div key={index} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                             <div>
                                 <div className="font-bold text-slate-700 text-lg">{item.action}</div>
                                 {item.note && <div className="text-slate-400 text-xs mt-1">{item.note}</div>}
                             </div>
                             <div className="text-right">
                                 <div className="font-bold text-slate-800 text-xl">{item.reps} <span className="text-sm font-normal text-slate-500">次</span></div>
                             </div>
                         </div>
                     ))}
                 </div>
             ) : (
                 <>
                 <div className="flex-1 overflow-y-auto p-4">
                    <Reorder.Group axis="y" values={logs} onReorder={setLogs} className="space-y-4">
                    {logs.map((log) => (
                        <SetItem 
                        key={log.id} 
                        item={log} 
                        onDelete={() => setLogs(prev => prev.filter(l => l.id !== log.id))}
                        onOpenPicker={(type, id, val) => setPickerState({ isOpen: true, type, setId: id, value: val })}
                        />
                    ))}
                    </Reorder.Group>
                    
                    <button 
                    onClick={() => setLogs(prev => [...prev, { id: String(Date.now()), weight: logs[logs.length-1]?.weight || 0, reps: logs[logs.length-1]?.reps || 0 }])}
                    className="w-full py-4 mt-4 rounded-xl bg-slate-100 text-slate-500 font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                    <Plus size={20} /> 添加组
                    </button>
                 </div>

                 <div className="p-4 border-t border-slate-100 bg-white shadow-lg">
                    <button 
                    onClick={saveExerciseLogs}
                    className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl active:scale-95 transition-all"
                    >
                    完成动作
                    </button>
                 </div>
                </>
             )}
           </motion.div>
        )}

        {view === 'SUMMARY' && (
           <motion.div className="h-full flex flex-col items-center justify-center bg-white p-6">
              <Trophy size={80} className="text-yellow-400 mb-6" />
              <h2 className="text-3xl font-bold text-slate-800 mb-2">训练完成!</h2>
              <p className="text-slate-500 mb-8">数据已保存至云端。</p>
              <button 
                onClick={() => {
                  setView('HOME');
                  setAIPlanDetails(null);
                }} 
                className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold"
              >
                回到首页
              </button>
           </motion.div>
        )}

      </AnimatePresence>

      <AnimatePresence>
        {isGenerating && (
             <LoadingLogger logs={loadingLogs} />
        )}

        {showSurvey && surveyBodyPart && !isGenerating && (
          <SurveyModal 
            bodyPart={surveyBodyPart} 
            onClose={() => setShowSurvey(false)} 
            onGenerate={handleGeneratePlan}
            loading={isGenerating}
          />
        )}
        
        {showPlanDetails && aiPlanDetails && (
           <PlanDetailsModal 
             details={aiPlanDetails}
             onClose={() => setShowPlanDetails(false)}
           />
        )}

        {showFatigueModal && (
            <FatigueModal 
                onConfirm={handleConfirmFinish}
                loading={isFinishing}
            />
        )}
        
        {pickerState && pickerState.isOpen && pickerState.type === 'weight' && (
           <WeightPicker
             initialWeight={pickerState.value as number}
             onClose={() => setPickerState(null)}
             onConfirm={(newVal) => {
                 setLogs(prev => prev.map(l => l.id === pickerState.setId ? { ...l, weight: newVal } : l));
             }}
           />
        )}

        {pickerState && pickerState.isOpen && pickerState.type === 'reps' && (
           <RepsPicker
             initialReps={pickerState.value as number}
             onClose={() => setPickerState(null)}
             onConfirm={(newVal) => {
                 setLogs(prev => prev.map(l => l.id === pickerState.setId ? { ...l, reps: newVal } : l));
             }}
           />
        )}

        {pickerState && pickerState.isOpen && pickerState.type === 'rpe' && (
           <RpePicker
             initialRpe={pickerState.value as number}
             onClose={() => setPickerState(null)}
             onConfirm={(newVal) => {
                 setLogs(prev => prev.map(l => l.id === pickerState.setId ? { ...l, rpe: newVal } : l));
             }}
           />
        )}

        {pickerState && pickerState.isOpen && pickerState.type === 'note' && (
           <NotePicker
             initialNote={pickerState.value as string}
             onClose={() => setPickerState(null)}
             onConfirm={(newVal) => {
                 setLogs(prev => prev.map(l => l.id === pickerState.setId ? { ...l, note: newVal } : l));
             }}
           />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
