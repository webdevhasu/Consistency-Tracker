import React, { useState, useEffect, useMemo } from 'react';
import { View } from '../App';
import { getStore } from '../lib/store';
import { Challenge } from '../types';
import { Card } from '@/components/ui/card';
import { addDays, differenceInDays, format, parseISO, isSameDay } from 'date-fns';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { TOPIC_COLORS, DIFFICULTY_COLORS, getTopicLabel } from '@/lib/utils';
import { TrendingUp, Flame, Trophy, XCircle, CheckCircle2 } from 'lucide-react';

export default function Progress({ onViewChange }: { onViewChange: (v: View) => void }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    const store = getStore();
    if (store.activeChallengeId) {
      setChallenge(store.challenges.find(c => c.id === store.activeChallengeId) || null);
    }
  }, []);

  const computed = useMemo(() => {
    if (!challenge) return null;

    const startDate = parseISO(challenge.startDate);
    const totalDays = challenge.durationDays;
    const numTasks = challenge.tasks.length;
    const logsMap = new Map(challenge.logs.map(l => [l.date, l]));

    // Heatmap
    const heatmapData = Array.from({ length: totalDays }).map((_, i) => {
      const d = addDays(startDate, i);
      const dStr = format(d, 'yyyy-MM-dd');
      const log = logsMap.get(dStr);
      let status = 'future';
      if (log) {
        if (log.completedTasks.length === numTasks) status = 'full';
        else if (log.completedTasks.length > 0) status = 'partial';
        else status = 'missed';
      } else if (d < new Date() && !isSameDay(d, new Date())) {
        status = 'missed';
      } else if (isSameDay(d, new Date())) {
        status = 'today';
      }
      return { date: dStr, dayNum: i + 1, status };
    });

    // Stats
    let streak = 0, bestStreak = 0, tempStreak = 0, totalDone = 0, totalMissed = 0;
    for (const d of heatmapData) {
      if (d.status === 'full') { tempStreak++; if (tempStreak > bestStreak) bestStreak = tempStreak; totalDone++; }
      else if (d.status === 'partial' || d.status === 'missed') { tempStreak = 0; if (d.status === 'missed') totalMissed++; }
    }
    // current streak (from end)
    for (let i = heatmapData.length - 1; i >= 0; i--) {
      if (heatmapData[i].status === 'full') streak++;
      else break;
    }

    // Line chart
    const lineData = challenge.logs
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(l => ({
        date: format(parseISO(l.date), 'MMM d'),
        pct: Math.round((l.completedTasks.length / numTasks) * 100),
      }));

    // Weekly bar chart
    const weeklyData: { week: string; pct: number }[] = [];
    let weekIdx = 0;
    while (weekIdx * 7 < totalDays) {
      const weekLogs = heatmapData.slice(weekIdx * 7, weekIdx * 7 + 7).filter(d => d.status !== 'future');
      const fullDays = weekLogs.filter(d => d.status === 'full').length;
      if (weekLogs.length > 0)
        weeklyData.push({ week: `W${weekIdx + 1}`, pct: Math.round((fullDays / weekLogs.length) * 100) });
      weekIdx++;
    }

    // Per-task stats
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const taskStats = challenge.tasks.map(task => {
      const completedLogs = challenge.logs.filter(l => l.completedTasks.includes(task.id));
      const doneDays = completedLogs.length;
      const pct = challenge.logs.length > 0 ? Math.round((doneDays / challenge.logs.length) * 100) : 0;

      // Task streak
      let tStreak = 0;
      const sorted = challenge.logs.slice().sort((a, b) => b.date.localeCompare(a.date));
      for (const log of sorted) {
        if (log.completedTasks.includes(task.id)) tStreak++;
        else break;
      }

      // Weakest day of week
      const dayCount: Record<number, { done: number; total: number }> = {};
      for (let i = 0; i < 7; i++) dayCount[i] = { done: 0, total: 0 };
      for (const log of challenge.logs) {
        const dow = parseISO(log.date).getDay();
        dayCount[dow].total++;
        if (log.completedTasks.includes(task.id)) dayCount[dow].done++;
      }
      let weakestDay = 'N/A';
      let worstPct = 101;
      for (let i = 0; i < 7; i++) {
        if (dayCount[i].total > 0) {
          const p = (dayCount[i].done / dayCount[i].total) * 100;
          if (p < worstPct) { worstPct = p; weakestDay = DAY_NAMES[i]; }
        }
      }

      return { task, doneDays, pct, tStreak, weakestDay };
    });

    // Topic breakdown
    const topicMap: Record<string, { done: number; total: number }> = {};
    for (const ts of taskStats) {
      const tp = ts.task.topic;
      if (!topicMap[tp]) topicMap[tp] = { done: 0, total: 0 };
      topicMap[tp].done += ts.doneDays;
      topicMap[tp].total += challenge.logs.length;
    }
    const topicBreakdown = Object.entries(topicMap).map(([topic, { done, total }]) => ({
      topic,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
    })).sort((a, b) => b.pct - a.pct);

    const overallPct = Math.round((totalDone / totalDays) * 100);
    const mostConsistent = [...taskStats].sort((a, b) => b.pct - a.pct)[0];
    const leastConsistent = [...taskStats].sort((a, b) => a.pct - b.pct)[0];

    return { heatmapData, lineData, weeklyData, taskStats, topicBreakdown, streak, bestStreak, totalDone, totalMissed, overallPct, mostConsistent, leastConsistent, totalDays };
  }, [challenge]);

  if (!challenge || !computed) return null;

  const { heatmapData, lineData, weeklyData, taskStats, topicBreakdown, streak, bestStreak, totalDone, totalMissed, overallPct, mostConsistent, leastConsistent } = computed;

  const getHeatColor = (status: string) => {
    switch (status) {
      case 'full': return 'bg-emerald-500';
      case 'partial': return 'bg-yellow-500';
      case 'missed': return 'bg-red-500/70';
      case 'today': return 'bg-primary/40 ring-1 ring-primary';
      default: return 'bg-muted/20';
    }
  };

  const getPctColor = (pct: number) => pct >= 75 ? 'text-emerald-400' : pct >= 50 ? 'text-yellow-400' : 'text-rose-400';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-5 pb-8">
      <h1 className="text-2xl font-bold">Progress</h1>

      {/* Overall progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-muted-foreground">
          <span>Challenge Completion</span>
          <span className="text-white">{overallPct}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${overallPct}%` }} transition={{ duration: 1 }} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Flame, label: 'Current Streak', value: `${streak} days` },
          { icon: Trophy, label: 'Best Streak', value: `${bestStreak} days` },
          { icon: CheckCircle2, label: 'Days Done', value: totalDone },
          { icon: XCircle, label: 'Days Missed', value: totalMissed },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="p-4 bg-card flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-widest">{label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
          </Card>
        ))}
      </div>

      {/* Best/worst task */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 bg-card">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Most Consistent</p>
          <p className="text-sm font-semibold text-white leading-tight">{mostConsistent?.task.name}</p>
          <p className="text-emerald-400 font-bold">{mostConsistent?.pct}%</p>
        </Card>
        <Card className="p-3 bg-card">
          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-1">Needs Work</p>
          <p className="text-sm font-semibold text-white leading-tight">{leastConsistent?.task.name}</p>
          <p className="text-rose-400 font-bold">{leastConsistent?.pct}%</p>
        </Card>
      </div>

      {/* Heatmap */}
      <Card className="p-5 bg-card">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-white">Consistency Heatmap</h3>
          <span className="text-xs text-muted-foreground">{totalDone} / {computed.totalDays} days</span>
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(14px, 1fr))' }}>
          {heatmapData.map((d, i) => (
            <div key={i} title={`${d.date} (Day ${d.dayNum}) — ${d.status}`} className={`aspect-square rounded-sm ${getHeatColor(d.status)}`} />
          ))}
        </div>
        <div className="flex items-center justify-end gap-3 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-500"></div> Full</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-yellow-500"></div> Partial</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-red-500/70"></div> Missed</div>
        </div>
      </Card>

      {/* Line chart */}
      {lineData.length > 0 && (
        <Card className="p-5 bg-card overflow-hidden">
          <h3 className="font-semibold text-white mb-4">Daily Completion %</h3>
          <div className="h-[180px] w-full -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} formatter={(v: number) => [`${v}%`, 'Completion']} />
                <Line type="monotone" dataKey="pct" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Weekly bar chart */}
      {weeklyData.length > 1 && (
        <Card className="p-5 bg-card overflow-hidden">
          <h3 className="font-semibold text-white mb-4">Weekly Consistency</h3>
          <div className="h-[160px] w-full -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} formatter={(v: number) => [`${v}%`, 'Consistency']} />
                <Bar dataKey="pct" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Topic breakdown */}
      {topicBreakdown.length > 0 && (
        <Card className="p-5 bg-card">
          <h3 className="font-semibold text-white mb-4">By Topic</h3>
          <div className="space-y-3">
            {topicBreakdown.map(({ topic, pct }) => {
              const tp = topic as import('../types').TaskTopic;
              const c = TOPIC_COLORS[tp] ?? TOPIC_COLORS['Health'];
              return (
                <div key={topic} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className={c.text}>{topic}</span>
                    <span className={getPctColor(pct)}>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${c.dot}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Per-task breakdown table */}
      <Card className="p-5 bg-card overflow-x-auto">
        <h3 className="font-semibold text-white mb-4">Task Breakdown</h3>
        <table className="w-full text-sm min-w-[420px]">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <th className="text-left pb-3">Task</th>
              <th className="text-center pb-3">Done</th>
              <th className="text-center pb-3">%</th>
              <th className="text-center pb-3">Streak</th>
              <th className="text-center pb-3">Weak Day</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {taskStats.map(({ task, doneDays, pct, tStreak, weakestDay }) => {
              const tc = TOPIC_COLORS[task.topic] ?? TOPIC_COLORS['Health'];
              const dc = DIFFICULTY_COLORS[task.difficulty] ?? DIFFICULTY_COLORS['Medium'];
              return (
                <tr key={task.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 pr-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-white leading-tight">{task.name}</span>
                      <div className="flex items-center gap-1">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${tc.bg} ${tc.text}`}>{getTopicLabel(task.topic, task.customTopic)}</span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${dc.bg} ${dc.text}`}>{task.difficulty}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-center text-muted-foreground">{doneDays}</td>
                  <td className={`py-3 text-center font-bold ${getPctColor(pct)}`}>{pct}%</td>
                  <td className="py-3 text-center text-muted-foreground">{tStreak > 0 ? `🔥 ${tStreak}` : '–'}</td>
                  <td className="py-3 text-center text-muted-foreground text-xs">{weakestDay}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </motion.div>
  );
}
