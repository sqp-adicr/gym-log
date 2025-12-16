
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { ChevronLeft, CheckCircle2, X, Plus, Trophy, Home, Download, Loader2, CloudUpload, Check, AlertCircle, PlusCircle, Search, ArrowRight, Sparkles, Send, Info, BarChart2, Terminal, Play, Copy, Flame, Minus, Circle, Activity, Trash2, Edit3 } from 'lucide-react';
import { BodyPart, Exercise, ViewState, SetLog, AIWorkoutPlan, AIPlanDetails } from './types';
import { BODY_PARTS, EXERCISES, SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, DEEPSEEK_API_KEY } from './data';
import { supabase } from './supabaseClient';

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
                <span className="text-slate-200 font-mono font-bold tracking-tight">AI Agent Working...</span>
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
            <h3 className="text-lg font-bold text-slate-800">选择备注</h3>
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
                placeholder="自定义备注..."
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
               <p className="text-slate-400 text-xs">Generated by DeepSeek-V3</p>
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

          {/* New Section: Raw Content Display */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
             <div className="flex items-center justify-between mb-2">
                 <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">完整 AI 回复 (JSON)</h4>
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
              const isWarmup = !!ex.warmupDetails;

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
                    {/* Consistent Checkmark for both Warmup and Standard Exercises */}
                    <CheckCircle2 
                      size={24} 
                      className={`${isCompleted ? "text-green-500 fill-green-50" : "text-slate-200"}`}
                    />
                    
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <div className="flex items-center gap-2 w-full">
                         {/* Removed placeholder div here to fix indentation issue */}
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

const AddExerciseModal = ({
  currentList,
  onAdd,
  onClose
}: {
  currentList: Exercise[];
  onAdd: (ex: Exercise) => void;
  onClose: () => void;
}) => {
  const [step, setStep] = useState<'PARTS' | 'EXERCISES'>('PARTS');
  const [parts, setParts] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  
  useEffect(() => {
    const fetchParts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('body_part_library').select('*');
        if (error) throw error;
        if (data) setParts(data);
      } catch (err: any) {
        setParts(BODY_PARTS);
      } finally {
        setLoading(false);
      }
    };
    fetchParts();
  }, []);

  const handleSelectPart = async (part: any) => {
    setSelectedPart(part);
    setLoading(true);
    setExercises([]);
    setNewExerciseName('');
    
    try {
      const { data, error } = await supabase
        .from('exercise_library')
        .select('*')
        .eq('body_part', part.name);

      if (error) throw error;

      const mappedExercises = (data || []).map((ex: any) => ({
        id: String(ex.id),
        name: ex.exercise_name,
        bodyPartId: part.id
      }));

      setExercises(mappedExercises);
      setStep('EXERCISES');
    } catch (err: any) {
      setExercises([]); 
      setStep('EXERCISES');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndAdd = async () => {
    const trimmedName = newExerciseName.trim();
    if (!trimmedName) return;
    setLoading(true);

    try {
      const { data: existing, error: checkError } = await supabase
        .from('exercise_library')
        .select('id')
        .eq('body_part', selectedPart.name)
        .eq('exercise_name', trimmedName)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        alert(`动作 "${trimmedName}" 已存在于动作库中，请直接从上方列表中选择。`);
        setLoading(false);
        return;
      }

      const { data: newExercise, error: insertError } = await supabase
        .from('exercise_library')
        .insert({
          exercise_name: trimmedName,
          body_part: selectedPart.name
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (newExercise) {
        onAdd({
          id: String(newExercise.id), 
          name: newExercise.exercise_name,
          bodyPartId: selectedPart.id 
        });
        onClose();
      }
    } catch (err: any) {
      alert(`添加失败: ${err.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
      <div className="flex items-center gap-2">
        {step !== 'PARTS' && (
          <button 
            onClick={() => {
              setStep('PARTS');
              setNewExerciseName('');
            }}
            className="p-1 -ml-2 rounded-full hover:bg-slate-100"
          >
            <ChevronLeft size={24} className="text-slate-800" />
          </button>
        )}
        <h3 className="text-xl font-bold text-slate-800">
          {step === 'PARTS' ? '选择部位' : `${selectedPart?.name}动作库`}
        </h3>
      </div>
      <button onClick={onClose} className="p-2 rounded-full bg-slate-100 text-slate-500">
        <X size={20} />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] h-[85vh] flex flex-col relative z-10 overflow-hidden shadow-2xl"
      >
        {renderHeader()}
        <div className="flex-1 overflow-y-auto p-4 no-scrollbar bg-slate-50 flex flex-col">
          {loading && step === 'PARTS' ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
               <Loader2 className="animate-spin text-blue-500" size={32} />
               <p>加载中...</p>
            </div>
          ) : (
            <>
              {step === 'PARTS' && (
                <div className="grid grid-cols-2 gap-3">
                  {parts.map((part) => (
                    <button
                      key={part.id}
                      onClick={() => handleSelectPart(part)}
                      className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 active:scale-[0.98] transition-all flex flex-col items-center gap-2"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-slate-50 text-slate-600`}>
                        <ArrowRight size={20} className="-rotate-45" />
                      </div>
                      <span className="font-bold text-slate-700 text-lg">{part.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {step === 'EXERCISES' && (
                <div className="flex flex-col flex-1 h-full">
                  <div className="flex-1 overflow-y-auto mb-4">
                     <div className="space-y-2">
                       {exercises.length > 0 ? (
                         exercises.map((ex) => {
                            const isAdded = currentList.some(curr => curr.name === ex.name || String(curr.id) === String(ex.id));
                            return (
                              <button
                                key={ex.id}
                                onClick={() => onAdd(ex)}
                                className="w-full text-left p-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-100 flex items-center justify-center group active:scale-[0.98] transition-all justify-between"
                              >
                                <span className="font-medium text-slate-700 text-lg">{ex.name}</span>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${isAdded ? 'bg-green-100 text-green-600 border-green-200' : 'bg-slate-50 text-slate-400 border-slate-200 group-hover:text-blue-500 group-hover:border-blue-200'}`}>
                                  {isAdded ? <Check size={16} /> : <Plus size={16} />}
                                </div>
                              </button>
                            );
                         })
                       ) : (
                         <div className="text-center text-slate-400 py-10">
                           暂无动作，请新建
                         </div>
                       )}
                     </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">
                       新建自定义动作
                     </h4>
                     <div className="flex flex-col gap-3">
                        <input 
                          type="text" 
                          placeholder="输入新动作名称..." 
                          value={newExerciseName}
                          onChange={(e) => setNewExerciseName(e.target.value)}
                          className="w-full px-4 py-4 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm text-lg"
                        />
                        <button
                          onClick={handleCreateAndAdd}
                          disabled={!newExerciseName.trim() || loading}
                          className="w-full p-4 rounded-xl bg-slate-800 text-white flex items-center justify-center gap-2 font-semibold active:scale-[0.98] transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? <Loader2 className="animate-spin" /> : <PlusCircle size={20} />}
                          新建并添加
                        </button>
                     </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
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
                        {item.note || '备注'}
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
    // Pick 3-5 random exercises for the selected body part from local library
    const availableExercises = EXERCISES[part.id] || [];
    const count = Math.min(availableExercises.length, 4);
    // Shuffle and pick
    const shuffled = [...availableExercises].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    const exercises: Exercise[] = [];
    const logs: Record<string, SetLog[]> = {};

    // 1. Add a generic warmup
    exercises.push({
        id: 'fallback_warmup',
        name: '热身环节',
        bodyPartId: part.id,
        warmupDetails: [
            { action: '动态拉伸', reps: '30秒', note: '激活' },
            { action: '小重量预热', reps: '15次', note: '轻重量' }
        ]
    });

    // 2. Add selected exercises
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

        // Add 4 default sets
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
            summary: "⚠️ 当前由于网络或API限制无法连接AI。已为您生成本地基础训练模版。",
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

  // Load logs for the selected exercise when entering SESSION view
  useEffect(() => {
    if (view === 'SESSION' && selectedExercise) {
      // If we already have logs in this session for this exercise, load them
      if (sessionLogs[selectedExercise.id]) {
        setLogs(sessionLogs[selectedExercise.id]);
      } else {
        // Otherwise, initialize with one empty set or AI suggestions
        setLogs([{ id: String(Date.now()), weight: 0, reps: 0 }]);
      }
    }
  }, [view, selectedExercise]);

  const addLog = (message: string) => {
    setLoadingLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const fetchHistoryContext = async (bodyPartId: string, addLogCallback: (msg: string) => void) => {
    try {
        // 1. Fetch Target Logs (Robust Query)
        const { data: rawTargetLogs, error: targetError } = await supabase
            .from('workout_logs')
            .select('*') // Select all columns to ensure no mapping error
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

        // Group by date to simulate "sessions" and limit to last 4 dates
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

        // 2. Fetch Other Logs (Robust Query - no date filter)
        // Fetching recently logged items regardless of date to avoid timezone/future date issues
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

    addLog("🚀 初始化 AI 训练计划生成任务...");
    addLog(`📍 目标部位: ${surveyBodyPart.name} (ID: ${surveyBodyPart.id})`);

    try {
      addLog("⏳ 正在连接 Supabase 数据库读取历史训练数据...");
      
      // Pass addLog to helper
      const { targetLogs, otherLogs } = await fetchHistoryContext(surveyBodyPart.id, addLog);
      
      const inputData = {
          recent_target_logs: targetLogs,
          recent_other_logs: otherLogs,
          state_survey: surveyData,
          user_feedback: { note: "No specific feedback from previous session recorded." } 
      };
      
      const userPrompt = JSON.stringify(inputData, null, 2);
      
      addLog("🛠️ 正在构建 Prompt 上下文...");
      addLog(`📦 注入上下文数据长度: ${userPrompt.length} 字符`);

      // --- ADDED DATA PREVIEW LOGS ---
      addLog("📊 读取上下文数据预览:");
      addLog("Target Logs: " + JSON.stringify(targetLogs, null, 2).substring(0, 200) + (JSON.stringify(targetLogs).length > 200 ? "..." : ""));
      addLog("State Survey: " + JSON.stringify(surveyData, null, 2));

      // Call DeepSeek API via Fetch (more robust for CORS)
      addLog("📡 正在请求 DeepSeek-V3 API (Fetch)...");
      
      let content = "";

      try {
        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-reasoner",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userPrompt }
                ],
                stream: false
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errText}`);
        }

        const data = await response.json();
        content = data.choices[0].message.content || "";
        
        if (!content) throw new Error("No content received from API");
        
      } catch (apiErr: any) {
        // If API fails (likely CORS), throw to outer catch to trigger fallback
        throw new Error(`API Connection Failed: ${apiErr.message}`);
      }

      addLog("📥 收到 LLM 原始响应:");
      addLog(content.substring(0, 300) + "... (截取部分展示)");

      // Extract Summary and JSON
      addLog("⚙️ 正在解析响应数据...");
      
      let summaryText = "";
      let jsonString = content;

      // Locate JSON start and end
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1) {
          summaryText = content.substring(0, firstBrace).trim();
          jsonString = content.substring(firstBrace, lastBrace + 1);
      }
      
      // Clean extracted JSON string (remove potential markdown wrappers)
      const cleanJsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();

      let parsedRoot;
      try {
        parsedRoot = JSON.parse(cleanJsonString);
      } catch (e) {
        throw new Error("Failed to parse JSON response: " + cleanJsonString.substring(0, 100));
      }
      
      const plan = parsedRoot['训练计划'];
      if (!plan) {
         throw new Error("JSON missing '训练计划' root key.");
      }

      const aiExercises: Exercise[] = [];
      const initialSessionLogs: Record<string, SetLog[]> = {};
      
      // Iterate over keys in the "训练计划" object
      Object.keys(plan).forEach((key, index) => {
          if (key === '日期') {
              // Date is handled in summary or ignored as metadata
              return;
          }

          const value = plan[key];
          
          if (Array.isArray(value)) {
              // Handle Warmup Items (Arrays)
              // Create ONE grouped warmup exercise
              const isWarmup = key.includes("热身");
              
              if (isWarmup) {
                  aiExercises.push({
                      id: 'ai_warmup_combined',
                      name: '热身环节', // Changed from 🔥 热身环节 to just 热身环节
                      bodyPartId: surveyBodyPart.id,
                      warmupDetails: value.map((item: any) => ({
                          action: item['动作'],
                          reps: item['次数'],
                          note: item['备注']
                      }))
                  });
              } else {
                  // Fallback for other arrays if any
                   value.forEach((item: any, i) => {
                      const exId = `ai_misc_${index}_${i}`;
                      aiExercises.push({
                          id: exId,
                          name: item['动作'],
                          bodyPartId: surveyBodyPart.id,
                          suggestion: {
                              sets: "1组",
                              reps: `${item['次数']}次`,
                              weight: "自重/轻重量",
                              reasoning: item['备注']
                          }
                      });
                  });
              }
          } else if (typeof value === 'object') {
              // Handle Main Exercises (Objects with "表格")
              let exerciseName = key.replace(/主项[:：]/g, '').trim();
              exerciseName = exerciseName.replace(/[(（].*?[)）]/g, '').trim();
              
              const exId = `ai_main_${index}`;
              const table = value['表格'] || [];
              const goal = value['目标'] || '';
              
              const mainSet = table.find((s: any) => s['节奏']?.includes('冲击') || s['节奏']?.includes('主力')) || table[table.length - 1];
              
              const setsSummary = `${table.length}组`;
              const repsSummary = mainSet ? `${mainSet['次数']}次` : '-';
              const weightSummary = mainSet ? `${mainSet['重量']}` : '-';

              aiExercises.push({
                  id: exId,
                  name: exerciseName,
                  bodyPartId: surveyBodyPart.id,
                  suggestion: {
                      sets: setsSummary,
                      reps: repsSummary,
                      weight: weightSummary,
                      reasoning: goal
                  }
              });

              // Pre-fill Session Logs
              if (table.length > 0) {
                  const logsForThisExercise: SetLog[] = table.map((row: any, i: number) => {
                      const wStr = String(row['重量'] || '0');
                      const weight = parseFloat(wStr.replace(/[^0-9.]/g, '')) || 0;
                      
                      const rStr = String(row['次数'] || '0');
                      const reps = parseFloat(rStr.replace(/[^0-9.]/g, '')) || 0;

                      const rpeStr = String(row['RPE'] || '0');
                      const rpe = parseFloat(rpeStr.replace(/[^0-9.]/g, '')) || 0;
                      
                      // Map '节奏' (Rhythm) from AI to 'note' (备注)
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

      if (aiExercises.length === 0) {
          throw new Error("No exercises found in the plan.");
      }
          
      setCurrentExercises(aiExercises);
      setSessionLogs(initialSessionLogs);

      setAIPlanDetails({
          summary: summaryText || (plan['日期'] ? `Date: ${plan['日期']}\nNo additional summary provided.` : "No summary provided."),
          adjustments: "",
          feedbackRequired: [],
          rawContent: content 
      });
      
      addLog("✨ 计划生成完成! 正在跳转...");
      
      // Artificial delay to let user see the success message
      await new Promise(r => setTimeout(r, 1200));

      setSelectedBodyPart(surveyBodyPart);
      setShowSurvey(false);
      setView('EXERCISES');

    } catch (error: any) {
        console.error("AI Generation Error", error);
        addLog(`❌ API 错误: ${error.message}`);
        addLog("⚠️ 正在尝试使用本地备用计划...");
        
        await new Promise(r => setTimeout(r, 1500));
        
        // --- FALLBACK LOGIC ---
        try {
            const fallback = generateFallbackPlan(surveyBodyPart);
            setCurrentExercises(fallback.exercises);
            setSessionLogs(fallback.logs);
            setAIPlanDetails(fallback.details);
            
            addLog("✅ 本地计划生成成功!");
            await new Promise(r => setTimeout(r, 1000));
            
            setSelectedBodyPart(surveyBodyPart);
            setShowSurvey(false);
            setView('EXERCISES');
        } catch (fbError) {
             addLog("❌ 本地生成也失败了。请刷新页面。");
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
      const dateStr = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

      for (const [exerciseId, exerciseLogs] of Object.entries(sessionLogs)) {
        const exerciseDef = currentExercises.find(e => e.id === exerciseId);
        
        // Skip warmup exercises for saving if they have no numeric logs (which they won't in read-only mode)
        if (exerciseDef?.warmupDetails) continue;

        const validLogs = (exerciseLogs as SetLog[]).filter(l => l.weight > 0 || l.reps > 0);
        
        if (validLogs.length > 0) {
            const setsData = validLogs.map((log, index) => ({
                set: index + 1,
                reps: log.reps,
                weight_kg: log.weight,
                rpe: log.rpe, // Include RPE in the saved data
                note: log.note // Include note
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
      
      // Attempt to save feedback (Fatigue Score)
      // This is a "best effort" save, assuming a user_feedback table might exist or we just want to execute it.
      // If table doesn't exist, Supabase will return error, which we log but don't block the UI for.
      try {
          await supabase.from('user_feedback').insert({
              date: dateStr,
              fatigue_score: fatigueScore,
              note: 'App Manual Entry'
          });
      } catch (feedbackErr) {
          console.warn("Could not save feedback (table might be missing)", feedbackErr);
      }

      setCompletedExercises([]);
      setSessionLogs({});
      setView('SUMMARY');
    } catch (err: any) {
      console.error("Save Error", err);
      alert("保存数据失败，请检查网络");
    } finally {
      setIsFinishing(false);
    }
  };

  const handleDeleteExercise = (id: string) => {
    if (window.confirm("确定要移除这个动作吗？")) {
        setCurrentExercises(prev => prev.filter(e => e.id !== id));
        // Remove associated logs if they exist
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
        
        {showAddModal && (
          <AddExerciseModal
            currentList={currentExercises}
            onAdd={(newEx) => {
                setCurrentExercises(prev => [...prev, newEx]);
            }}
            onClose={() => setShowAddModal(false)}
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
