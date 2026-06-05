import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ClipboardList, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

const STORAGE_KEY = 'consistency-tracker-todos';

function loadTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as TodoItem[];
  } catch { /* ignore */ }
  return [];
}

function saveTodos(todos: TodoItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export default function Todo() {
  const [todos, setTodos] = useState<TodoItem[]>(loadTodos);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const addTodo = () => {
    const text = input.trim();
    if (!text) return;
    const newItem: TodoItem = {
      id: crypto.randomUUID(),
      text,
      done: false,
      createdAt: Date.now(),
    };
    setTodos(prev => [newItem, ...prev]);
    setInput('');
    inputRef.current?.focus();
  };

  const toggleTodo = (id: string) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const clearDone = () => {
    setTodos(prev => prev.filter(t => !t.done));
  };

  const pending = todos.filter(t => !t.done);
  const done = todos.filter(t => t.done);
  const total = todos.length;
  const doneCount = done.length;
  const progress = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Aaj Ka Kaam
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Jo karna hai aaj — sab yahan likh lo ✅
          </p>
        </div>
        {doneCount > 0 && (
          <button
            onClick={clearDone}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-md hover:bg-destructive/10 border border-transparent hover:border-destructive/20"
          >
            Done wale hatao
          </button>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              <span className="text-foreground font-semibold">{doneCount}</span> / {total} complete
            </span>
            <span
              className={cn(
                'font-bold text-sm',
                progress === 100 ? 'text-green-400' : 'text-primary'
              )}
            >
              {progress}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                progress === 100
                  ? 'bg-green-500 shadow-[0_0_8px_hsl(142_71%_45%/0.6)]'
                  : 'bg-primary shadow-[0_0_8px_hsl(217_91%_60%/0.5)]'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 && (
            <p className="text-center text-xs text-green-400 font-semibold flex items-center justify-center gap-1 animate-pulse">
              <Sparkles className="w-3 h-3" /> Sab ho gaya! Masha Allah 🎉
            </p>
          )}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTodo()}
          placeholder="Kuch likhो jo aaj karna hai..."
          className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
        <button
          onClick={addTodo}
          disabled={!input.trim()}
          className={cn(
            'flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-150',
            input.trim()
              ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 hover:scale-105 active:scale-95'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Empty state */}
      {todos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-primary/60" />
          </div>
          <p className="text-muted-foreground text-sm">
            Abhi koi kaam nahi — upar likhो kya karna hai aaj!
          </p>
        </div>
      )}

      {/* Pending tasks */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Baaki Kaam ({pending.length})
          </p>
          <ul className="space-y-2">
            {pending.map(todo => (
              <TodoRow
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Done tasks */}
      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Ho Gaya ✓ ({done.length})
          </p>
          <ul className="space-y-2">
            {done.map(todo => (
              <TodoRow
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TodoRow({
  todo,
  onToggle,
  onDelete,
}: {
  todo: TodoItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <li
      className={cn(
        'group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200',
        todo.done
          ? 'border-border/40 bg-card/40 opacity-60'
          : 'border-border bg-card hover:border-primary/30 hover:shadow-sm hover:shadow-primary/10'
      )}
    >
      <button
        onClick={() => onToggle(todo.id)}
        className="flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
        aria-label={todo.done ? 'Mark as pending' : 'Mark as done'}
      >
        {todo.done ? (
          <CheckCircle2 className="w-5 h-5 text-green-400 drop-shadow-[0_0_4px_rgba(74,222,128,0.5)]" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </button>

      <span
        className={cn(
          'flex-1 text-sm leading-snug',
          todo.done ? 'line-through text-muted-foreground' : 'text-foreground'
        )}
      >
        {todo.text}
      </span>

      <button
        onClick={() => onDelete(todo.id)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all hover:text-destructive hover:scale-110 active:scale-95 text-muted-foreground"
        aria-label="Delete task"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}
