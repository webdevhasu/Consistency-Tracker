import React, { useState, useEffect } from 'react';
import { View } from '../App';
import { getStore, saveStore } from '../lib/store';
import { DailyIntention } from '../types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Target, CheckCircle2, Clock, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const EXAMPLES = [
  'Aaj main social media nahi kholunga',
  'WhatsApp sirf 2 baar check karunga',
  'Bina phone ke 2 ghante kaam karunga',
  'Aaj extra sugar nahi lunga',
  'Raat 11 baje so jaunga',
  'Subah uthke 10 minute meditate karunga',
];

export default function DailyIntentionPage({ onViewChange: _onViewChange }: { onViewChange: (v: View) => void }) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [intentions, setIntentions] = useState<DailyIntention[]>([]);
  const [inputText, setInputText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [exampleIdx] = useState(() => Math.floor(Math.random() * EXAMPLES.length));

  const reload = () => {
    const store = getStore();
    setIntentions(store.dailyIntentions ?? []);
  };

  useEffect(() => { reload(); }, []);

  const todayIntention = intentions.find(i => i.date === todayStr) ?? null;
  const past = intentions
    .filter(i => i.date !== todayStr)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);

  const saveIntention = () => {
    if (!inputText.trim()) return;
    const store = getStore();
    const newIntention: DailyIntention = {
      id: `di_${Date.now()}`,
      date: todayStr,
      text: inputText.trim(),
      completed: false,
    };
    const updated = [...(store.dailyIntentions ?? []).filter(i => i.date !== todayStr), newIntention];
    saveStore({ ...store, dailyIntentions: updated });
    setIntentions(updated);
    setInputText('');
  };

  const markDone = () => {
    const store = getStore();
    const updated = (store.dailyIntentions ?? []).map(i =>
      i.date === todayStr ? { ...i, completed: true, completedAt: Date.now() } : i
    );
    saveStore({ ...store, dailyIntentions: updated });
    setIntentions(updated);
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#7c3aed', '#a78bfa', '#22c55e', '#ffffff'] });
  };

  const editIntention = () => {
    if (!todayIntention) return;
    setInputText(todayIntention.text);
    const store = getStore();
    const updated = (store.dailyIntentions ?? []).filter(i => i.date !== todayStr);
    saveStore({ ...store, dailyIntentions: updated });
    setIntentions(updated);
  };

  const doneCount = past.filter(i => i.completed).length;
  const totalPast = past.length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-5 pb-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" /> Today's Intention
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      {/* Today's card */}
      <AnimatePresence mode="wait">
        {todayIntention ? (
          <motion.div key="set" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}>
            <Card className={`p-5 border-2 ${todayIntention.completed ? 'border-green-500/30 bg-green-500/5' : 'border-primary/30 bg-primary/5'}`}>
              <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${todayIntention.completed ? 'text-green-400' : 'text-primary'}`}>
                {todayIntention.completed ? '✓ Aaj ka commitment pura hua!' : 'Aaj ka commitment'}
              </p>
              <p className={`text-xl font-semibold leading-snug ${todayIntention.completed ? 'line-through text-muted-foreground' : 'text-white'}`}>
                {todayIntention.text}
              </p>

              {!todayIntention.completed ? (
                <div className="flex gap-2 mt-4">
                  <Button onClick={markDone} className="flex-1 gap-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Done!
                  </Button>
                  <Button onClick={editIntention} variant="outline" size="sm" className="px-4 rounded-xl border-border text-muted-foreground">
                    Edit
                  </Button>
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2 text-green-400 text-sm font-semibold">
                  <Sparkles className="w-4 h-4" /> Great work! Be ready for tomorrow.
                </div>
              )}
            </Card>
          </motion.div>
        ) : (
          <motion.div key="input" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}>
            <Card className="p-5 space-y-4">
              <div>
                <p className="text-sm font-semibold text-white mb-1">Aaj ka commitment kya hai?</p>
                <p className="text-xs text-muted-foreground">Ek cheez — specific, achievable, measurable.</p>
              </div>

              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={`Misal: ${EXAMPLES[exampleIdx]}`}
                className="w-full h-28 px-3 py-2.5 text-sm bg-background border border-border rounded-xl resize-none text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) saveIntention(); }}
              />

              <Button
                onClick={saveIntention}
                disabled={!inputText.trim()}
                className="w-full gap-2 rounded-xl font-bold h-12"
              >
                <Target className="w-4 h-4" /> Set Today's Intention
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      {totalPast > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-white">{doneCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Completed</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-white">{totalPast > 0 ? Math.round((doneCount / totalPast) * 100) : 0}%</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Success Rate</p>
          </Card>
        </div>
      )}

      {/* History */}
      {past.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(h => !h)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pichle {past.length} din</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {past.map(i => (
                  <div
                    key={i.id}
                    className={`p-3 rounded-xl border text-sm ${i.completed ? 'border-green-500/20 bg-green-500/5' : 'border-border bg-card'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`flex-1 text-sm ${i.completed ? 'line-through text-muted-foreground' : 'text-white'}`}>{i.text}</p>
                      <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${i.completed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                        {i.completed ? 'DONE' : 'MISS'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(i.date + 'T12:00:00'), 'EEE, MMM d')}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
