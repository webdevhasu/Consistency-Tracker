import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Layout from './components/layout';
import Home from './pages/home';
import CheckIn from './pages/check-in';
import Progress from './pages/progress';
import Rewards from './pages/rewards';
import Settings from './pages/settings';
import CreateChallenge from './pages/create-challenge';
import DailyIntention from './pages/daily-intention';
import Todo from './pages/todo';

export type View = 'home' | 'check-in' | 'progress' | 'rewards' | 'settings' | 'create' | 'daily' | 'todo';

const PAGE_TITLES: Record<View, string> = {
  'home':      'Consistency Tracker — Dashboard',
  'check-in':  'Daily Check-In | Consistency Tracker',
  'progress':  'My Progress & Analytics | Consistency Tracker',
  'rewards':   'Rewards & Milestones | Consistency Tracker',
  'settings':  'Settings | Consistency Tracker',
  'create':    'Create a New Challenge | Consistency Tracker',
  'daily':     'Daily Intention | Consistency Tracker',
  'todo':      'Aaj Ka Kaam | Consistency Tracker',
};

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    setIsLoaded(true);
  }, []);

  // Update <title> and meta description on every view change for
  // better shareability, analytics accuracy, and browser tab UX.
  useEffect(() => {
    document.title = PAGE_TITLES[currentView];
  }, [currentView]);

  if (!isLoaded) return null;

  return (
    <TooltipProvider>
      <Layout currentView={currentView} onViewChange={setCurrentView}>
        {currentView === 'home' && <Home onViewChange={setCurrentView} />}
        {currentView === 'check-in' && <CheckIn onViewChange={setCurrentView} />}
        {currentView === 'progress' && <Progress onViewChange={setCurrentView} />}
        {currentView === 'rewards' && <Rewards onViewChange={setCurrentView} />}
        {currentView === 'settings' && <Settings onViewChange={setCurrentView} />}
        {currentView === 'create' && <CreateChallenge onViewChange={setCurrentView} />}
        {currentView === 'daily' && <DailyIntention onViewChange={setCurrentView} />}
        {currentView === 'todo' && <Todo />}
      </Layout>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;

