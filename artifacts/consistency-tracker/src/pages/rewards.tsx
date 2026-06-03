import React, { useState, useEffect, useMemo } from 'react';
import { View } from '../App';
import { getStore } from '../lib/store';
import { Challenge } from '../types';
import { Card } from '@/components/ui/card';
import { parseISO, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Trophy, Lock, Unlock, Flame, Shield, Star, Zap, Target, Award, Clock
} from 'lucide-react';

type Badge = {
  id: string;
  icon: any;
  name: string;
  description: string;
  earned: boolean;
  color: string;
};

export default function Rewards({ onViewChange }: { onViewChange: (v: View) => void }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    const store = getStore();
    if (store.activeChallengeId) {
      setChallenge(store.challenges.find(c => c.id === store.activeChallengeId) || null);
    }
  }, []);

  const badges = useMemo((): Badge[] => {
    if (!challenge) return [];

    const numTasks = challenge.tasks.length;
    const perfectDays = challenge.logs.filter(l => l.completedTasks.length === numTasks);
    const totalDays = challenge.durationDays;

    // Streak calc
    let bestStreak = 0, tempStreak = 0, currentStreak = 0;
    const sorted = challenge.logs.slice().sort((a, b) => a.date.localeCompare(b.date));
    for (const log of sorted) {
      if (log.completedTasks.length === numTasks) { tempStreak++; if (tempStreak > bestStreak) bestStreak = tempStreak; }
      else tempStreak = 0;
    }
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].completedTasks.length === numTasks) currentStreak++;
      else break;
    }

    // No miss in first 7 days
    const first7 = challenge.logs
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 7);
    const noMissFirst7 = first7.length >= 7 && first7.every(l => l.completedTasks.length === numTasks);

    const daysPassed = Math.max(0, differenceInDays(new Date(), parseISO(challenge.startDate)) + 1);
    const halfwayDaysPassed = daysPassed >= Math.ceil(totalDays / 2);

    const missedDays = challenge.logs.filter(l => l.completedTasks.length === 0).length;

    return [
      {
        id: 'perfect_week',
        icon: Flame,
        name: 'Perfect Week',
        description: '7 consecutive days with every task done',
        earned: bestStreak >= 7,
        color: 'text-orange-400',
      },
      {
        id: 'iron_streak',
        icon: Shield,
        name: 'Iron Streak',
        description: '21 days in a row — no exceptions',
        earned: bestStreak >= 21,
        color: 'text-slate-300',
      },
      {
        id: 'unstoppable',
        icon: Zap,
        name: 'Unstoppable',
        description: '30-day streak — pure discipline',
        earned: bestStreak >= 30,
        color: 'text-yellow-400',
      },
      {
        id: 'early_riser',
        icon: Clock,
        name: 'Early Riser',
        description: 'First 14 days completed',
        earned: perfectDays.length >= 14,
        color: 'text-blue-400',
      },
      {
        id: 'halfway_hero',
        icon: Target,
        name: 'Halfway Hero',
        description: 'Reached the halfway point of your challenge',
        earned: halfwayDaysPassed,
        color: 'text-violet-400',
      },
      {
        id: 'no_miss',
        icon: Star,
        name: 'No Miss',
        description: 'Zero missed days in the first week',
        earned: noMissFirst7,
        color: 'text-emerald-400',
      },
      {
        id: 'consistent',
        icon: Award,
        name: 'Consistent',
        description: 'Completed 30 total perfect days',
        earned: perfectDays.length >= 30,
        color: 'text-teal-400',
      },
    ];
  }, [challenge]);

  const milestonesWithStatus = useMemo(() => {
    if (!challenge) return [];
    const numTasks = challenge.tasks.length;
    const perfectDays = challenge.logs.filter(l => l.completedTasks.length === numTasks).length;
    const daysPassed = Math.max(0, differenceInDays(new Date(), parseISO(challenge.startDate)) + 1);

    return challenge.milestones.map(m => {
      const achieved = m.achieved || perfectDays >= m.day || daysPassed > m.day;
      return { ...m, achieved };
    });
  }, [challenge]);

  if (!challenge) return null;

  const numTasks = challenge.tasks.length;
  const perfectDays = challenge.logs.filter(l => l.completedTasks.length === numTasks).length;
  const isComplete = perfectDays >= challenge.durationDays;
  const earnedBadges = badges.filter(b => b.earned).length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-5 pb-8">
      <h1 className="text-2xl font-bold">Rewards</h1>

      {/* Ultimate reward */}
      <Card className={`p-6 flex flex-col items-center text-center gap-4 relative overflow-hidden ${isComplete ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-border'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isComplete ? 'bg-yellow-500/20' : 'bg-muted'}`}>
          {isComplete
            ? <Trophy className="w-8 h-8 text-yellow-400" />
            : <Lock className="w-8 h-8 text-muted-foreground" />
          }
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {isComplete ? '🏆 Reward Unlocked!' : 'Ultimate Reward — Locked'}
          </p>
          <p className="text-2xl font-bold text-white">{challenge.endReward}</p>
          {!isComplete && (
            <p className="text-muted-foreground text-sm mt-2">Complete all {challenge.durationDays} days to unlock</p>
          )}
        </div>
      </Card>

      {/* Milestones */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Milestones</h3>
        <div className="space-y-2.5">
          {milestonesWithStatus.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`p-4 flex items-center gap-4 transition-all ${m.achieved ? 'border-primary/30 bg-primary/5' : 'border-border/50 opacity-50'}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${m.achieved ? 'bg-primary/20' : 'bg-muted'}`}>
                  {m.achieved
                    ? <Unlock className="w-5 h-5 text-primary" />
                    : <Lock className="w-4 h-4 text-muted-foreground/50" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm">Day {m.day}</div>
                  <div className="text-muted-foreground text-xs truncate">{m.reward}</div>
                </div>
                {m.achieved && (
                  <span className="shrink-0 text-[10px] font-bold text-primary bg-primary/15 border border-primary/20 px-2 py-1 rounded-full">
                    UNLOCKED
                  </span>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Achievement badges */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Achievement Badges</h3>
          <span className="text-xs font-semibold text-muted-foreground">{earnedBadges} / {badges.length}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className={`p-4 flex flex-col items-center text-center gap-2 transition-all ${
                badge.earned
                  ? 'border-border bg-card'
                  : 'border-border/30 bg-muted/5 opacity-40 grayscale'
              }`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${badge.earned ? 'bg-white/5' : 'bg-muted'}`}>
                  <badge.icon className={`w-6 h-6 ${badge.earned ? badge.color : 'text-muted-foreground/30'}`} />
                </div>
                <div>
                  <p className={`text-xs font-bold ${badge.earned ? 'text-white' : 'text-muted-foreground/50'}`}>{badge.name}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-tight">{badge.description}</p>
                </div>
                {badge.earned && (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    EARNED
                  </span>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
