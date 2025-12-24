
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
  <div className="flex items-center justify-between px-6 py-5 sticky top-0 z-10 bg-slate-50/70 backdrop-blur-xl border-b border-slate-200/20">
    <div className="w-10 flex justify-start">
      {showBack && (
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-slate-800" />
        </button>
      )}
    </div>
    <h1 className="text-2xl font-black text-slate-800 tracking-tight text-center truncate flex-1">{title}</h1>
    <div className="w-10 flex justify-end items-center">
      {action}
    </div>
  </div>
);

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
  const [genError, setGenError] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState<string[]>([]);
  const [genProgress, setGenProgress] = useState(0);
  const [aiPlanDetails, setAIPlanDetails] = useState<AIPlanDetails | null>(null);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showFatigueModal, setShowFatigueModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [logs, setLogs] = useState<SetLog[]>([]);
  const [pickerState, setPickerState] = useState<{ isOpen: boolean; type: 'weight' | 'reps' | 'rpe' | 'note'; setId: string; value: number | string; } | null>(null);

  useEffect(() => {
    if (view === 'SESSION' && selectedExercise) {
      setLogs(sessionLogs[selectedExercise.id] || [{ id: String(Date.now()), weight: 0, reps: 0 }]);
    }
  }, [view, selectedExercise]);

  const addLog = (message: string) => setLoadingLogs(prev => [...prev, message]);

  const handleGeneratePlan = async (surveyData: any) => {
    if (!surveyBodyPart) return;
    setIsGenerating(true);
    setGenError(false);
    setLoadingLogs([]);
    setGenProgress(5);
    addLog("正在启动云端智能...");

    try {
      setGenProgress(15);
      addLog(`[准备] 正在读取您的云端训练历史...`);
      
      const { data: targetDatesData } = await supabase
        .from('workout_logs')
        .select('date')
        .eq('body_part', surveyBodyPart.id)
        .order('date', { ascending: false });
      
      const datesList = (targetDatesData || []) as Array<{ date: string }>;
      const uniqueDates = Array.from(new Set(datesList.map(d => d.date))).slice(0, 4);
      
      const { data: targetLogs, error: targetError } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('body_part', surveyBodyPart.id)
        .in('date', uniqueDates)
        .order('date', { ascending: false });

      if (targetError) throw new Error(`数据读取失败: ${targetError.message}`);
      setGenProgress(35);
      
      const targetDatesFormatted = uniqueDates.map(d => String(d).split('-').slice(1).join('.')).join(', ');
      addLog(`[纵向同步] 已找到 ${surveyBodyPart.name} 部位过去 4 次训练细节: ${targetDatesFormatted || '首次记录'}。`);

      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastWeekStr = lastWeek.toISOString().split('T')[0];

      const { data: otherLogs, error: otherError } = await supabase
        .from('workout_logs')
        .select('*')
        .neq('body_part', surveyBodyPart.id)
        .gte('date', lastWeekStr)
        .order('date', { ascending: false });

      if (otherError) throw new Error(`交叉数据同步失败: ${otherError.message}`);
      setGenProgress(50);
      
      const otherLogsByDate: Record<string, string[]> = {};
      const otherLogsList = (otherLogs || []) as Array<{ date: string; body_part: string }>;
      otherLogsList.forEach((d) => {
          const dateKey = d.date.split('-').slice(1).join('.');
          const partName = BODY_PARTS.find(p => p.id === d.body_part)?.name || d.body_part;
          if (!otherLogsByDate[dateKey]) otherLogsByDate[dateKey] = [];
          if (!otherLogsByDate[dateKey].includes(partName)) otherLogsByDate[dateKey].push(partName);
      });

      const otherLogsSummary = Object.entries(otherLogsByDate).map(([date, parts]) => `${date}[${parts.join(',')}]`).join(', ');
      addLog(`[横向同步] 已同步过去 7 天训练表现: ${otherLogsSummary || '暂无其他部位数据'}。`);

      addLog("正在评估周期状态并生成动态训练计划...");
      setGenProgress(65);
      
      // 使用 gemini-3-pro-preview 处理复杂任务，移除自动重试，确保请求过程简单直接
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: JSON.stringify({
          recent_target_logs: targetLogs || [],
          recent_other_logs: otherLogs || [],
          state_survey: surveyData,
          training_timestamp: new Date().toISOString(),
          target_part: surveyBodyPart.name
        }),
        config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.2 }
      });

      setGenProgress(90);
      const content = response.text; // 直接访问 .text 属性
      if (!content) throw new Error("AI 响应异常。");

      let parsedRoot: any;
      const match = content.match(/\{[\s\S]*\}/);
      if (match) parsedRoot = JSON.parse(match[0]);

      const planSource = parsedRoot?.['训练计划'] || parsedRoot?.workout_plan;

      if (parsedRoot && planSource) {
          const aiExercises: Exercise[] = [];
          const initialLogs: Record<string, SetLog[]> = {};
          
          Object.keys(planSource).forEach((key, index) => {
              if (key === '日期' || key === 'date' || key.includes('热身')) return;
              const val = planSource[key];
              if (typeof val === 'object' && val.表格) {
                  const exId = `ai_${index}_${Date.now()}`;
                  aiExercises.push({ id: exId, name: key.replace(/主项[:：]/g, '').trim(), bodyPartId: surveyBodyPart.id as any });
                  initialLogs[exId] = val.表格.map((r: any, i: number) => ({
                      id: `${exId}_${i}`,
                      weight: parseFloat(String(r.重量)) || 0,
                      reps: parseFloat(String(r.次数)) || 0,
                      rpe: parseFloat(String(r.RPE)) || 0,
                      note: r.节奏 || r.备注 || ''
                  }));
              }
          });

          setCurrentExercises(aiExercises);
          setSessionLogs(initialLogs);
          setAIPlanDetails({ 
            summary: parsedRoot.概要 || "计划已就绪", 
            adjustments: parsedRoot.调整说明 || "已基于历史数据自动调控", 
            feedbackRequired: parsedRoot.注意事项 || [], 
            rawContent: content 
          });
          
          setGenProgress(100);
          await new Promise(r => setTimeout(r, 400));
          setSelectedBodyPart(surveyBodyPart);
          setShowSurvey(false);
          setView('EXERCISES');
          setIsGenerating(false); 
      } else {
          throw new Error("解析数据格式失败。");
      }
    } catch (error: any) {
        console.error("Generate error:", error);
        addLog(`[错误] ${error.message || '网络或数据同步异常'}`);
        setGenError(true);
    }
  };

  const handleFinishWorkout = async (fatigueScore: number) => {
    setShowFatigueModal(false);
    setIsFinishing(true);
    try {
      const records = [];
      const dateStr = new Date().toISOString().split('T')[0];
      for (const ex of currentExercises) {
        const entryLogs = sessionLogs[ex.id];
        if (!entryLogs) continue;
        
        const valid = (entryLogs as SetLog[]).filter(l => l.weight > 0 || l.reps > 0);
        if (valid.length > 0) {
            records.push({ 
              body_part: selectedBodyPart?.id, 
              exercise: ex.name, 
              sets: valid.map((l, i) => ({ set: i+1, reps: l.reps, weight_kg: l.weight, rpe: l.rpe, note: l.note })), 
              date: dateStr 
            });
        }
      }
      if (records.length > 0) await supabase.from('workout_logs').insert(records);
      setView('SUMMARY');
    } catch (e) { alert("保存失败"); } finally { setIsFinishing(false); }
  };

  const addNewExercise = async (ex: { name: string }) => {
    const id = `manual_${Date.now()}`;
    setCurrentExercises(prev => [...prev, { id, name: ex.name, bodyPartId: selectedBodyPart?.id as any }]);
    setSessionLogs(prev => ({ ...prev, [id]: [{ id: `${id}_0`, weight: 0, reps: 0 }] }));
    setShowAddModal(false);

    // 同步到 exercise_library
    try {
      const { data: exists } = await supabase
        .from('exercise_library')
        .select('exercise_name')
        .eq('exercise_name', ex.name)
        .eq('body_part', selectedBodyPart?.name)
        .maybeSingle();
      
      if (!exists) {
        await supabase.from('exercise_library').insert({
          exercise_name: ex.name,
          body_part: selectedBodyPart?.name
        });
      }
    } catch (e) {
      console.error("同步动作库失败", e);
    }
  };

  return (
    <div className="h-screen w-full bg-slate-50 relative overflow-hidden text-slate-800 selection:bg-blue-100">
      <AnimatePresence mode="wait">
        {view === 'HOME' && <motion.div key="home" className="h-full" exit={{ opacity: 0, scale: 0.95 }}><HomeView onSelect={(p: BodyPart) => { setSurveyBodyPart(p); setShowSurvey(true); }} /></motion.div>}
        {view === 'EXERCISES' && selectedBodyPart && (
          <motion.div key="exercises" className="h-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <ExerciseListView bodyPart={selectedBodyPart} exercises={currentExercises} onSelect={(ex: Exercise) => { setSelectedExercise(ex); setView('SESSION'); }} onBack={() => setView('HOME')} onFinishWorkout={() => setShowFatigueModal(true)} completedIds={completedExercises} planDetails={aiPlanDetails || undefined} onShowDetails={() => setShowPlanDetails(true)} onAdd={() => setShowAddModal(true)} isFinishing={isFinishing} onDelete={(id: string) => setCurrentExercises(prev => prev.filter(e => e.id !== id))} />
          </motion.div>
        )}
        {view === 'SESSION' && selectedExercise && (
           <motion.div key="session" className="h-full flex flex-col" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             <Header title={selectedExercise.name} showBack onBack={() => { setSessionLogs(prev => ({ ...prev, [selectedExercise.id]: logs })); setView('EXERCISES'); }} />
             <div className="flex-1 overflow-y-auto p-4 no-scrollbar space-y-3">
                <Reorder.Group axis="y" values={logs} onReorder={setLogs} className="space-y-3">
                  {logs.map(log => (
                    <SetItem key={log.id} item={log} onDelete={() => setLogs(prev => prev.filter(l => l.id !== log.id))} onOpenPicker={(type: string, id: string, val: any) => setPickerState({ isOpen: true, type: type as any, setId: id, value: val })} />
                  ))}
                </Reorder.Group>
                <button onClick={() => setLogs(prev => [...prev, { id: String(Date.now()), weight: logs[logs.length-1]?.weight || 0, reps: logs[logs.length-1]?.reps || 0 }])} className="w-full py-4 rounded-[1.2rem] bg-white border-2 border-dashed border-slate-200 text-slate-400 font-black flex items-center justify-center gap-2 active:scale-95 transition-all text-xs tracking-widest uppercase"><Plus size={16} /> 添加组数</button>
             </div>
             <div className="p-6 pb-10 border-t border-slate-100 bg-white"><button onClick={() => { setSessionLogs(prev => ({ ...prev, [selectedExercise.id]: logs })); setCompletedExercises(prev => [...new Set([...prev, selectedExercise.id])]); setView('EXERCISES'); }} className="w-full py-5 bg-slate-900 text-white font-black rounded-[2rem] shadow-xl active:scale-95 transition-all text-sm tracking-widest uppercase">保存本次动作</button></div>
           </motion.div>
        )}
        {view === 'SUMMARY' && <motion.div className="h-full flex flex-col items-center justify-center bg-white p-6"><motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-yellow-100"><Trophy size={45} className="text-white" /></motion.div><h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter">训练存档完毕</h2><p className="text-slate-400 mb-12 text-center px-10 text-sm font-bold leading-relaxed">每一次肌肉的酸痛，都是迈向强大的阶梯。</p><button onClick={() => { setView('HOME'); setCompletedExercises([]); setSessionLogs({}); setAIPlanDetails(null); }} className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black shadow-2xl text-sm tracking-widest">回到控制台</button></motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {isGenerating && <LoadingLogger logs={loadingLogs} progress={genProgress} isError={genError} onRetry={() => { setGenError(false); setIsGenerating(false); }} />}
        {showSurvey && surveyBodyPart && !isGenerating && <SurveyModal onClose={() => setShowSurvey(false)} onGenerate={handleGeneratePlan} loading={isGenerating} />}
        {showPlanDetails && aiPlanDetails && <PlanDetailsModal details={aiPlanDetails} onClose={() => setShowPlanDetails(false)} />}
        {showFatigueModal && <FatigueModal onConfirm={handleFinishWorkout} loading={isFinishing} />}
        {showAddModal && <AddExerciseModal bodyPart={selectedBodyPart!} onClose={() => setShowAddModal(false)} onSelect={addNewExercise} />}
        {pickerState?.isOpen && <PickerManager state={pickerState} onClose={() => setPickerState(null)} onUpdate={(v: any) => {
            const { type, setId } = pickerState;
            setLogs(l => l.map(x => x.id === setId ? { ...x, [type]: v } : x));
        }} />}
      </AnimatePresence>
    </div>
  );
};

// --- Picker Components ---
const PickerManager = ({ state, onClose, onUpdate }: any) => {
  // 核心改动：如果是备注类型且当前值为空，默认设定为“主力组”
  const initialValue = state.value || (state.type === 'note' ? '主力组' : '');
  const [val, setVal] = useState(initialValue);
  const adjust = (amt: number) => setVal((p: any) => Math.max(0, Math.round((Number(p) + amt) * 10) / 10));

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[3rem] p-10 relative z-10 shadow-2xl border border-white/20">
        <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black tracking-tight">{state.type === 'weight' ? '重量 KG' : state.type === 'reps' ? '次数 REPS' : '详细备注'}</h3>
            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full active:scale-90 transition-all"><X size={20}/></button>
        </div>

        {state.type === 'weight' && (
          <div className="space-y-8">
            <div className="text-center py-6 bg-slate-50 rounded-[2rem]"><span className="text-5xl font-black text-slate-800 tabular-nums tracking-tighter">{val}</span></div>
            <div className="grid grid-cols-3 gap-3">
              {[-5, -2.5, -1, 1, 2.5, 5].map(v => <button key={v} onClick={() => adjust(v)} className="py-5 rounded-2xl bg-slate-50 font-black text-slate-500 active:bg-blue-600 active:text-white transition-all text-sm">{v > 0 ? `+${v}` : v}</button>)}
            </div>
          </div>
        )}

        {state.type === 'reps' && (
           <div className="grid grid-cols-5 gap-3 max-h-[35vh] overflow-y-auto no-scrollbar py-2">
             {Array.from({ length: 25 }, (_, i) => i + 1).map(v => <button key={v} onClick={() => { onUpdate(v); onClose(); }} className={`py-5 rounded-2xl font-black text-lg transition-all ${v === Number(val) ? 'bg-blue-600 text-white shadow-xl scale-110' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{v}</button>)}
           </div>
        )}

        {(state.type === 'rpe' || state.type === 'note') && (
            <div className="space-y-5">
               {state.type === 'rpe' ? (
                 <div className="grid grid-cols-3 gap-3">
                    {[6,7,8,9,10].map(v => <button key={v} onClick={() => { onUpdate(v); onClose(); }} className={`py-6 rounded-2xl font-black text-2xl ${v === Number(val) ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-50 text-slate-400'}`}>{v}</button>)}
                 </div>
               ) : (
                 <div className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                        {['主力组', '热身组', '冲击组', '离心慢放','控制', '停顿组'].map(tag => (
                          <button 
                            key={tag} 
                            onClick={() => setVal(tag)} 
                            className={`px-5 py-3.5 rounded-2xl font-black text-[10px] tracking-widest transition-all ${val === tag ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                          >
                            {tag}
                          </button>
                        ))}
                    </div>
                    {/* 移除 autoFocus 以防止键盘自动弹出，仅点击输入框时弹出 */}
                    <input 
                      value={val} 
                      onChange={e => setVal(e.target.value)} 
                      className="w-full p-6 bg-slate-50 rounded-2xl border-none outline-none font-black text-sm placeholder:text-slate-200" 
                      placeholder="点击标签或手动输入..." 
                    />
                 </div>
               )}
            </div>
        )}

        {(state.type === 'weight' || state.type === 'note') && (
          <button 
            onClick={() => { onUpdate(val); onClose(); }} 
            className="w-full mt-8 py-5 bg-slate-900 text-white font-black rounded-[1.8rem] shadow-xl active:scale-95 transition-all text-sm tracking-widest uppercase"
          >
            确认修改
          </button>
        )}
      </motion.div>
    </div>
  );
};

// --- Home View ---
const HomeView = ({ onSelect }: any) => (
  <div className="flex flex-col h-full overflow-hidden p-10 justify-center gap-14">
    <div className="text-center">
      <motion.h3 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-black text-slate-800 tracking-tighter"
      >
        今天练哪
      </motion.h3>
    </div>
    <div className="grid grid-cols-2 gap-7 max-w-sm mx-auto w-full">
      {BODY_PARTS.map((part, i) => (
        <motion.button 
          key={part.id} 
          onClick={() => onSelect(part)} 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: i * 0.08, type: 'spring', damping: 15 }} 
          className={`aspect-square rounded-[3rem] ${part.color} bg-opacity-20 flex flex-col items-center justify-center gap-4 border-[6px] border-white shadow-2xl shadow-slate-200/40 active:scale-95 active:shadow-sm transition-all`}
        >
          <span className="text-3xl font-black tracking-tight">{part.name}</span>
        </motion.button>
      ))}
    </div>
  </div>
);

// --- Survey Modal ---
const SurveyModal = ({ onClose, onGenerate, loading }: any) => {
  const [formData, setFormData] = useState({ sleep: '好', doms: '无感', domsPart: '' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
      <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-lg" onClick={loading ? undefined : onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-sm rounded-[3rem] overflow-hidden shadow-2xl border border-white/20">
        <div className="p-10 pb-4 flex justify-between items-center"><h3 className="text-xl font-black text-slate-800 tracking-tight">状态检查</h3><button onClick={onClose} className="p-2 bg-slate-50 rounded-full"><X size={18}/></button></div>
        <div className="px-10 pb-10 pt-4 space-y-8">
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] ml-1">昨晚睡眠</label>
            <div className="flex gap-3">
              {['差', '中', '好'].map(l => <button key={l} onClick={() => setFormData(p => ({ ...p, sleep: l }))} className={`flex-1 py-4 rounded-2xl border-2 font-black text-sm transition-all ${formData.sleep === l ? 'bg-slate-800 text-white border-slate-800 shadow-xl' : 'bg-white text-slate-300 border-slate-50 hover:border-slate-100'}`}>{l}</button>)}
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] ml-1">肌肉酸痛</label>
            <div className="flex gap-3">
              {['明显', '轻微', '无感'].map(l => <button key={l} onClick={() => setFormData(p => ({ ...p, doms: l, domsPart: l === '无感' ? '' : p.domsPart }))} className={`flex-1 py-4 rounded-2xl border-2 font-black text-sm transition-all ${formData.doms === l ? 'bg-slate-800 text-white border-slate-800 shadow-xl' : 'bg-white text-slate-300 border-slate-50 hover:border-slate-100'}`}>{l}</button>)}
            </div>
            
            <AnimatePresence>
              {(formData.doms === '轻微' || formData.doms === '明显') && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-3 pt-2"
                >
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">具体哪个部位酸痛？</label>
                  <div className="grid grid-cols-3 gap-2">
                    {BODY_PARTS.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => setFormData(f => ({ ...f, domsPart: p.name }))}
                        className={`py-3 rounded-xl text-xs font-black border-2 transition-all ${formData.domsPart === p.name ? 'bg-slate-100 border-slate-400 text-slate-800' : 'bg-slate-50 border-slate-50 text-slate-300'}`}
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
            disabled={loading || ((formData.doms === '轻微' || formData.doms === '明显') && !formData.domsPart)} 
            className="w-full mt-6 py-5 bg-blue-600 text-white font-black rounded-[2rem] shadow-2xl shadow-blue-200 active:scale-95 disabled:opacity-50 transition-all text-sm tracking-widest"
          >
            {loading ? "正在同步历史数据..." : "获取训练计划"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Plan Details Modal ---
const PlanDetailsModal = ({ details, onClose }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
    <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-lg" onClick={onClose} />
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-md rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[75vh]">
      <div className="bg-slate-900 p-8 text-white shrink-0 flex justify-between items-center">
        <div><h3 className="text-xl font-black tracking-tight">AI 智能教练透视</h3><p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Intelligence Insight</p></div>
        <button onClick={onClose} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X size={20} /></button>
      </div>
      <div className="p-8 overflow-y-auto space-y-8 bg-slate-50/50 flex-1 no-scrollbar">
        <section className="space-y-4"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">周期诊断</h4><p className="text-sm font-bold leading-relaxed bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-slate-700">{details.summary}</p></section>
        <section className="space-y-4"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">动态调整理由</h4><p className="text-sm font-bold leading-relaxed bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-slate-700">{details.adjustments}</p></section>
        {details.feedbackRequired.length > 0 && <section className="space-y-4"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">今日红线</h4><div className="space-y-3">{details.feedbackRequired.map((t: any, i: number) => <div key={i} className="p-5 bg-white rounded-2xl border border-slate-100 text-xs font-black text-slate-500 flex gap-4 items-center shadow-sm"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-100" />{t}</div>)}</div></section>}
      </div>
    </motion.div>
  </div>
);

// --- Exercise List View ---
const ExerciseListView = ({ bodyPart, exercises, onSelect, onBack, onFinishWorkout, completedIds, planDetails, onShowDetails, isFinishing, onDelete, onAdd }: any) => (
  <div className="flex flex-col h-full bg-slate-50">
    <Header 
        title={`${bodyPart.name}部 训练计划`} 
        showBack 
        onBack={onBack} 
        action={planDetails && <button onClick={onShowDetails} className="p-3 bg-blue-50 text-blue-600 rounded-2xl active:scale-90 transition-transform"><Info size={20} /></button>} 
    />
    <div className="flex-1 overflow-y-auto px-6 pb-40 no-scrollbar space-y-3 mt-4">
      {exercises.map((ex: any, i: number) => (
        <motion.div 
            key={ex.id} 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: i * 0.1, type: 'spring', damping: 20 }} 
            className="group relative"
        >
          <div className="absolute inset-0 bg-white rounded-[1.8rem] shadow-lg shadow-slate-200/20" />
          <div className="relative w-full rounded-[1.8rem] border border-slate-100/50 flex items-center p-3.5 gap-3.5 active:scale-[0.98] transition-all bg-white overflow-hidden">
            <button onClick={() => onSelect(ex)} className="flex-1 flex items-center gap-3.5 text-left">
              <div className={`w-10 h-10 rounded-[1.2rem] flex items-center justify-center transition-all duration-500 ${completedIds.includes(ex.id) ? 'bg-green-500 text-white shadow-xl shadow-green-100' : 'bg-slate-50 text-slate-200'}`}>
                <Check size={20} strokeWidth={4} />
              </div>
              <span className="text-lg font-black text-slate-900 tracking-tight leading-none pt-0.5">{ex.name}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(ex.id); }} className="p-2 text-slate-100 hover:text-rose-500 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
        </motion.div>
      ))}
      <button 
        onClick={onAdd}
        className="w-full py-4 rounded-[1.8rem] bg-slate-100/50 border-2 border-dashed border-slate-200 text-slate-400 font-black flex items-center justify-center gap-2 active:scale-95 transition-all text-xs tracking-widest uppercase"
      >
        <PlusCircle size={18} /> 添加动作
      </button>
    </div>
    <div className="fixed bottom-0 left-0 right-0 p-8 bg-white/70 backdrop-blur-xl border-t border-slate-100/30">
        <button onClick={onFinishWorkout} disabled={isFinishing} className="w-full py-5 bg-slate-900 text-white font-black text-2xl tracking-[0.25em] rounded-[2.5rem] shadow-2xl flex items-center justify-center gap-3 active:scale-95 active:shadow-sm transition-all">
            {isFinishing ? <Loader2 className="animate-spin" /> : <><Trophy size={24} className="text-yellow-400"/> 结束训练</>}
        </button>
    </div>
  </div>
);

// --- Add Exercise Modal ---
const AddExerciseModal = ({ bodyPart, onClose, onSelect }: { bodyPart: BodyPart, onClose: () => void, onSelect: (ex: { name: string }) => void }) => {
  const [customName, setCustomName] = useState('');
  const [library, setLibrary] = useState<{name: string}[]>([]);
  const [loadingLib, setLoadingLib] = useState(true);

  useEffect(() => {
    const fetchLib = async (bodyPartName: string) => {
      try {
        const { data } = await supabase
          .from('exercise_library')
          .select('exercise_name')
          .eq('body_part', bodyPartName)
          .order('exercise_name');
        
        if (data) {
          setLibrary(data.map((d: any) => ({ name: d.exercise_name })));
        }
      } catch (e) {
        console.error("加载动作库失败", e);
      } finally {
        setLoadingLib(false);
      }
    };
    fetchLib(bodyPart.name);
  }, [bodyPart.name]);

  const defaultEx = EXERCISES[bodyPart.id] || [];
  const combinedLibrary = Array.from(new Set([
    ...defaultEx.map(e => e.name),
    ...library.map(e => e.name)
  ]));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-lg" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-sm rounded-[3rem] overflow-hidden shadow-2xl border border-white/20 flex flex-col h-[75vh]">
        <div className="p-8 pb-4 flex justify-between items-center border-b border-slate-50 shrink-0">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">添加动作</h3>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-full active:scale-90 transition-all"><X size={18}/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">我的动作库</p>
            {loadingLib ? (
              <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-200" /></div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {combinedLibrary.length > 0 ? combinedLibrary.map(name => (
                  <button 
                    key={name} 
                    onClick={() => onSelect({ name })}
                    className="w-full p-5 rounded-2xl bg-slate-50 text-left font-black text-slate-700 hover:bg-slate-100 transition-colors flex justify-between items-center group active:scale-[0.98]"
                  >
                    <span className="truncate">{name}</span>
                    <Plus size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </button>
                )) : (
                  <p className="text-xs text-slate-300 text-center py-4 font-bold">库中暂无本部位动作</p>
                )}
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">手动添加新动作</p>
            <div className="flex gap-2">
              <input 
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="输入新动作名称..." 
                className="flex-1 p-5 bg-slate-50 rounded-2xl font-black text-sm outline-none border-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <button 
                onClick={() => customName && onSelect({ name: customName })}
                disabled={!customName}
                className="px-6 bg-slate-900 text-white rounded-2xl font-black active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center shadow-lg shadow-slate-200"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- Set Item ---
const SetItem = ({ item, onDelete, onOpenPicker }: any) => (
  <Reorder.Item value={item} id={item.id} className="flex items-center gap-2 mb-2 bg-white p-3 rounded-[1.5rem] border border-slate-100 shadow-sm active:shadow-xl transition-shadow">
    <div className="w-5 flex flex-col items-center justify-center gap-1 opacity-5 shrink-0">{[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-black" />)}</div>
    <div className="flex-1 grid grid-cols-4 gap-2">
      <button onClick={() => onOpenPicker('weight', item.id, item.weight)} className="bg-slate-50 rounded-xl py-2.5 font-black text-slate-800 relative text-sm tracking-tighter">{item.weight}<span className="absolute right-1 bottom-1 text-[6px] font-black opacity-10 uppercase tracking-tighter">KG</span></button>
      <button onClick={() => onOpenPicker('reps', item.id, item.reps)} className="bg-slate-50 rounded-xl py-2.5 font-black text-slate-800 relative text-sm tracking-tighter">{item.reps}<span className="absolute right-1 bottom-1 text-[6px] font-black opacity-10 uppercase tracking-tighter">Reps</span></button>
      <button onClick={() => onOpenPicker('note', item.id, item.note || '')} className={`rounded-xl py-2.5 font-black text-[9px] truncate px-1 tracking-widest ${item.note ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>{item.note || '备注'}</button>
      <button onClick={() => onOpenPicker('rpe', item.id, item.rpe || 0)} className="bg-slate-50 rounded-xl py-2.5 font-black text-slate-800 relative text-sm tracking-tighter">{item.rpe || '-'}<span className="absolute right-1 bottom-1 text-[6px] font-black opacity-10 uppercase tracking-tighter">Rpe</span></button>
    </div>
    <button onClick={onDelete} className="w-8 h-8 flex items-center justify-center text-slate-100 hover:text-rose-500 transition-colors"><X size={18} /></button>
  </Reorder.Item>
);

// --- Fatigue Modal ---
const FatigueModal = ({ onConfirm, loading }: any) => {
  const [score, setScore] = useState<number | null>(null);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
      <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-lg" />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-xs rounded-[3rem] p-12 text-center shadow-2xl">
        <h3 className="text-2xl font-black mb-2 tracking-tight">今日身体状态</h3>
        <p className="text-[10px] text-slate-400 font-black mb-10 uppercase tracking-[0.25em]">Self-Perception Rate</p>
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[6, 7, 8, 9, 10].map(v => <button key={v} onClick={() => setScore(v)} className={`py-5 rounded-2xl font-black text-2xl border-2 transition-all ${score === v ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-105' : 'bg-white border-slate-50 text-slate-200 hover:border-slate-100'}`}>{v}</button>)}
        </div>
        <button onClick={() => score && onConfirm(score)} disabled={!score || loading} className="w-full py-5 bg-blue-600 text-white font-black rounded-[2rem] shadow-2xl shadow-blue-200 active:scale-95 transition-all text-sm tracking-widest">
            {loading ? <Loader2 className="animate-spin mx-auto"/> : '确认并同步'}
        </button>
      </motion.div>
    </div>
  );
};

// --- Loading Logger Component ---
const LoadingLogger = ({ logs, isError, onRetry, progress }: { logs: string[], isError?: boolean, onRetry?: () => void, progress: number }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/10 backdrop-blur-xl">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-sm rounded-[3rem] overflow-hidden shadow-2xl flex flex-col h-[65vh] border border-white/40"
      >
        <div className="p-10 pb-4 bg-white shrink-0">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    {isError ? <AlertCircle className="w-5 h-5 text-rose-500" /> : <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
                    <span className={`font-black tracking-tight text-xl ${isError ? 'text-rose-600' : 'text-slate-800'}`}>
                      {isError ? '同步中断' : '获取训练计划中'}
                    </span>
                </div>
                {!isError && <span className="text-blue-600 font-black tabular-nums">{Math.round(progress)}%</span>}
            </div>
            
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                <motion.div 
                    className={`h-full ${isError ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", damping: 25 }}
                />
            </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-10 pb-10 font-bold text-[13px] text-slate-400 space-y-3 bg-slate-50/50 no-scrollbar pt-2">
            {logs.map((log, i) => (
                <div key={i} className="flex gap-4 items-start relative pl-4 border-l-2 border-slate-200/50 py-1">
                    <span className={`break-words leading-relaxed ${isError && i === logs.length - 1 ? 'text-rose-500 font-black' : 'text-slate-500'}`}>{log}</span>
                </div>
            ))}
            {isError && (
                <div className="pt-4">
                    <button onClick={onRetry} className="w-full py-5 bg-slate-800 text-white rounded-[1.8rem] font-black shadow-xl active:scale-95 transition-all text-sm tracking-widest uppercase">重试</button>
                </div>
            )}
        </div>
      </motion.div>
    </div>
  )
};

export default App;
