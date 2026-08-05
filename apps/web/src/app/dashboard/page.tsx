"use client";

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { Activity, Flame, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userRes = await fetchApi('/users/me');
        setProfile(userRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-slide-up">
      <header className="mb-10">
        <h1 className="text-4xl font-display font-bold mb-2">
          Welcome back, {profile?.firstName || 'Athlete'}!
        </h1>
        <p className="text-muted">Here's your adaptive fitness snapshot for today.</p>
      </header>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/20 rounded-lg text-accent">
              <Activity size={20} />
            </div>
            <h3 className="text-muted font-medium">Weekly Goal</h3>
          </div>
          <p className="text-3xl font-bold">4 / 5 <span className="text-lg text-muted font-normal">sessions</span></p>
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/20 rounded-lg text-accent">
              <Flame size={20} />
            </div>
            <h3 className="text-muted font-medium">Active Streak</h3>
          </div>
          <p className="text-3xl font-bold">12 <span className="text-lg text-muted font-normal">days</span></p>
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/20 rounded-lg text-accent">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-muted font-medium">AI Adaptation</h3>
          </div>
          <p className="text-3xl font-bold text-emerald-400">Optimal</p>
          <p className="text-sm text-emerald-400/70 mt-1">Plan adjusted -2% volume</p>
        </div>
      </div>

      {/* Current Plan Section */}
      <div className="glass-panel p-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Today's Regimen</h2>
            <p className="text-muted">Hypertrophy / Upper Body Focus</p>
          </div>
          <button className="btn-primary py-2 text-sm">Start Session</button>
        </div>

        <div className="bg-background rounded-xl p-6 border border-border">
          <p className="text-center text-muted italic">Your personalized exercises will render here dynamically.</p>
        </div>
      </div>
    </div>
  );
}
