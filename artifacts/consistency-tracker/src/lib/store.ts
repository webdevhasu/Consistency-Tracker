import { StoreState, Challenge, Task } from '../types';
import { subDays, format } from 'date-fns';

const STORAGE_KEY = 'consistency_tracker';

const normalizeTask = (t: Partial<Task> & { id: string; name: string }): Task => ({
  id: t.id,
  name: t.name,
  topic: t.topic ?? 'Health',
  customTopic: t.customTopic,
  difficulty: t.difficulty ?? 'Medium',
  description: t.description,
});

export const getStore = (): StoreState => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data) as StoreState;
      parsed.challenges = parsed.challenges.map(c => ({
        ...c,
        tasks: c.tasks.map(normalizeTask),
      }));
      parsed.dailyIntentions = parsed.dailyIntentions ?? [];
      return parsed;
    }
  } catch (e) {
    console.error('Error reading from localStorage', e);
  }
  return { challenges: [], activeChallengeId: null, settings: { darkMode: true }, dailyIntentions: [] };
};

export const saveStore = (state: StoreState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const seedInitialData = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return;

  const today = new Date();
  const startDate = format(subDays(today, 21), 'yyyy-MM-dd');

  const challengeId = 'c_' + Date.now();
  const tasks: Task[] = [
    { id: 't1', name: 'Morning workout', topic: 'Body', difficulty: 'Hard', description: '45 min minimum, no excuses' },
    { id: 't2', name: 'Cold shower', topic: 'Body', difficulty: 'Medium', description: 'Minimum 2 minutes cold' },
    { id: 't3', name: 'Read 20 pages', topic: 'Mind', difficulty: 'Easy', description: 'Any book — no news, no social' },
    { id: 't4', name: 'No processed food', topic: 'Diet', difficulty: 'Hard', description: 'Whole foods only, cook at home' },
    { id: 't5', name: '8 hours sleep', topic: 'Sleep', difficulty: 'Medium', description: 'Lights out by 10 PM' },
  ];

  const logs = [];
  for (let i = 0; i < 22; i++) {
    const logDate = subDays(today, 21 - i);
    const isMiss = i === 3 || i === 9 || i === 16;
    const isPartial = i === 1 || i === 6 || i === 12 || i === 18;

    let completedTasks: string[] = [];
    if (!isMiss) {
      completedTasks = tasks
        .filter(t => isPartial ? (t.difficulty !== 'Hard' || Math.random() > 0.5) : true)
        .map(t => t.id);
    }

    const mood: 'great' | 'good' | 'neutral' | 'bad' = isMiss ? 'bad' : isPartial ? 'neutral' : completedTasks.length === tasks.length ? 'great' : 'good';

    logs.push({
      date: format(logDate, 'yyyy-MM-dd'),
      completedTasks,
      note: i === 7 ? 'Crushed it today! Felt amazing after the cold shower.' : i === 14 ? 'Tough day but held the line.' : '',
      mood,
      timestamp: logDate.getTime(),
    });
  }

  const demoChallenge: Challenge = {
    id: challengeId,
    name: '90-Day Transformation',
    purpose: 'Build the discipline to become the person I want to be',
    startDate,
    durationDays: 90,
    endReward: 'Weekend trip to the mountains',
    tasks,
    milestones: [
      { day: 7, reward: 'Cheat meal at my favourite restaurant', achieved: true },
      { day: 21, reward: 'Buy a new gym shirt', achieved: true },
      { day: 30, reward: 'Spa day', achieved: false },
      { day: 45, reward: 'Fancy dinner for two', achieved: false },
      { day: 75, reward: 'New running shoes', achieved: false },
      { day: 90, reward: 'Weekend trip to the mountains', achieved: false },
    ],
    logs,
    archived: false,
  };

  saveStore({
    challenges: [demoChallenge],
    activeChallengeId: challengeId,
    settings: { darkMode: true },
    dailyIntentions: [],
  });
};
