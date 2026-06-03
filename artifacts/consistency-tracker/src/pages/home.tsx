import React, { useState, useEffect, useMemo } from 'react';
import { View } from '../App';
import { getStore } from '../lib/store';
import { Challenge, DailyIntention } from '../types';
import { format, differenceInDays, parseISO, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Clock, Percent, CheckCircle2, TrendingDown, Flame, TrendingUp, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { getQuoteForProgress } from '@/lib/utils';

export default function Home({ onViewChange }: { onViewChange: (v: View) => void }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [todayIntention, setTodayIntention] = useState<DailyIntention | null>(null);

  useEffect(() => {
    const store = getStore();
    if (store.activeChallengeId) {
      const active = store.challenges.find(c => c.id === store.activeChallengeId);
      if (active) setChallenge(active);
    }
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setTodayIntention(store.dailyIntentions?.find(i => i.date === todayStr) ?? null);
  }, []);

  const stats = useMemo(() => {
    if (!challenge) return null;
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
    const startDate = parseISO(challenge.startDate);
    const numTasks = challenge.tasks.length;
    const dayIndex = Math.max(1, differenceInDays(today, startDate) + 1);
    const daysLeft = Math.max(0, challenge.durationDays - dayIndex + 1);

    const todayLog = challenge.logs.find(l => l.date === todayStr);
    const yesterdayLog = challenge.logs.find(l => l.date === yesterdayStr);
    const doneToday = (todayLog?.completedTasks.length ?? 0) === numTasks;
    const missedYesterday = !yesterdayLog || yesterdayLog.completedTasks.length < numTasks;

    const perfectDays = challenge.logs.filter(l => l.completedTasks.length === numTasks).length;
    const totalPossibleTicks = Math.max(1, challenge.logs.length * numTasks);
    const totalTicks = challenge.logs.reduce((sum, l) => sum + l.completedTasks.length, 0);
    const consistencyPct = Math.round((totalTicks / totalPossibleTicks) * 100);
    const challengeProgressPct = Math.round((perfectDays / challenge.durationDays) * 100);

    // Streak
    let streak = 0;
    const sortedLogs = [...challenge.logs].sort((a, b) => b.date.localeCompare(a.date));
    for (const log of sortedLogs) {
      if (log.completedTasks.length === numTasks) streak++;
      else break;
    }

    // Weakest task
    const taskCompletion = challenge.tasks.map(task => {
      const done = challenge.logs.filter(l => l.completedTasks.includes(task.id)).length;
      return { task, pct: challenge.logs.length > 0 ? Math.round((done / challenge.logs.length) * 100) : 0 };
    });
    const weakest = [...taskCompletion].sort((a, b) => a.pct - b.pct)[0];

    // Forecast
    const daysPassed = Math.max(1, differenceInDays(today, startDate) + 1);
    const forecastPct = Math.round((consistencyPct / 100) * 100);

    return { todayStr, todayLog, doneToday, dayIndex, daysLeft, perfectDays, consistencyPct, challengeProgressPct, streak, weakest, forecastPct, numTasks };
  }, [challenge]);

  if (!challenge || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
          <Flame className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Start Your Journey</h1>
        <p className="text-muted-foreground mb-8 max-w-xs">Define your challenge, build your habits, and track every day until you become who you want to be.</p>
        <Button onClick={() => onViewChange('create')} size="lg" className="px-10 rounded-full h-14 text-base font-bold shadow-lg shadow-primary/30">
          Create Your Challenge 🚀
        </Button>
      </div>
    );
  }

  const { doneToday, dayIndex, daysLeft, perfectDays, consistencyPct, challengeProgressPct, streak, weakest, forecastPct } = stats;
  const quote = getQuoteForProgress(challengeProgressPct);

  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const dashoffset = circ - (circ * challengeProgressPct) / 100;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-4">

      {/* Challenge header */}
      <Card className="p-5 bg-card border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Active Challenge</p>
            <h2 className="text-2xl font-bold text-white leading-tight">{challenge.name}</h2>
          </div>
          <span className="shrink-0 text-xs font-bold bg-primary/15 text-primary px-3 py-1 rounded-full border border-primary/20">
            Day {Math.min(dayIndex, challenge.durationDays)}
          </span>
        </div>
        <p className="text-muted-foreground italic text-sm border-l-2 border-primary pl-3 mb-4">&ldquo;{quote}&rdquo;</p>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>{perfectDays} perfect days</span>
            <span>{challengeProgressPct}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${challengeProgressPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </Card>

      {/* Progress ring + streak */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 flex flex-col items-center justify-center">
          <svg className="w-[140px] h-[140px] -rotate-90" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
            <motion.circle
              cx="64" cy="64" r={radius} fill="none"
              stroke="hsl(var(--primary))" strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: dashoffset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-bold text-white">{challengeProgressPct}%</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Done</span>
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Card className="flex-1 p-4 flex flex-col items-center justify-center text-center gap-1">
            <span className="text-3xl font-bold text-white">🔥 {streak}</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Day Streak</span>
          </Card>
          <Card className="flex-1 p-4 flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white">{daysLeft}</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Days Left</span>
            </div>
            <Clock className="w-5 h-5 text-muted-foreground/50" />
          </Card>
        </div>
      </div>

      {/* 3 quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 flex flex-col items-center text-center gap-1">
          <Percent className="w-4 h-4 text-muted-foreground mb-1" />
          <span className="text-lg font-bold text-white">{consistencyPct}%</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Consistency</span>
        </Card>
        <Card className="p-3 flex flex-col items-center text-center gap-1">
          <CheckCircle2 className="w-4 h-4 text-muted-foreground mb-1" />
          <span className="text-lg font-bold text-white">{perfectDays}</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Perfect Days</span>
        </Card>
        <Card className="p-3 flex flex-col items-center text-center gap-1">
          <TrendingUp className="w-4 h-4 text-muted-foreground mb-1" />
          <span className="text-lg font-bold text-white">{forecastPct}%</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Forecast</span>
        </Card>
      </div>

      {/* Smart banners */}
      {streak > 7 && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium">
          <Flame className="w-5 h-5 shrink-0" />
          <span>You&apos;re on fire! {streak}-day streak 🔥 Keep it going.</span>
        </motion.div>
      )}
      {weakest && weakest.pct < 60 && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
          <TrendingDown className="w-5 h-5 shrink-0" />
          <span>Weakest habit: <strong>{weakest.task.name}</strong> — only {weakest.pct}% completion rate.</span>
        </motion.div>
      )}

      {/* Daily Intention teaser */}
      <button onClick={() => onViewChange('daily')} className="w-full text-left">
        <Card className={`p-4 border transition-all hover:border-primary/40 ${todayIntention?.completed ? 'bg-green-500/5 border-green-500/20' : todayIntention ? 'bg-primary/5 border-primary/20' : 'border-dashed border-border/60'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${todayIntention?.completed ? 'bg-green-500/15' : 'bg-primary/15'}`}>
              <Target className={`w-4 h-4 ${todayIntention?.completed ? 'text-green-400' : 'text-primary'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Today's Intention</p>
              {todayIntention ? (
                <p className={`text-sm font-medium truncate ${todayIntention.completed ? 'line-through text-muted-foreground' : 'text-white'}`}>{todayIntention.text}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Set your one commitment for today →</p>
              )}
            </div>
            {todayIntention?.completed && <span className="text-green-400 text-xs font-bold shrink-0">✓ DONE</span>}
          </div>
        </Card>
      </button>

      {/* Check-in button */}
      <Button
        data-testid="button-check-in"
        onClick={() => onViewChange('check-in')}
        size="lg"
        className={`w-full h-14 text-base font-bold rounded-2xl shadow-lg transition-all ${!doneToday ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/30 animate-[pulse_2.5s_ease-in-out_infinite]' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
      >
        {doneToday ? '✓ Check-in Completed' : 'Check In Today'}
        {!doneToday && <Play className="ml-2 w-4 h-4" fill="currentColor" />}
      </Button>
    </motion.div>
  );
}
