
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { ChevronLeft, CheckCircle2, X, Plus, Trophy, Home, Download, Loader2, CloudUpload, Check, AlertCircle, PlusCircle, Search, ArrowRight, Sparkles, Send, Info, BarChart2, Terminal, Play, Copy, Flame, Minus, Circle, Activity, Trash2, Edit3, ExternalLink, Lock } from 'lucide-react';
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
  <div className="flex items-center justify-between px-6 py-5 sticky top-0 z-10 bg-slate-50/80 backdrop-blur-lg border-b border-slate-200/50">
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
    <h1 className="text-lg font-bold text-slate-800 tracking-tight text-center truncate flex-1">{title}</h1>
    <div className="w-16 flex justify-end items-center">
      {action}
    </div>
  </div>
);

// --- Loading Logger Component ---

const LoadingLogger = ({ logs }: { logs: string[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[50vh] border border-white/20">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                <span className="text-slate-800 font-bold tracking-tight">AI 智能分析中...</span>
            </div>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 font-medium text-sm text-slate-500 space-y-3 bg-slate-50 no-scrollbar">
            {logs.map((log, i) => (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} key={i} className="flex gap-3 items-start">
                    <div className="w-1 h-1 rounded-full bg-blue-400 mt-2 shrink-0" />
                    <span className="break-words leading-relaxed">{log}</span>
                </motion.div>
            ))}
        </div>
      </div>
    </div>
  )
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
  const [hasApiKey, setHasApiKey] = useState(true);
  const [pickerState, setPickerState] = useState<{ isOpen: boolean; type: 'weight' | 'reps' | 'rpe' | 'note'; setId: string; value: number | string; } | null>(null);

  useEffect(() => {
    const checkKey = async () => {
        if (!process.env.API_KEY) {
            try {
                const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                setHasApiKey(hasKey);
            } catch (e) { setHasApiKey(true); }
        } else { setHasApiKey(true); }
    };
    checkKey();
  }, []);

  useEffect(() => {
    if (view === 'SESSION' && selectedExercise) {
      setLogs(sessionLogs[selectedExercise.id] || [{ id: String(Date.now()), weight: 0, reps: 0 }]);
    }
  }, [view, selectedExercise]);

  const addLog = (message: string) => setLoadingLogs(prev => [...prev, message]);

  const handleGeneratePlan = async (surveyData: any) => {
    if (!surveyBodyPart) return;
    setIsGenerating(true);
    setLoadingLogs([]);
    addLog("正在启动 Gemini 3 Pro 高级推理引擎...");

    try {
      addLog("正在检索 Supabase 训练历史...");
      const { data: rawTargetLogs } = await supabase.from('workout_logs').select('*').eq('body_part', surveyBodyPart.id).order('date', { ascending: false }).limit(10);
      
      const userPrompt = JSON.stringify({ 
        recent_target_logs: rawTargetLogs || [], 
        state_survey: surveyData,
        training_timestamp: new Date().toISOString()
      }, null, 2);
      
      addLog("AI 正在根据您的主观反馈调整强度...");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: userPrompt,
        config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.3 }
      });

      const content = response.text || "";
      addLog("解析排课数据中...");

      let parsedRoot;
      const jsonRegex = /\{[\s\S]*\}/;
      const match = content.match(jsonRegex);
      
      if (match) {
          try { parsedRoot = JSON.parse(match[0]); } catch (e) { addLog("JSON 结构解析中..."); }
      }

      if (parsedRoot && parsedRoot['训练计划']) {
          const plan = parsedRoot['训练计划'];
          const aiExercises: Exercise[] = [];
          const initialLogs: Record<string, SetLog[]> = {};
          
          Object.keys(plan).forEach((key, index) => {
              if (key === '日期') return;
              const val = plan[key];
              if (typeof val === 'object' && val.表格) {
                  const exId = `ai_p_${index}`;
                  aiExercises.push({ id: exId, name: key.replace(/主项[:：]/g, '').trim(), bodyPartId: surveyBodyPart.id as any });
                  initialLogs[exId] = val.表格.map((r: any, i: number) => ({
                      id: `s_${exId}_${i}`,
                      weight: parseFloat(String(r.重量).replace(/[^0-9.]/g, '')) || 0,
                      reps: parseFloat(String(r.次数).replace(/[^0-9.]/g, '')) || 0,
                      rpe: parseFloat(String(r.RPE).replace(/[^0-9.]/g, '')) || 0,
                      note: r.节奏 || r.备注 || ''
                  }));
              }
          });

          setCurrentExercises(aiExercises);
          setSessionLogs(initialLogs);
          setAIPlanDetails({ 
            summary: parsedRoot.概要 || "计划生成成功", 
            adjustments: parsedRoot.调整说明 || "已同步您的最新状态", 
            feedbackRequired: parsedRoot.注意事项 || [], 
            rawContent: content 
          });
          
          addLog("同步成功，即将为您开启训练模式！");
          await new Promise(r => setTimeout(r, 600));
          setSelectedBodyPart(surveyBodyPart);
          setShowSurvey(false);
          setView('EXERCISES');
      } else {
          throw new Error("模型响应解析失败。");
      }
    } catch (error: any) {
        addLog(`失败: ${error.message}`);
        setTimeout(() => setIsGenerating(false), 2000);
    } finally { setIsGenerating(false); }
  };

  const handleFinishWorkout = async (fatigueScore: number) => {
    setShowFatigueModal(false);
    setIsFinishing(true);
    try {
      const records = [];
      const dateStr = new Date().toISOString().split('T')[0];
      const logEntries = Object.entries(sessionLogs) as [string, SetLog[]][];
      
      for (const [id, logs] of logEntries) {
        const ex = currentExercises.find(e => e.id === id);
        const valid = logs.filter(l => l.weight > 0 || l.reps > 0);
        if (valid.length > 0) {
            records.push({ 
              body_part: selectedBodyPart?.id, 
              exercise: ex?.name || id, 
              sets: valid.map((l, i) => ({ set: i+1, reps: l.reps, weight_kg: l.weight, rpe: l.rpe, note: l.note })), 
              date: dateStr 
            });
        }
      }
      if (records.length > 0) await supabase.from('workout_logs').insert(records);
      setView('SUMMARY');
    } catch (e) { alert("保存失败"); } finally { setIsFinishing(false); }
  };

  const renderPickers = () => {
    if (!pickerState?.isOpen) return null;
    const { type, setId, value } = pickerState;
    const commonProps = { onClose: () => setPickerState(null) };
    if (type === 'weight') return <WeightPicker initialWeight={value as number} {...commonProps} onConfirm={(v: number) => setLogs(l => l.map(x => x.id === setId ? { ...x, weight: v } : x))} />;
    if (type === 'reps') return <RepsPicker initialReps={value as number} {...commonProps} onConfirm={(v: number) => setLogs(l => l.map(x => x.id === setId ? { ...x, reps: v } : x))} />;
    if (type === 'rpe') return <RpePicker initialRpe={value as number} {...commonProps} onConfirm={(v: number) => setLogs(l => l.map(x => x.id === setId ? { ...x, rpe: v } : x))} />;
    if (type === 'note') return <NotePicker initialNote={value as string} {...commonProps} onConfirm={(v: string) => setLogs(l => l.map(x => x.id === setId ? { ...x, note: v } : x))} />;
    return null;
  };

  return (
    <div className="h-screen w-full bg-slate-50 relative overflow-hidden text-slate-800 font-sans selection:bg-blue-100">
      <AnimatePresence mode="wait">
        {view === 'HOME' && <motion.div key="home" className="h-full" exit={{ opacity: 0, x: -50 }}><HomeView onSelect={(p) => { setSurveyBodyPart(p); setShowSurvey(true); }} /></motion.div>}
        {view === 'EXERCISES' && selectedBodyPart && (
          <motion.div key="exercises" className="h-full" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
            <ExerciseListView bodyPart={selectedBodyPart} exercises={currentExercises} onSelect={(ex) => { setSelectedExercise(ex); setView('SESSION'); }} onBack={() => setView('HOME')} onFinishWorkout={() => setShowFatigueModal(true)} onAddExerciseClick={() => {}} completedIds={completedExercises} planDetails={aiPlanDetails || undefined} onShowDetails={() => setShowPlanDetails(true)} isFinishing={isFinishing} onDelete={(id) => setCurrentExercises(prev => prev.filter(e => e.id !== id))} />
          </motion.div>
        )}
        {view === 'SESSION' && selectedExercise && (
           <motion.div key="session" className="h-full flex flex-col" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}>
             <Header title={selectedExercise.name} showBack onBack={() => { setSessionLogs(prev => ({ ...prev, [selectedExercise.id]: logs })); setView('EXERCISES'); }} />
             <div className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-4">
                <Reorder.Group axis="y" values={logs} onReorder={setLogs} className="space-y-4">
                  {logs.map(log => (
                    <SetItem key={log.id} item={log} onDelete={() => setLogs(prev => prev.filter(l => l.id !== log.id))} onOpenPicker={(type, id, val) => setPickerState({ isOpen: true, type, setId: id, value: val })} />
                  ))}
                </Reorder.Group>
                <button onClick={() => setLogs(prev => [...prev, { id: String(Date.now()), weight: logs[logs.length-1]?.weight || 0, reps: logs[logs.length-1]?.reps || 0 }])} className="w-full py-5 rounded-3xl bg-white border-2 border-dashed border-slate-200 text-slate-400 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"><Plus size={20} /> 添加新组</button>
             </div>
             <div className="p-5 border-t border-slate-100 bg-white"><button onClick={() => { setSessionLogs(prev => ({ ...prev, [selectedExercise.id]: logs })); setCompletedExercises(prev => [...new Set([...prev, selectedExercise.id])]); setView('EXERCISES'); }} className="w-full py-5 bg-slate-800 text-white font-bold rounded-[1.5rem] shadow-xl">记录完成</button></div>
           </motion.div>
        )}
        {view === 'SUMMARY' && <motion.div className="h-full flex flex-col items-center justify-center bg-white p-6"><motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-32 h-32 bg-yellow-400 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-yellow-100"><Trophy size={60} className="text-white" /></motion.div><h2 className="text-3xl font-bold text-slate-800 mb-2">训练已存档</h2><p className="text-slate-400 mb-10 text-center px-8">您的汗水已转化为数据。坚持不懈，顶峰相见。</p><button onClick={() => { setView('HOME'); setCompletedExercises([]); setSessionLogs({}); setAIPlanDetails(null); }} className="px-12 py-4 bg-slate-800 text-white rounded-[1.5rem] font-bold shadow-xl">回到控制台</button></motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {isGenerating && <LoadingLogger logs={loadingLogs} />}
        {showSurvey && surveyBodyPart && !isGenerating && <SurveyModal onClose={() => setShowSurvey(false)} onGenerate={handleGeneratePlan} loading={isGenerating} />}
        {showPlanDetails && aiPlanDetails && <PlanDetailsModal details={aiPlanDetails} onClose={() => setShowPlanDetails(false)} />}
        {showFatigueModal && <FatigueModal onConfirm={handleFinishWorkout} loading={isFinishing} />}
        {renderPickers()}
      </AnimatePresence>
    </div>
  );
};

// --- Sub-components for Pickers ---
const WeightPicker = ({ initialWeight, onConfirm, onClose }: any) => {
  const [weight, setWeight] = useState(initialWeight);
  const adjust = (amount: number) => setWeight((p: number) => Math.max(0, Math.round((p + amount) * 10) / 10));
  
  // 增加 ±1 选项
  const options = [-5, -2.5, -1, 1, 2.5, 5];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: 200 }} animate={{ y: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative z-10 shadow-2xl">
        <div className="flex justify-between items-center mb-8"><h3 className="text-xl font-bold">调整重量</h3><button onClick={onClose} className="p-2 bg-slate-100 rounded-full active:scale-90 transition-all"><X size={20}/></button></div>
        <div className="flex flex-col items-center mb-10"><div className="text-7xl font-bold text-slate-800 tabular-nums">{weight}<span className="text-sm text-slate-400 ml-2 font-medium tracking-wide">KG</span></div></div>
        
        {/* 改为 3 列网格以适应 6 个按钮 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {options.map(v => (
            <button 
              key={v} 
              onClick={() => adjust(v)} 
              className="py-5 rounded-2xl bg-slate-50 font-bold text-slate-600 active:bg-slate-200 active:scale-95 transition-all shadow-sm"
            >
              {v > 0 ? `+${v}` : v}
            </button>
          ))}
        </div>
        
        <button onClick={() => { onConfirm(weight); onClose(); }} className="w-full py-5 bg-[#1e293b] text-white font-bold rounded-3xl shadow-lg active:scale-[0.98] transition-all">确认修改</button>
      </motion.div>
    </div>
  );
};

const RepsPicker = ({ initialReps, onConfirm, onClose }: any) => {
  const options = Array.from({ length: 15 }, (_, i) => i + 1);
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: 200 }} animate={{ y: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative z-10 shadow-2xl max-h-[70vh] flex flex-col">
        <div className="flex justify-between items-center mb-8"><h3 className="text-xl font-bold">完成次数</h3><button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button></div>
        <div className="grid grid-cols-5 gap-3 overflow-y-auto no-scrollbar pb-6">
          {options.map(v => <button key={v} onClick={() => { onConfirm(v); onClose(); }} className={`py-5 rounded-2xl font-bold text-xl transition-all ${v === initialReps ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-700'}`}>{v}</button>)}
        </div>
      </motion.div>
    </div>
  );
};

const RpePicker = ({ initialRpe, onConfirm, onClose }: any) => {
  const options = [5, 6, 7, 8, 9, 10];
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: 200 }} animate={{ y: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative z-10 shadow-2xl">
        <h3 className="text-xl font-bold mb-8 text-center">自觉强度 (RPE)</h3>
        <div className="grid grid-cols-3 gap-3">
          {options.map(v => <button key={v} onClick={() => { onConfirm(v); onClose(); }} className={`py-6 rounded-2xl font-bold text-2xl ${v === initialRpe ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50'}`}>{v}</button>)}
        </div>
      </motion.div>
    </div>
  );
};

const NotePicker = ({ initialNote, onConfirm, onClose }: any) => {
  const [val, setVal] = useState(initialNote);
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: 200 }} animate={{ y: 0 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative z-10 shadow-2xl">
        <h3 className="text-xl font-bold mb-8">训练备注</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {['主力', '热身', '冲击', '控制'].map(p => <button key={p} onClick={() => setVal(p)} className={`px-5 py-3 rounded-xl border-2 transition-all ${val === p ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-100 text-slate-500'}`}>{p}</button>)}
        </div>
        <input type="text" value={val} onChange={e => setVal(e.target.value)} className="w-full p-5 bg-slate-100 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 mb-8 font-medium" placeholder="自定义内容..." />
        <button onClick={() => { onConfirm(val); onClose(); }} className="w-full py-5 bg-slate-800 text-white font-bold rounded-[1.5rem]">保存</button>
      </motion.div>
    </div>
  );
};

// --- Home View ---
const HomeView = ({ onSelect }: any) => (
  <div className="flex flex-col h-full overflow-hidden p-8 justify-center gap-10">
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-center">
      <h2 className="text-2xl font-bold text-slate-400 tracking-tight">今天练哪？</h2>
    </motion.div>
    <div className="grid grid-cols-2 gap-5 max-w-md mx-auto w-full">
      {BODY_PARTS.map((part, i) => (
        <motion.button 
          key={part.id} 
          onClick={() => onSelect(part)} 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: i * 0.05 }} 
          whileTap={{ scale: 0.95 }} 
          className={`aspect-square rounded-[3rem] ${part.color} bg-opacity-20 flex flex-col items-center justify-center gap-3 border-4 border-white shadow-xl shadow-slate-100 transition-all`}
        >
          <span className="text-2xl font-bold tracking-widest">{part.name}</span>
        </motion.button>
      ))}
    </div>
  </div>
);

// --- Survey Modal ---
const SurveyModal = ({ onClose, onGenerate, loading }: any) => {
  const [formData, setFormData] = useState({ sleep: '好', diet: '正常', doms: '无感', stress: '放松', domsPart: '', otherActivity: '无' });

  const renderOption = (key: string, labels: string[]) => (
    <div className="flex gap-2">
      {labels.map(l => (
        <button 
          key={l} 
          onClick={() => setFormData(p => ({ ...p, [key]: l }))} 
          className={`flex-1 py-4 rounded-2xl border text-sm font-bold transition-all shadow-sm ${(formData as any)[key] === l ? 'bg-[#1e293b] text-white border-[#1e293b]' : 'bg-white text-slate-400 border-slate-50 hover:border-slate-100'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={loading ? undefined : onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 pb-4"><h3 className="text-2xl font-bold text-slate-800">今日状态确认</h3></div>
        
        <div className="px-8 pb-8 pt-2 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 ml-1">昨晚睡眠</label>
            {renderOption('sleep', ['差', '一般', '好'])}
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 ml-1">今日饮食</label>
            {renderOption('diet', ['少', '正常', '多'])}
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 ml-1">肌肉疲劳</label>
            {renderOption('doms', ['严重', '轻微', '无感'])}
            
            <AnimatePresence>
              {(formData.doms === '轻微' || formData.doms === '严重') && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pt-2"
                >
                  <label className="text-xs font-semibold text-slate-400 ml-1 mb-2 block">哪个部位酸痛？</label>
                  <div className="grid grid-cols-3 gap-2">
                    {BODY_PARTS.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => setFormData(f => ({ ...f, domsPart: p.name }))}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${formData.domsPart === p.name ? 'bg-slate-100 border-slate-200 text-slate-800 shadow-inner' : 'bg-slate-50 border-slate-50 text-slate-400'}`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => onGenerate(formData)} 
            disabled={loading} 
            className="w-full mt-4 py-5 bg-[#2563eb] text-white font-bold rounded-2xl shadow-xl shadow-blue-100 disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "生成我的专属计划"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const PlanDetailsModal = ({ details, onClose }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
      <div className="bg-slate-800 p-7 text-white flex justify-between items-center shrink-0">
        <div><h3 className="text-xl font-bold">AI 教练分析</h3><p className="text-slate-400 text-xs mt-1">Intelligence by Gemini 3 Pro</p></div>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full"><X size={20} /></button>
      </div>
      <div className="p-7 overflow-y-auto space-y-7 bg-slate-50 flex-1 no-scrollbar">
        <section className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">本节目标</h4>
          <p className="text-slate-700 font-medium leading-relaxed bg-white p-5 rounded-3xl border border-slate-100">{details.summary}</p>
        </section>
        <section className="space-y-3">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">排课逻辑调整</h4>
          <p className="text-slate-700 font-medium leading-relaxed bg-white p-5 rounded-3xl border border-slate-100">{details.adjustments}</p>
        </section>
        {details.feedbackRequired.length > 0 && (
          <section className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">重点注意事项</h4>
            <div className="space-y-2">{details.feedbackRequired.map((t: any, i: number) => <div key={i} className="p-4 bg-white rounded-2xl border border-slate-100 text-sm font-bold text-slate-600 flex gap-3"><Check className="text-green-500 shrink-0" size={16}/>{t}</div>)}</div>
          </section>
        )}
      </div>
    </motion.div>
  </div>
);

const ExerciseListView = ({ bodyPart, exercises, onSelect, onBack, onFinishWorkout, completedIds, planDetails, onShowDetails, isFinishing, onDelete }: any) => (
  <div className="flex flex-col h-full bg-slate-50">
    <Header title={`${bodyPart.name}部训练清单`} showBack onBack={onBack} action={planDetails && <button onClick={onShowDetails} className="p-2 bg-blue-50 text-blue-600 rounded-2xl"><Info size={20} /></button>} />
    <div className="flex-1 overflow-y-auto px-6 pb-28 no-scrollbar space-y-4 mt-4">
      {exercises.map((ex: any, i: number) => (
        <motion.div key={ex.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }} className="w-full bg-white rounded-[2rem] shadow-sm border border-slate-100 flex items-center p-5 gap-4">
          <button onClick={() => onSelect(ex)} className="flex-1 flex items-center gap-5 text-left">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${completedIds.includes(ex.id) ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-slate-50 text-slate-200'}`}><Check size={24} /></div>
            <span className="text-lg font-bold text-slate-800">{ex.name}</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(ex.id); }} className="p-3 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={20} /></button>
        </motion.div>
      ))}
    </div>
    <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-100"><button onClick={onFinishWorkout} disabled={isFinishing} className="w-full py-5 bg-slate-800 text-white font-bold rounded-[1.5rem] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">{isFinishing ? <Loader2 className="animate-spin" /> : <><Trophy size={20} className="text-yellow-400"/>同步数据并结束</>}</button></div>
  </div>
);

const SetItem = ({ item, onDelete, onOpenPicker }: any) => (
  <Reorder.Item value={item} id={item.id} className="flex items-center gap-2 mb-3 bg-white p-3 rounded-[1.5rem] border border-slate-100 shadow-sm">
    <div className="w-10 flex flex-col items-center justify-center gap-1 shrink-0"><div className="w-1 h-1 rounded-full bg-slate-300"/><div className="w-1 h-1 rounded-full bg-slate-300"/><div className="w-1 h-1 rounded-full bg-slate-300"/></div>
    <div className="flex-1 grid grid-cols-4 gap-2">
      <button onClick={() => onOpenPicker('weight', item.id, item.weight)} className="bg-slate-50 rounded-xl py-3.5 font-bold text-slate-700 relative text-sm">{item.weight}<span className="absolute right-1 bottom-1 text-[7px] opacity-20">KG</span></button>
      <button onClick={() => onOpenPicker('reps', item.id, item.reps)} className="bg-slate-50 rounded-xl py-3.5 font-bold text-slate-700 relative text-sm">{item.reps}<span className="absolute right-1 bottom-1 text-[7px] opacity-20">REPS</span></button>
      <button onClick={() => onOpenPicker('note', item.id, item.note || '')} className={`rounded-xl py-3.5 font-bold text-[10px] truncate ${item.note ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-300'}`}>{item.note || '节奏'}</button>
      <button onClick={() => onOpenPicker('rpe', item.id, item.rpe || 0)} className="bg-slate-50 rounded-xl py-3.5 font-bold text-slate-700 relative text-sm">{item.rpe || '-'}<span className="absolute right-1 bottom-1 text-[7px] opacity-20">RPE</span></button>
    </div>
    <button onClick={onDelete} className="w-12 h-12 flex items-center justify-center text-slate-200 hover:text-rose-500"><X size={20} /></button>
  </Reorder.Item>
);

const FatigueModal = ({ onConfirm, loading }: any) => {
  const [score, setScore] = useState<number | null>(null);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-sm rounded-[2.5rem] p-10 text-center shadow-2xl">
        <h3 className="text-2xl font-bold mb-2">本次训练强度</h3>
        <p className="text-slate-400 text-sm mb-8">请评估您今日的主观疲劳度</p>
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[5, 6, 7, 8, 9, 10].map(v => <button key={v} onClick={() => setScore(v)} className={`py-5 rounded-2xl font-bold text-xl border-2 transition-all ${score === v ? 'bg-[#1e293b] text-white border-[#1e293b] shadow-xl' : 'bg-white border-slate-100 text-slate-300'}`}>{v}</button>)}
        </div>
        <button onClick={() => score && onConfirm(score)} disabled={!score || loading} className="w-full py-5 bg-[#2563eb] text-white font-bold rounded-[1.5rem] shadow-xl shadow-blue-100 active:scale-95 transition-all">{loading ? <Loader2 className="animate-spin mx-auto"/> : '确认并上传数据'}</button>
      </motion.div>
    </div>
  );
};

export default App;
