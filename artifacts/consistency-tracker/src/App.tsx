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

export type View = 'home' | 'check-in' | 'progress' | 'rewards' | 'settings' | 'create' | 'daily';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    setIsLoaded(true);
  }, []);

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
      </Layout>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
