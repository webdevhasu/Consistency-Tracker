export type TaskTopic = 'Health' | 'Mind' | 'Body' | 'Work' | 'Diet' | 'Sleep' | 'Custom';
export type TaskDifficulty = 'Easy' | 'Medium' | 'Hard';

export type Task = {
  id: string;
  name: string;
  topic: TaskTopic;
  customTopic?: string;
  description?: string;
  difficulty: TaskDifficulty;
};

export type Milestone = { day: number; reward: string; achieved: boolean };
export type Log = {
  date: string;
  completedTasks: string[];
  failedTasks?: { id: string; reason: string }[];
  note: string;
  mood: 'great' | 'good' | 'neutral' | 'bad' | null;
  timestamp: number;
};
export type Challenge = {
  id: string;
  name: string;
  purpose: string;
  startDate: string;
  durationDays: number;
  endReward: string;
  tasks: Task[];
  milestones: Milestone[];
  logs: Log[];
  archived: boolean;
};
export type DailyIntention = {
  id: string;
  date: string;
  text: string;
  completed: boolean;
  completedAt?: number;
};

export type StoreState = {
  challenges: Challenge[];
  activeChallengeId: string | null;
  settings: { darkMode: boolean };
  dailyIntentions: DailyIntention[];
};
