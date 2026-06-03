import React, { useState } from 'react';
import { View } from '../App';
import { getStore, saveStore } from '../lib/store';
import { TaskTopic, TaskDifficulty } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { TOPIC_COLORS, DIFFICULTY_COLORS, TOPICS, DIFFICULTIES, getTopicLabel, cn } from '@/lib/utils';

type TaskDraft = { id: string; name: string; topic: TaskTopic; customTopic: string; difficulty: TaskDifficulty; description: string; showDesc: boolean };
type MilestoneDraft = { day: number; reward: string; enabled: boolean };

const DEFAULT_MILESTONES: MilestoneDraft[] = [
  { day: 7,  reward: '', enabled: true },
  { day: 21, reward: '', enabled: true },
  { day: 30, reward: '', enabled: false },
  { day: 45, reward: '', enabled: false },
  { day: 75, reward: '', enabled: false },
];

const TOTAL_STEPS = 5;

export default function CreateChallenge({ onViewChange }: { onViewChange: (v: View) => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [duration, setDuration] = useState(30);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tasks, setTasks] = useState<TaskDraft[]>([
    { id: 't1', name: '', topic: 'Health', customTopic: '', difficulty: 'Medium', description: '', showDesc: false },
  ]);
  const [endReward, setEndReward] = useState('');
  const [milestones, setMilestones] = useState<MilestoneDraft[]>(DEFAULT_MILESTONES);

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep(s => Math.max(s - 1, 1));

  const addTask = () => {
    if (tasks.length < 15)
      setTasks(prev => [...prev, { id: `t${Date.now()}`, name: '', topic: 'Health', customTopic: '', difficulty: 'Medium', description: '', showDesc: false }]);
  };
  const removeTask = (id: string) => { if (tasks.length > 1) setTasks(prev => prev.filter(t => t.id !== id)); };
  const updateTask = <K extends keyof TaskDraft>(id: string, key: K, val: TaskDraft[K]) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, [key]: val } : t));

  const canNext = () => {
    if (step === 1) return name.trim() && purpose.trim();
    if (step === 3) return tasks.filter(t => t.name.trim()).length >= 1;
    if (step === 4) return endReward.trim();
    return true;
  };

  const create = () => {
    const store = getStore();
    const validTasks = tasks.filter(t => t.name.trim()).map(t => ({
      id: t.id,
      name: t.name.trim(),
      topic: t.topic,
      customTopic: t.topic === 'Custom' && t.customTopic.trim() ? t.customTopic.trim() : undefined,
      difficulty: t.difficulty,
      description: t.description.trim() || undefined,
    }));
    const validMilestones = milestones
      .filter(m => m.enabled && m.reward.trim())
      .map(m => ({ day: m.day, reward: m.reward, achieved: false }));
    const halfDay = Math.floor(duration / 2);
    const alreadyHalf = validMilestones.some(m => m.day === halfDay);
    if (!alreadyHalf && halfDay > 0)
      validMilestones.push({ day: halfDay, reward: 'Halfway reward', achieved: false });
    validMilestones.push({ day: duration, reward: endReward, achieved: false });
    validMilestones.sort((a, b) => a.day - b.day);

    const newChallenge = {
      id: `c_${Date.now()}`,
      name: name.trim(),
      purpose: purpose.trim(),
      startDate,
      durationDays: duration,
      endReward: endReward.trim(),
      tasks: validTasks,
      milestones: validMilestones,
      logs: [],
      archived: false,
    };
    saveStore({ ...store, challenges: [...store.challenges, newChallenge], activeChallengeId: newChallenge.id });
    onViewChange('home');
  };

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">New Challenge</h1>
        <div className="flex items-center gap-1">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i + 1 < step ? 'bg-primary w-5' : i + 1 === step ? 'bg-primary w-8' : 'bg-muted w-3'
            )} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1 — Mission */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Step 1 of {TOTAL_STEPS}</p>
              <h2 className="text-xl font-bold">Define the mission</h2>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Challenge Name</label>
              <Input data-testid="input-challenge-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 75 Hard, 30 Days No Sugar" className="bg-card h-13 text-base" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your Why</label>
              <Textarea data-testid="input-purpose" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="I am doing this because..." className="bg-card resize-none h-28 text-base" />
            </div>
          </motion.div>
        )}

        {/* Step 2 — Duration */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Step 2 of {TOTAL_STEPS}</p>
              <h2 className="text-xl font-bold">Duration & start date</h2>
            </div>
            <Card className="p-8 flex flex-col items-center bg-card">
              <span className="text-7xl font-black text-white tabular-nums">{duration}</span>
              <span className="text-muted-foreground font-semibold uppercase tracking-widest text-sm mt-1">Days</span>
              <div className="w-full mt-6">
                <Slider value={[duration]} onValueChange={v => setDuration(v[0])} min={7} max={365} step={1} className="py-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>7</span><span>90</span><span>180</span><span>365</span>
                </div>
              </div>
            </Card>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Start Date</label>
              <Input
                data-testid="input-start-date"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-card h-12"
              />
            </div>
          </motion.div>
        )}

        {/* Step 3 — Tasks */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Step 3 of {TOTAL_STEPS}</p>
              <h2 className="text-xl font-bold">Daily tasks</h2>
              <p className="text-muted-foreground text-sm mt-1">What habits will you perform every single day?</p>
            </div>
            <div className="space-y-3">
              {tasks.map((task, i) => {
                return (
                  <Card key={task.id} className="p-4 bg-card space-y-3">
                    <div className="flex gap-2">
                      <Input
                        data-testid={`input-task-${i}`}
                        value={task.name}
                        onChange={e => updateTask(task.id, 'name', e.target.value)}
                        placeholder={`Task ${i + 1}`}
                        className="bg-background h-11 flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeTask(task.id)} disabled={tasks.length === 1} className="h-11 w-11 text-muted-foreground hover:text-destructive shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Topic pills */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Topic</p>
                      <div className="flex flex-wrap gap-1.5">
                        {TOPICS.map(tp => {
                          const c = TOPIC_COLORS[tp];
                          return (
                            <button
                              key={tp}
                              onClick={() => updateTask(task.id, 'topic', tp)}
                              className={cn(
                                'text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg border transition-all',
                                task.topic === tp ? `${c.bg} ${c.text} ${c.border}` : 'bg-muted/30 text-muted-foreground border-transparent hover:border-border'
                              )}
                            >{tp}</button>
                          );
                        })}
                      </div>
                      {/* Custom topic text input */}
                      {task.topic === 'Custom' && (
                        <Input
                          value={task.customTopic}
                          onChange={e => updateTask(task.id, 'customTopic', e.target.value)}
                          placeholder="e.g. Prayer, Reading, Journaling..."
                          className="bg-background h-9 text-sm mt-2"
                          autoFocus
                        />
                      )}
                    </div>

                    {/* Difficulty pills */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Difficulty</p>
                      <div className="flex gap-2">
                        {DIFFICULTIES.map(d => {
                          const c = DIFFICULTY_COLORS[d];
                          return (
                            <button
                              key={d}
                              onClick={() => updateTask(task.id, 'difficulty', d)}
                              className={cn(
                                'text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg transition-all',
                                task.difficulty === d ? `${c.bg} ${c.text}` : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                              )}
                            >{d}</button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Optional tip toggle */}
                    <button
                      onClick={() => updateTask(task.id, 'showDesc', !task.showDesc)}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {task.showDesc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {task.showDesc ? 'Hide tip' : '+ Add tip / description'}
                    </button>
                    {task.showDesc && (
                      <Input
                        value={task.description}
                        onChange={e => updateTask(task.id, 'description', e.target.value)}
                        placeholder="e.g. Minimum 30 minutes, no excuses"
                        className="bg-background h-10 text-sm"
                      />
                    )}
                  </Card>
                );
              })}
            </div>
            {tasks.length < 15 && (
              <Button variant="outline" onClick={addTask} className="w-full h-12 border-dashed border-2 gap-2">
                <Plus className="w-4 h-4" /> Add Another Task
              </Button>
            )}
          </motion.div>
        )}

        {/* Step 4 — Reward */}
        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Step 4 of {TOTAL_STEPS}</p>
              <h2 className="text-xl font-bold">The ultimate reward</h2>
              <p className="text-muted-foreground text-sm mt-1">What will you give yourself when you finish the full challenge?</p>
            </div>
            <Input data-testid="input-reward" value={endReward} onChange={e => setEndReward(e.target.value)} placeholder="e.g. A new watch, weekend trip, concert tickets" className="bg-card h-14 text-base" />

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Milestone rewards (optional)</h3>
              <div className="space-y-2">
                {milestones.map((m, i) => (
                  <div key={m.day} className="flex items-center gap-3">
                    <button
                      onClick={() => setMilestones(prev => prev.map((x, j) => j === i ? { ...x, enabled: !x.enabled } : x))}
                      className={cn(
                        'w-5 h-5 rounded border-2 transition-colors shrink-0',
                        m.enabled ? 'bg-primary border-primary' : 'bg-transparent border-muted-foreground/40'
                      )}
                    />
                    <span className="text-sm font-medium text-muted-foreground w-14 shrink-0">Day {m.day}</span>
                    <Input
                      value={m.reward}
                      onChange={e => setMilestones(prev => prev.map((x, j) => j === i ? { ...x, reward: e.target.value } : x))}
                      placeholder={`Reward for day ${m.day}`}
                      disabled={!m.enabled}
                      className="bg-card h-10 flex-1 text-sm disabled:opacity-40"
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 5 — Confirm */}
        {step === 5 && (
          <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Step 5 of {TOTAL_STEPS}</p>
              <h2 className="text-xl font-bold">Confirm your mission</h2>
            </div>
            <Card className="p-5 bg-card border-primary/30 relative overflow-hidden space-y-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              <div>
                <h3 className="text-xl font-bold text-white">{name}</h3>
                <p className="text-primary font-bold text-xs uppercase tracking-widest mt-0.5">{duration} Days</p>
                <p className="text-muted-foreground text-sm italic mt-2">&ldquo;{purpose}&rdquo;</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Daily Tasks</p>
                <div className="space-y-1.5">
                  {tasks.filter(t => t.name.trim()).map(t => {
                    const tc = TOPIC_COLORS[t.topic];
                    const dc = DIFFICULTY_COLORS[t.difficulty];
                    const topicLabel = getTopicLabel(t.topic, t.customTopic);
                    return (
                      <div key={t.id} className="flex items-center gap-2 text-sm">
                        <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${tc.bg} ${tc.text}`}>{topicLabel}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${dc.bg} ${dc.text}`}>{t.difficulty}</span>
                        <span className="text-foreground">{t.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-border">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Ultimate Reward</p>
                <p className="font-semibold text-white">{endReward}</p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav buttons */}
      <div className="fixed bottom-[64px] md:bottom-0 left-0 right-0 md:left-[72px] p-4 bg-background/90 backdrop-blur border-t border-border">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 && (
            <Button variant="secondary" onClick={back} className="h-12 px-6">Back</Button>
          )}
          {step < TOTAL_STEPS ? (
            <Button onClick={next} disabled={!canNext()} className="flex-1 h-12 font-bold">Continue →</Button>
          ) : (
            <Button onClick={create} className="flex-1 h-12 font-bold bg-primary shadow-lg shadow-primary/30">Start Challenge 🚀</Button>
          )}
        </div>
      </div>
    </div>
  );
}
