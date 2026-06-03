import React, { useState, useEffect } from 'react';
import { View } from '../App';
import { getStore, saveStore, seedInitialData } from '../lib/store';
import { StoreState, Task, TaskTopic, TaskDifficulty } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { Download, Upload, Trash2, Plus, X, ChevronDown, ChevronUp, Check, Smartphone, Pencil, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOPIC_COLORS, DIFFICULTY_COLORS, TOPICS, DIFFICULTIES, getTopicLabel, cn } from '@/lib/utils';

export default function Settings({ onViewChange }: { onViewChange: (v: View) => void }) {
  const [store, setStore] = useState<StoreState>(() => getStore());
  const [editOpen, setEditOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskTopic, setNewTaskTopic] = useState<TaskTopic>('Health');
  const [newTaskCustomTopic, setNewTaskCustomTopic] = useState('');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState<TaskDifficulty>('Medium');
  const [extendDays, setExtendDays] = useState(0);
  const [saved, setSaved] = useState(false);
  const importInputRef = React.useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const installPromptRef = React.useRef<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskName, setEditingTaskName] = useState('');
  const [editingTaskTopic, setEditingTaskTopic] = useState<TaskTopic>('Health');
  const [editingTaskCustomTopic, setEditingTaskCustomTopic] = useState('');
  const [editingTaskDifficulty, setEditingTaskDifficulty] = useState<TaskDifficulty>('Medium');

  const activeChallenge = store.challenges.find(c => c.id === store.activeChallengeId) ?? null;

  const refresh = () => setStore(getStore());

  // PWA install prompt
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      installPromptRef.current = e;
      setCanInstall(true);
    };
    const installedHandler = () => {
      setCanInstall(false);
      setIsInstalled(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const triggerInstall = async () => {
    if (!installPromptRef.current) return;
    installPromptRef.current.prompt();
    const { outcome } = await installPromptRef.current.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
      setIsInstalled(true);
    }
    installPromptRef.current = null;
  };

  const resetData = () => {
    if (confirm('Delete ALL data? This cannot be undone.')) {
      localStorage.removeItem('consistency_tracker');
      window.location.reload();
    }
  };

  const reSeedData = () => {
    if (confirm('Load demo challenge? Current data will be deleted.')) {
      localStorage.removeItem('consistency_tracker');
      seedInitialData();
      window.location.reload();
    }
  };

  const resetTodayCheckIn = () => {
    const s = getStore();
    const active = s.challenges.find(c => c.id === s.activeChallengeId);
    if (!active) return;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    active.logs = active.logs.filter(l => l.date !== todayStr);
    saveStore(s);
    refresh();
    alert("Today's check-in has been reset.");
  };

  const exportCSV = () => {
    const s = getStore();
    if (!s.challenges.length) return;
    const rows: string[][] = [];
    for (const c of s.challenges) {
      const taskNames = c.tasks.map(t => t.name);
      const header = ['Challenge', 'Date', 'Day #', ...taskNames, 'Note', 'Mood', 'Total %'];
      rows.push(header);
      const startDate = parseISO(c.startDate);
      for (const log of c.logs.slice().sort((a, b) => a.date.localeCompare(b.date))) {
        const dayNum = Math.round((parseISO(log.date).getTime() - startDate.getTime()) / 86400000) + 1;
        const taskCols = c.tasks.map(t => log.completedTasks.includes(t.id) ? '1' : '0');
        const pct = c.tasks.length > 0 ? Math.round((log.completedTasks.length / c.tasks.length) * 100) : 0;
        rows.push([c.name, log.date, String(dayNum), ...taskCols, log.note || '', log.mood || '', `${pct}%`]);
      }
      rows.push([]);
    }
    const csv = rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'consistency_tracker.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const s = getStore();
    const str = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(s, null, 2));
    const a = document.createElement('a');
    a.href = str;
    a.download = 'consistency_tracker_backup.json';
    a.click();
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as StoreState;
        if (!parsed.challenges || !Array.isArray(parsed.challenges)) {
          alert('Invalid backup file — challenges array not found.');
          return;
        }
        if (!confirm('This will replace ALL current data with the backup. Continue?')) return;
        saveStore(parsed);
        window.location.reload();
      } catch {
        alert('Could not read file. Make sure it is a valid JSON backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const setActive = (id: string) => {
    const s = getStore();
    saveStore({ ...s, activeChallengeId: id });
    refresh();
  };

  const archiveChallenge = (id: string) => {
    if (!confirm('Archive this challenge?')) return;
    const s = getStore();
    const c = s.challenges.find(x => x.id === id);
    if (c) { c.archived = true; if (s.activeChallengeId === id) s.activeChallengeId = null; }
    saveStore(s);
    refresh();
  };

  const deleteChallenge = (id: string) => {
    if (!confirm('Permanently delete this challenge and all its data?')) return;
    const s = getStore();
    s.challenges = s.challenges.filter(c => c.id !== id);
    if (s.activeChallengeId === id) s.activeChallengeId = null;
    saveStore(s);
    refresh();
  };

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskName(task.name);
    setEditingTaskTopic(task.topic);
    setEditingTaskCustomTopic(task.customTopic ?? '');
    setEditingTaskDifficulty(task.difficulty);
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
  };

  const saveTaskEdit = () => {
    if (!editingTaskId || !editingTaskName.trim()) { setEditingTaskId(null); return; }
    const s = getStore();
    const active = s.challenges.find(c => c.id === s.activeChallengeId);
    if (!active) return;
    const task = active.tasks.find(t => t.id === editingTaskId);
    if (task) {
      task.name = editingTaskName.trim();
      task.topic = editingTaskTopic;
      task.customTopic = editingTaskTopic === 'Custom' && editingTaskCustomTopic.trim()
        ? editingTaskCustomTopic.trim()
        : undefined;
      task.difficulty = editingTaskDifficulty;
    }
    saveStore(s);
    setEditingTaskId(null);
    refresh();
  };

  const addTaskToActive = () => {
    if (!newTaskName.trim() || !activeChallenge) return;
    const s = getStore();
    const active = s.challenges.find(c => c.id === s.activeChallengeId);
    if (!active) return;
    if (active.tasks.length >= 15) return;
    active.tasks.push({
      id: `t_${Date.now()}`,
      name: newTaskName.trim(),
      topic: newTaskTopic,
      customTopic: newTaskTopic === 'Custom' && newTaskCustomTopic.trim() ? newTaskCustomTopic.trim() : undefined,
      difficulty: newTaskDifficulty,
    });
    saveStore(s);
    setNewTaskName('');
    setNewTaskCustomTopic('');
    refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const removeTaskFromActive = (taskId: string) => {
    if (!activeChallenge || activeChallenge.tasks.length <= 1) return;
    const s = getStore();
    const active = s.challenges.find(c => c.id === s.activeChallengeId);
    if (!active) return;
    active.tasks = active.tasks.filter(t => t.id !== taskId);
    saveStore(s);
    refresh();
  };

  const applyExtend = () => {
    if (extendDays <= 0 || !activeChallenge) return;
    const s = getStore();
    const active = s.challenges.find(c => c.id === s.activeChallengeId);
    if (!active) return;
    active.durationDays += extendDays;
    saveStore(s);
    setExtendDays(0);
    refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6 pb-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Edit active challenge */}
      {activeChallenge && (
        <div>
          <button
            onClick={() => setEditOpen(o => !o)}
            className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-white/[0.03] transition-colors"
          >
            <div className="text-left">
              <p className="font-semibold text-white text-sm">Edit Active Challenge</p>
              <p className="text-xs text-muted-foreground mt-0.5">{activeChallenge.name}</p>
            </div>
            {editOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          <AnimatePresence>
            {editOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="p-4 rounded-t-none border-t-0 space-y-5">
                  {/* Current tasks */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Tasks ({activeChallenge.tasks.length}/15)</p>
                    <div className="space-y-2">
                      {activeChallenge.tasks.map(task => {
                        const tc = TOPIC_COLORS[task.topic] ?? TOPIC_COLORS['Health'];
                        const dc = DIFFICULTY_COLORS[task.difficulty] ?? DIFFICULTY_COLORS['Medium'];
                        const topicLabel = getTopicLabel(task.topic, task.customTopic);
                        const isEditing = editingTaskId === task.id;
                        return (
                          <div key={task.id} className="p-3 rounded-xl bg-background border border-border">
                            {isEditing ? (
                              /* ── Edit mode ── */
                              <div className="space-y-2.5">
                                {/* Name */}
                                <Input
                                  value={editingTaskName}
                                  onChange={e => setEditingTaskName(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') saveTaskEdit(); if (e.key === 'Escape') cancelEditTask(); }}
                                  className="h-8 text-sm bg-card"
                                  autoFocus
                                  placeholder="Task name"
                                />
                                {/* Topic pills */}
                                <div>
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Topic</p>
                                  <div className="flex flex-wrap gap-1">
                                    {TOPICS.map(tp => {
                                      const c = TOPIC_COLORS[tp];
                                      return (
                                        <button key={tp} onClick={() => setEditingTaskTopic(tp)}
                                          className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border transition-all',
                                            editingTaskTopic === tp ? `${c.bg} ${c.text} ${c.border}` : 'bg-muted/30 text-muted-foreground border-transparent hover:border-border'
                                          )}
                                        >{tp}</button>
                                      );
                                    })}
                                  </div>
                                  {editingTaskTopic === 'Custom' && (
                                    <Input
                                      value={editingTaskCustomTopic}
                                      onChange={e => setEditingTaskCustomTopic(e.target.value)}
                                      placeholder="e.g. Prayer, Reading, Journaling..."
                                      className="h-8 text-xs bg-card mt-1.5"
                                    />
                                  )}
                                </div>
                                {/* Difficulty pills */}
                                <div>
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Difficulty</p>
                                  <div className="flex gap-1.5">
                                    {DIFFICULTIES.map(d => {
                                      const c = DIFFICULTY_COLORS[d];
                                      return (
                                        <button key={d} onClick={() => setEditingTaskDifficulty(d)}
                                          className={cn('text-[10px] font-bold uppercase px-2.5 py-1 rounded-md transition-all',
                                            editingTaskDifficulty === d ? `${c.bg} ${c.text}` : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                                          )}
                                        >{d}</button>
                                      );
                                    })}
                                  </div>
                                </div>
                                {/* Save / Cancel */}
                                <div className="flex gap-2 pt-1">
                                  <Button size="sm" onClick={saveTaskEdit} className="h-7 px-3 gap-1 text-xs">
                                    <Check className="w-3 h-3" /> Save
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={cancelEditTask} className="h-7 px-3 text-xs text-muted-foreground">
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              /* ── View mode ── */
                              <div className="flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-white text-sm">{task.name}</p>
                                  <div className="flex gap-1 mt-1">
                                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${tc.bg} ${tc.text}`}>{topicLabel}</span>
                                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${dc.bg} ${dc.text}`}>{task.difficulty}</span>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost" size="icon"
                                  onClick={() => startEditTask(task)}
                                  className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost" size="icon"
                                  onClick={() => removeTaskFromActive(task.id)}
                                  disabled={activeChallenge.tasks.length <= 1}
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add new task */}
                  {activeChallenge.tasks.length < 15 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Add Task</p>
                      <Input
                        value={newTaskName}
                        onChange={e => setNewTaskName(e.target.value)}
                        placeholder="New task name"
                        className="bg-background h-10 text-sm"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {TOPICS.map(tp => {
                          const c = TOPIC_COLORS[tp];
                          return (
                            <button key={tp} onClick={() => setNewTaskTopic(tp)}
                              className={cn('text-[10px] font-bold uppercase px-2 py-1 rounded-md border transition-all',
                                newTaskTopic === tp ? `${c.bg} ${c.text} ${c.border}` : 'bg-muted/30 text-muted-foreground border-transparent'
                              )}
                            >{tp}</button>
                          );
                        })}
                      </div>
                      {newTaskTopic === 'Custom' && (
                        <Input
                          value={newTaskCustomTopic}
                          onChange={e => setNewTaskCustomTopic(e.target.value)}
                          placeholder="e.g. Prayer, Reading, Journaling..."
                          className="bg-background h-9 text-sm"
                        />
                      )}
                      <div className="flex gap-2">
                        {DIFFICULTIES.map(d => {
                          const c = DIFFICULTY_COLORS[d];
                          return (
                            <button key={d} onClick={() => setNewTaskDifficulty(d)}
                              className={cn('text-[10px] font-bold uppercase px-3 py-1.5 rounded-md transition-all',
                                newTaskDifficulty === d ? `${c.bg} ${c.text}` : 'bg-muted/30 text-muted-foreground'
                              )}
                            >{d}</button>
                          );
                        })}
                      </div>
                      <Button onClick={addTaskToActive} disabled={!newTaskName.trim()} size="sm" className="gap-2">
                        {saved ? <><Check className="w-3.5 h-3.5" /> Added!</> : <><Plus className="w-3.5 h-3.5" /> Add Task</>}
                      </Button>
                    </div>
                  )}

                  {/* Extend duration */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Extend Duration</p>
                    <p className="text-xs text-muted-foreground">Current: {activeChallenge.durationDays} days</p>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        value={extendDays || ''}
                        onChange={e => setExtendDays(Number(e.target.value))}
                        placeholder="+ days"
                        className="bg-background h-10 w-28 text-sm"
                      />
                      <Button onClick={applyExtend} disabled={extendDays <= 0} size="sm" variant="secondary">
                        {saved ? 'Saved ✓' : 'Apply'}
                      </Button>
                    </div>
                  </div>

                  {/* Reset today */}
                  <div className="pt-2 border-t border-border">
                    <Button variant="outline" size="sm" onClick={resetTodayCheckIn} className="gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                      <RefreshCw className="w-3.5 h-3.5" /> Reset Today's Check-In
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* All challenges */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">All Challenges</h3>
        <div className="space-y-2.5">
          {store.challenges.map(c => {
            const isActive = store.activeChallengeId === c.id;
            const perfectDays = c.tasks.length > 0
              ? c.logs.filter(l => l.completedTasks.length === c.tasks.length).length
              : 0;
            return (
              <Card key={c.id} className={`p-4 border-l-4 ${isActive ? 'border-l-primary' : 'border-l-border/50'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-white text-sm">{c.name}</p>
                      {isActive && <span className="text-[9px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/20">ACTIVE</span>}
                      {c.archived && <span className="text-[9px] font-bold bg-muted/40 text-muted-foreground px-2 py-0.5 rounded-full">ARCHIVED</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{c.durationDays} days · {c.tasks.length} tasks · {perfectDays} perfect days</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!isActive && !c.archived && (
                      <Button variant="ghost" size="sm" onClick={() => setActive(c.id)} className="h-7 text-xs text-muted-foreground hover:text-foreground px-2">
                        Set Active
                      </Button>
                    )}
                    {!c.archived && (
                      <Button variant="ghost" size="icon" onClick={() => archiveChallenge(c.id)} className="h-7 w-7 text-muted-foreground hover:text-amber-400">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => deleteChallenge(c.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
          {store.challenges.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">No challenges yet.</p>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => onViewChange('create')}
          className="w-full mt-3 border-dashed border-2 gap-2 text-muted-foreground"
        >
          <Plus className="w-4 h-4" /> New Challenge
        </Button>
      </div>

      {/* Install app */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">App</h3>
        <Card className="bg-card">
          {isInstalled ? (
            <div className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-white">App Installed ✓</p>
                <p className="text-xs text-muted-foreground mt-0.5">Home screen se chal rahi hai</p>
              </div>
            </div>
          ) : canInstall ? (
            <button onClick={triggerInstall} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm text-white">Install App</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Home screen pe add karo, offline chalegi</p>
                </div>
              </div>
              <div className="text-[10px] font-bold bg-primary/20 text-primary px-2.5 py-1 rounded-full border border-primary/20 shrink-0">
                INSTALL
              </div>
            </button>
          ) : isIOS ? (
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Smartphone className="w-4 h-4 text-primary" />
                <p className="font-medium text-sm text-white">iPhone / iPad pe Install karein</p>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p>1. Safari mein open karein (Chrome pe kaam nahi karta)</p>
                <p>2. Neeche middle mein <span className="text-white font-bold">Share ↑</span> button dabao</p>
                <p>3. <span className="text-white font-bold">"Add to Home Screen"</span> select karo</p>
                <p>4. <span className="text-white font-bold">Add</span> tap karo — ho gaya!</p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Smartphone className="w-4 h-4 text-primary" />
                <p className="font-medium text-sm text-white">Home Screen pe Install karein</p>
              </div>
              <p className="text-xs text-muted-foreground">Chrome mein browser menu (⋮) kholein aur "Add to Home screen" select karein.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Data management */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Data</h3>
        <Card className="bg-card divide-y divide-border">
          <button onClick={exportCSV} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left">
            <div>
              <span className="font-medium text-sm text-white">Export as CSV</span>
              <p className="text-xs text-muted-foreground mt-0.5">Spreadsheet-friendly format</p>
            </div>
            <Download className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={exportJSON} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left">
            <div>
              <span className="font-medium text-sm text-white">Export as JSON</span>
              <p className="text-xs text-muted-foreground mt-0.5">Full backup of all data</p>
            </div>
            <Download className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={() => importInputRef.current?.click()} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left">
            <div>
              <span className="font-medium text-sm text-white">Import JSON Backup</span>
              <p className="text-xs text-muted-foreground mt-0.5">Restore from a previous backup</p>
            </div>
            <Upload className="w-4 h-4 text-muted-foreground" />
          </button>
          <input ref={importInputRef} type="file" accept=".json" className="hidden" onChange={importJSON} />
        </Card>
      </div>

      {/* Danger zone */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Danger Zone</h3>
        <Card className="bg-card divide-y divide-border">
          <button onClick={reSeedData} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left">
            <div>
              <span className="font-medium text-sm text-white">Load Demo Data</span>
              <p className="text-xs text-muted-foreground mt-0.5">Replace everything with a sample challenge</p>
            </div>
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={resetData} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left">
            <div>
              <span className="font-medium text-sm text-destructive">Delete All Data</span>
              <p className="text-xs text-muted-foreground mt-0.5">Permanently removes everything</p>
            </div>
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        </Card>
      </div>
    </motion.div>
  );
}
