import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { TaskTopic, TaskDifficulty } from "../types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const TOPIC_COLORS: Record<TaskTopic, { bg: string; text: string; border: string; dot: string }> = {
  Health:  { bg: 'bg-violet-500/15', text: 'text-violet-400',  border: 'border-violet-500/30', dot: 'bg-violet-500' },
  Mind:    { bg: 'bg-blue-500/15',   text: 'text-blue-400',    border: 'border-blue-500/30',   dot: 'bg-blue-500' },
  Body:    { bg: 'bg-orange-500/15', text: 'text-orange-400',  border: 'border-orange-500/30', dot: 'bg-orange-500' },
  Work:    { bg: 'bg-teal-500/15',   text: 'text-teal-400',    border: 'border-teal-500/30',   dot: 'bg-teal-500' },
  Diet:    { bg: 'bg-emerald-500/15',text: 'text-emerald-400', border: 'border-emerald-500/30',dot: 'bg-emerald-500' },
  Sleep:   { bg: 'bg-indigo-500/15', text: 'text-indigo-400',  border: 'border-indigo-500/30', dot: 'bg-indigo-500' },
  Custom:  { bg: 'bg-gray-500/15',   text: 'text-gray-400',    border: 'border-gray-500/30',   dot: 'bg-gray-500' },
}

export const DIFFICULTY_COLORS: Record<TaskDifficulty, { bg: string; text: string }> = {
  Easy:   { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  Medium: { bg: 'bg-amber-500/15',   text: 'text-amber-400' },
  Hard:   { bg: 'bg-rose-500/15',    text: 'text-rose-400' },
}

export const TOPICS: TaskTopic[] = ['Health', 'Mind', 'Body', 'Work', 'Diet', 'Sleep', 'Custom']
export const DIFFICULTIES: TaskDifficulty[] = ['Easy', 'Medium', 'Hard']

export function getTopicLabel(topic: TaskTopic, customTopic?: string): string {
  if (topic === 'Custom' && customTopic?.trim()) return customTopic.trim();
  return topic;
}

export const MOTIVATIONAL_QUOTES = [
  "Discipline is choosing between what you want now and what you want most.",
  "You don't rise to the level of your goals — you fall to the level of your systems.",
  "The pain of discipline is far less than the pain of regret.",
  "Every rep. Every day. No exceptions.",
  "Small daily improvements are the key to staggering long-term results.",
  "Champions aren't made in the gym. Champions are made from something deep inside.",
  "It never gets easier. You just get stronger.",
]

export function getQuoteForProgress(pct: number): string {
  if (pct < 30) return MOTIVATIONAL_QUOTES[0]
  if (pct < 50) return MOTIVATIONAL_QUOTES[1]
  if (pct < 70) return MOTIVATIONAL_QUOTES[2]
  if (pct < 85) return MOTIVATIONAL_QUOTES[4]
  return MOTIVATIONAL_QUOTES[6]
}
