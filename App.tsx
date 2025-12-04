import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { ChevronLeft, CheckCircle2, X, Plus, Trash2, Trophy } from 'lucide-react';
import { BodyPart, Exercise, ViewState, SetLog } from './types';
import { BODY_PARTS, EXERCISES } from './data';

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

// --- View Components ---

/**
 * 1. Home View: Floating Bubbles
 */
const HomeView = ({ onSelect }: { onSelect: (part: BodyPart) => void }) => {
  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-slate-800 mb-8 text-center"
        >
          今天练哪里?
        </motion.h2>
        
        <div className="w-full max-w-md flex flex-wrap justify-center gap-6">
          {BODY_PARTS.map((part, index) => (
            <motion.button
              key={part.id}
              onClick={() => onSelect(part)}
              // Floating Animation
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: index * 0.4, // Stagger bubbles
              }}
              // Tap "Duang" Animation
              whileTap={{ 
                scale: 0.9, 
                transition: { type: "spring", stiffness: 400, damping: 10 } 
              }}
              // Hover state (for desktop)
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

/**
 * 2. Exercise List View
 */
const ExerciseListView = ({ 
  bodyPart, 
  onSelect, 
  onBack,
  onFinishWorkout,
  completedIds
}: { 
  bodyPart: BodyPart; 
  onSelect: (ex: Exercise) => void;
  onBack: () => void;
  onFinishWorkout: () => void;
  completedIds: string[];
}) => {
  const exercises = EXERCISES[bodyPart.id] || [];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <Header title={`${bodyPart.name}部训练`} showBack onBack={onBack} />
      
      <div className="flex-1 overflow-y-auto px-4 pb-4 no-scrollbar">
        <div className="space-y-3 pt-2 pb-24">
          {exercises.map((ex, index) => {
            const isCompleted = completedIds.includes(ex.id);
            return (
              <motion.button
                key={ex.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(ex)}
                className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <CheckCircle2 
                    size={24} 
                    className={`${isCompleted ? "text-green-500 fill-green-50" : "text-slate-200"}`}
                  />
                  <span className="text-lg font-medium text-slate-700">{ex.name}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                   <ChevronLeft className="w-5 h-5 rotate-180" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Fixed Finish Workout Button */}
      <div className="bg-white border-t border-slate-100 p-4 pb-8 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-20">
        <button
          onClick={onFinishWorkout}
          className="w-full py-4 bg-slate-800 text-white text-lg font-semibold rounded-2xl shadow-lg shadow-slate-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <Trophy size={20} className="text-yellow-400" />
          完成今日训练
        </button>
      </div>
    </div>
  );
};

// Draggable Set Item Component
const SetItem: React.FC<{ item: SetLog, onDelete: () => void }> = ({ item, onDelete }) => {
  return (
    <Reorder.Item
      value={item}
      id={item.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      whileDrag={{ scale: 1.02, zIndex: 50 }}
      className="w-full relative touch-none"
    >
      <div className="flex items-center gap-3 w-full">
         {/* Main Content: Display Only, Hold to Drag */}
         <div
            className="flex-1 bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between select-none"
         >
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-800 tracking-tight">
                {item.weight}
                <span className="text-sm font-medium text-slate-400 ml-1">kg</span>
              </span>
              <span className="text-slate-300 mx-1">×</span>
              <span className="text-2xl font-bold text-slate-800 tracking-tight">
                {item.reps}
                <span className="text-sm font-medium text-slate-400 ml-1">次</span>
              </span>
            </div>
            <div className="text-xs text-slate-300 font-medium bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              按住拖动
            </div>
         </div>
         
         {/* Delete Button */}
         <button 
           onClick={(e) => { e.stopPropagation(); onDelete(); }}
           className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl text-slate-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 border border-slate-100 transition-colors shadow-sm"
         >
           <X size={20} />
         </button>
      </div>
    </Reorder.Item>
  );
};

/**
 * 3. Session View (Weight -> Reps -> List)
 */

interface SessionViewProps {
  exercise: Exercise;
  lastWeight: number;
  sets: SetLog[];
  onUpdateSets: (sets: SetLog[]) => void;
  onFinish: () => void;
  onBack: () => void;
}

const SessionView = ({ 
  exercise, 
  lastWeight, 
  sets,
  onUpdateSets,
  onFinish,
  onBack 
}: SessionViewProps) => {
  const [step, setStep] = useState<'WEIGHT' | 'REPS'>('WEIGHT');
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);

  // Generate weight options: [last-10 ... last+10]
  const baseWeight = lastWeight > 0 ? lastWeight : 40;
  const weightOptions = [
    baseWeight - 10,
    baseWeight - 5,
    baseWeight,
    baseWeight + 2.5,
    baseWeight + 5,
    baseWeight + 10
  ].filter(w => w > 0);
  const uniqueWeightOptions = Array.from(new Set(weightOptions)).sort((a, b) => a - b);

  // Generate rep options (3 to 15)
  const repOptions = Array.from({ length: 13 }, (_, i) => i + 3);

  const handleWeightSelect = (w: number) => {
    setCurrentWeight(w);
    setStep('REPS');
  };

  const handleRepSelect = (r: number) => {
    if (currentWeight) {
      const newSet: SetLog = {
        id: Date.now().toString(),
        weight: currentWeight,
        reps: r
      };
      onUpdateSets([...sets, newSet]);
      setStep('WEIGHT');
      setCurrentWeight(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <Header 
        title={exercise.name} 
        showBack 
        onBack={onBack}
        action={
          <button
            onClick={onFinish}
            disabled={sets.length === 0}
            className="text-blue-600 font-semibold text-base active:opacity-70 disabled:opacity-30 disabled:pointer-events-none transition-opacity"
          >
            完成
          </button>
        }
      />

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
         <div className="px-6 py-6 pb-48">
            {sets.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center opacity-40 pointer-events-none">
                <div className="w-20 h-20 rounded-[2rem] bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-base font-medium text-slate-500">添加第一组训练</p>
              </div>
            ) : (
              <Reorder.Group axis="y" values={sets} onReorder={onUpdateSets} className="space-y-3">
                 <AnimatePresence initial={false} mode="popLayout">
                   {sets.map(set => (
                     <SetItem 
                        key={set.id} 
                        item={set} 
                        onDelete={() => onUpdateSets(sets.filter(s => s.id !== set.id))}
                     />
                   ))}
                 </AnimatePresence>
              </Reorder.Group>
            )}
         </div>
      </div>

      {/* Controls Area (Fixed Bottom Sheet) */}
      <div className="bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20 overflow-hidden relative border-t border-slate-50">
        
        {/* Selector Logic */}
        <div className="p-6 pt-8 pb-10">
          <AnimatePresence mode="wait" initial={false}>
            
            {step === 'WEIGHT' ? (
              <motion.div
                key="weight-selector"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ ease: "easeInOut", duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">选择重量</span>
                  <span className="text-xs text-slate-300">自动推荐 ±10kg</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {uniqueWeightOptions.map((weight) => (
                    <button
                      key={weight}
                      onClick={() => handleWeightSelect(weight)}
                      className="h-16 bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all rounded-2xl border border-slate-100 text-xl font-bold text-slate-700 flex items-center justify-center"
                    >
                      {weight}<span className="text-xs font-normal ml-1 opacity-50">kg</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="rep-selector"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ ease: "easeInOut", duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">
                    <span className="text-slate-800 font-bold mr-2">{currentWeight}kg</span> 
                    选择次数
                  </span>
                  <button onClick={() => setStep('WEIGHT')} className="p-1 -mr-1 rounded-full hover:bg-slate-100">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {repOptions.map((rep) => (
                    <button
                      key={rep}
                      onClick={() => handleRepSelect(rep)}
                      className="aspect-square bg-slate-50 hover:bg-blue-50 active:bg-blue-100 active:scale-95 transition-all rounded-xl border border-slate-100 text-lg font-bold text-slate-700 hover:text-blue-600 flex items-center justify-center"
                    >
                      {rep}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};


/**
 * 4. Success View
 */
const SuccessView = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col h-full items-center justify-center bg-white/95 backdrop-blur-xl z-50">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center text-green-500 mb-6 shadow-sm"
      >
        <CheckCircle2 size={48} strokeWidth={2.5} />
      </motion.div>
      <motion.h2 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold text-slate-800"
      >
        训练完成
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-slate-400 mt-2"
      >
        数据已保存
      </motion.p>
    </div>
  );
}

// --- Main App Logic ---

const App = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [selectedPart, setSelectedPart] = useState<BodyPart | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [history, setHistory] = useState<Record<string, number>>({});
  // Log Drafts: Persist sets for exercises until explicitly cleared
  const [sessionLogs, setSessionLogs] = useState<Record<string, SetLog[]>>({});
  // Completed Exercises for the day
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);

  // Load data from local storage
  useEffect(() => {
    const savedHistory = localStorage.getItem('bubblelift_history');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) {}
    }
    const savedLogs = localStorage.getItem('bubblelift_logs');
    if (savedLogs) {
      try { setSessionLogs(JSON.parse(savedLogs)); } catch (e) {}
    }
    const savedCompleted = localStorage.getItem('bubblelift_completed');
    if (savedCompleted) {
      try { setCompletedExercises(JSON.parse(savedCompleted)); } catch (e) {}
    }
  }, []);

  // Save logs to storage
  useEffect(() => {
    if (Object.keys(sessionLogs).length > 0) {
      localStorage.setItem('bubblelift_logs', JSON.stringify(sessionLogs));
    }
  }, [sessionLogs]);

  // Save completed exercises to storage
  useEffect(() => {
    localStorage.setItem('bubblelift_completed', JSON.stringify(completedExercises));
  }, [completedExercises]);

  const handleSelectPart = (part: BodyPart) => {
    setSelectedPart(part);
    setView('EXERCISES');
  };

  const handleSelectExercise = (ex: Exercise) => {
    setSelectedExercise(ex);
    setView('SESSION');
  };

  const handleUpdateSets = (sets: SetLog[]) => {
    if (!selectedExercise) return;
    setSessionLogs(prev => ({
      ...prev,
      [selectedExercise.id]: sets
    }));
  };

  const handleFinishSession = () => {
    if (!selectedExercise) return;
    
    // Get current logs from app state
    const currentSets = sessionLogs[selectedExercise.id] || [];

    if (currentSets.length > 0) {
      const lastWeightUsed = currentSets[currentSets.length - 1].weight;
      const newHistory = { ...history, [selectedExercise.id]: lastWeightUsed };
      setHistory(newHistory);
      localStorage.setItem('bubblelift_history', JSON.stringify(newHistory));
      
      // Mark as completed
      setCompletedExercises(prev => {
        if (prev.includes(selectedExercise.id)) return prev;
        return [...prev, selectedExercise.id];
      });

      setView('SUCCESS');
    } else {
      setView('EXERCISES');
    }
  };

  const handleSuccessComplete = () => {
    // Navigate back to the Exercise List for the current body part
    setView('EXERCISES');
    // We do NOT clear sessionLogs here as requested
    setSelectedExercise(null);
  };

  const handleFinishWorkout = () => {
     // User is done with the entire workout for the body part
     // Reset completed exercises for the day
     setCompletedExercises([]);
     setSelectedPart(null);
     setSelectedExercise(null);
     setView('HOME');
  };

  const getLastWeight = (exerciseId: string) => {
    return history[exerciseId] || 0;
  };

  // Page Transition variants
  const variants = {
    enter: { opacity: 0, scale: 0.98, filter: 'blur(8px)' },
    center: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 1.02, filter: 'blur(8px)' },
  };

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-slate-50 relative shadow-2xl overflow-hidden font-sans text-slate-900 select-none">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-blue-100/40 blur-3xl pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-100/40 blur-3xl pointer-events-none mix-blend-multiply" />

      <AnimatePresence mode="wait">
        {view === 'HOME' && (
          <motion.div
            key="home"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }} 
            className="h-full w-full absolute top-0 left-0"
          >
            <HomeView onSelect={handleSelectPart} />
          </motion.div>
        )}

        {view === 'EXERCISES' && selectedPart && (
          <motion.div
            key="exercises"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="h-full w-full absolute top-0 left-0"
          >
            <ExerciseListView 
              bodyPart={selectedPart} 
              onSelect={handleSelectExercise}
              onBack={() => setView('HOME')}
              onFinishWorkout={handleFinishWorkout}
              completedIds={completedExercises}
            />
          </motion.div>
        )}

        {view === 'SESSION' && selectedExercise && (
          <motion.div
            key="session"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="h-full w-full absolute top-0 left-0"
          >
            <SessionView 
              exercise={selectedExercise}
              lastWeight={getLastWeight(selectedExercise.id)}
              sets={sessionLogs[selectedExercise.id] || []}
              onUpdateSets={handleUpdateSets}
              onFinish={handleFinishSession}
              onBack={() => setView('EXERCISES')}
            />
          </motion.div>
        )}

        {view === 'SUCCESS' && (
          <motion.div
            key="success"
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="h-full w-full absolute top-0 left-0 z-50"
          >
            <SuccessView onComplete={handleSuccessComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;