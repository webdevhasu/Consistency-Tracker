import React, { useState, useEffect, useMemo } from 'react';
import { View } from '../App';
import { getStore, saveStore } from '../lib/store';
import { Challenge } from '../types';
import { format, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { TOPIC_COLORS, DIFFICULTY_COLORS, getTopicLabel } from '@/lib/utils';
import { CheckCircle2, Circle, CalendarDays, ChevronRight, Home, Sparkles, XCircle } from 'lucide-react';

const MOODS = [
  { key: 'bad',     emoji: '😔', label: 'Rough' },
  { key: 'neutral', emoji: '😐', label: 'Okay' },
  { key: 'good',    emoji: '🙂', label: 'Good' },
  { key: 'great',   emoji: '😄', label: 'Great' },
] as const;

const MOTIVATIONAL_QUOTES = [
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { quote: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { quote: "Act as if what you do makes a difference. It does.", author: "William James" },
  { quote: "Success is not final, failure is not fatal — it is the courage to continue that counts.", author: "Winston Churchill" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { quote: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { quote: "The harder the conflict, the greater the triumph.", author: "George Washington" },
  { quote: "What you get by achieving your goals is not as important as what you become.", author: "Thoreau" },
  { quote: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { quote: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
  { quote: "Perseverance is not a long race; it is many short races one after the other.", author: "Walter Elliot" },
  { quote: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { quote: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { quote: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
  { quote: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  { quote: "The pain you feel today will be the strength you feel tomorrow.", author: "Arnold Schwarzenegger" },
  { quote: "Champions aren't made in the gyms. Champions are made from something deep inside them.", author: "Muhammad Ali" },
  { quote: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
];

export default function CheckIn({ onViewChange }: { onViewChange: (v: View) => void }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());
  const [failedTasks, setFailedTasks] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [mood, setMood] = useState<'great' | 'good' | 'neutral' | 'bad' | null>(null);
  const [isYesterday, setIsYesterday] = useState(false);
  const [saved, setSaved] = useState(false);

  // Pick one random quote per page mount — stays stable during the session
  const dailyQuote = useMemo(() => {
    return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
  }, []);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
  const activeDate = isYesterday ? yesterdayStr : todayStr;

  useEffect(() => {
    const store = getStore();
    if (store.activeChallengeId) {
      const active = store.challenges.find(c => c.id === store.activeChallengeId);
      if (active) {
        setChallenge(active);
        const log = active.logs.find(l => l.date === activeDate);
        if (log) {
          setCheckedTasks(new Set(log.completedTasks));
          const failedObj: Record<string, string> = {};
          if (log.failedTasks) {
            log.failedTasks.forEach(ft => { failedObj[ft.id] = ft.reason; });
          }
          setFailedTasks(failedObj);
          setNote(log.note || '');
          setMood(log.mood ?? null);
        } else {
          setCheckedTasks(new Set());
          setFailedTasks({});
          setNote('');
          setMood(null);
        }
      }
    }
  }, [activeDate]);

  if (!challenge) return null;

  const numTasks = challenge.tasks.length;
  const checkedCount = checkedTasks.size;
  const failedCount = Object.keys(failedTasks).length;
  const totalMarked = checkedCount + failedCount;
  const allMarked = totalMarked === numTasks;
  const allDone = checkedCount === numTasks;
  const progressPct = Math.round((checkedCount / numTasks) * 100);

  const todayLog = challenge.logs.find(l => l.date === todayStr);
  const yesterdayLog = challenge.logs.find(l => l.date === yesterdayStr);
  const showYesterdayOffer = !isYesterday && !todayLog && !yesterdayLog;

  const getTaskCompletionRate = (taskId: string) => {
    if (challenge.logs.length === 0) return 0;
    const done = challenge.logs.filter(l => l.completedTasks.includes(taskId)).length;
    return Math.round((done / challenge.logs.length) * 100);
  };

  const markDone = (taskId: string) => {
    const nextChecked = new Set(checkedTasks);
    if (nextChecked.has(taskId)) {
      nextChecked.delete(taskId);
    } else {
      nextChecked.add(taskId);
      setFailedTasks(prev => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
    }
    setCheckedTasks(nextChecked);
    setSaved(false);
  };

  const markFailed = (taskId: string) => {
    setFailedTasks(prev => {
      const next = { ...prev };
      if (taskId in next) {
         delete next[taskId];
      } else {
         next[taskId] = '';
         const nextChecked = new Set(checkedTasks);
         nextChecked.delete(taskId);
         setCheckedTasks(nextChecked);
      }
      return next;
    });
    setSaved(false);
  };

  const updateFailedReason = (taskId: string, reason: string) => {
    setFailedTasks(prev => ({ ...prev, [taskId]: reason }));
    setSaved(false);
  };

  const saveCheckIn = () => {
    const store = getStore();
    const active = store.challenges.find(c => c.id === challenge.id);
    if (!active) return;

    const newLog = {
      date: activeDate,
      completedTasks: Array.from(checkedTasks),
      failedTasks: Object.entries(failedTasks).map(([id, reason]) => ({ id, reason })),
      note,
      mood: mood ?? 'neutral',
      timestamp: Date.now(),
    };

    const logIndex = active.logs.findIndex(l => l.date === activeDate);
    if (logIndex >= 0) active.logs[logIndex] = newLog;
    else active.logs.push(newLog);

    saveStore(store);
    setSaved(true);

    if (allDone) {
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.55 }, colors: ['#7c3aed', '#a78bfa', '#ffffff', '#fbbf24'] });
    }
    // No auto-redirect — stay on page until user navigates away
  };

  const displayDate = isYesterday
    ? format(subDays(today, 1), 'EEEE, MMMM d')
    : format(today, 'EEEE, MMMM d');

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="space-y-4 pb-8">

      {/* Yesterday banner */}
      {showYesterdayOffer && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
        >
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <CalendarDays className="w-4 h-4" />
            <span>Missed yesterday? You can still log it.</span>
          </div>
          <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 h-7 px-3 text-xs" onClick={() => setIsYesterday(true)}>
            Log it <ChevronRight className="w-3 h-3 ml-0.5" />
          </Button>
        </motion.div>
      )}

      {isYesterday && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <span className="text-blue-400 text-sm font-medium">📅 Logging for: Yesterday</span>
          <Button variant="ghost" size="sm" className="text-blue-400 h-7 px-3 text-xs" onClick={() => setIsYesterday(false)}>
            Back to today
          </Button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Daily Check-In</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{displayDate}</p>
      </div>

      {/* Random motivational quote */}
      <Card className="p-4 bg-primary/5 border-primary/20 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm italic text-primary/90 leading-relaxed">&ldquo;{dailyQuote.quote}&rdquo;</p>
          <p className="text-xs text-muted-foreground mt-1.5 font-medium">— {dailyQuote.author}</p>
        </div>
      </Card>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-muted-foreground">
          <span>{checkedCount} of {numTasks} tasks</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Task cards */}
      <div className="space-y-2.5">
        {challenge.tasks.map((task, i) => {
          const isChecked = checkedTasks.has(task.id);
          const tc = TOPIC_COLORS[task.topic] ?? TOPIC_COLORS['Health'];
          const dc = DIFFICULTY_COLORS[task.difficulty] ?? DIFFICULTY_COLORS['Medium'];
          const rate = getTaskCompletionRate(task.id);

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div
                data-testid={`task-card-${task.id}`}
                className={`flex flex-col p-4 rounded-2xl border transition-all duration-200 ${
                  isChecked
                    ? 'border-primary/40 bg-primary/5 shadow-[0_0_20px_-8px_hsl(var(--primary))]'
                    : failedTasks[task.id] !== undefined
                      ? 'border-destructive/40 bg-destructive/5'
                      : 'border-border bg-card hover:border-border/80 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => markDone(task.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                      title="Mark Complete"
                    >
                      {isChecked
                        ? <CheckCircle2 className="w-7 h-7 text-primary" strokeWidth={2.5} />
                        : <Circle className="w-7 h-7 text-muted-foreground/40" strokeWidth={1.5} />
                      }
                    </button>
                    <button
                      type="button"
                      onClick={() => markFailed(task.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                      title="Mark Incomplete"
                    >
                      {failedTasks[task.id] !== undefined
                        ? <XCircle className="w-7 h-7 text-destructive" strokeWidth={2.5} />
                        : <XCircle className="w-7 h-7 text-muted-foreground/40" strokeWidth={1.5} />
                      }
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${tc.bg} ${tc.text} ${tc.border}`}>
                        {getTopicLabel(task.topic, task.customTopic)}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${dc.bg} ${dc.text}`}>
                        {task.difficulty}
                      </span>
                    </div>
                    <p className={`mt-1 text-base font-semibold transition-all ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.name}
                    </p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5 leading-relaxed">{task.description}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground/50 mt-1">{rate}% completion rate</p>
                  </div>
                </div>
                {failedTasks[task.id] !== undefined && (
                  <div className="mt-3 pl-[4.5rem] pr-2">
                    <input
                      type="text"
                      placeholder="Reason for not completing?"
                      value={failedTasks[task.id]}
                      onChange={(e) => updateFailedReason(task.id, e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Celebration card */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-600/10 border border-primary/30 text-center"
          >
            <div className="text-3xl mb-2">🔥</div>
            <p className="text-white font-bold text-lg">Perfect Day!</p>
            <p className="text-muted-foreground text-sm mt-1">Every single task done. That&apos;s discipline.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mood selector */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">How was today?</p>
        <div className="grid grid-cols-4 gap-2">
          {MOODS.map(m => (
            <button
              key={m.key}
              data-testid={`mood-${m.key}`}
              onClick={() => setMood(m.key)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                mood === m.key
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-white/5'
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Notes (optional)</p>
        <Textarea
          data-testid="input-note"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Reflections, struggles, wins..."
          className="bg-card resize-none h-24 text-sm"
        />
      </div>

      {/* Save / Back buttons */}
      <div className="space-y-3">
        <Button
          data-testid="button-save-checkin"
          onClick={saveCheckIn}
          disabled={(checkedCount === 0 && failedCount === 0) || saved}
          size="lg"
          className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/20"
        >
          {saved ? '✓ Saved!' : allDone ? 'Perfect Day ✓' : allMarked ? 'Complete Check-In' : `Save Progress (${totalMarked}/${numTasks})`}
        </Button>

        {saved && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <Button
              data-testid="button-go-home"
              variant="secondary"
              size="lg"
              onClick={() => onViewChange('home')}
              className="w-full h-12 font-semibold gap-2 rounded-2xl"
            >
              <Home className="w-4 h-4" /> Back to Home
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
