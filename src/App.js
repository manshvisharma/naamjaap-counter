import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  onAuthStateChanged, signInWithPopup, signOut, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile, updatePassword 
} from 'firebase/auth';
import { doc, setDoc, updateDoc, onSnapshot, increment } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, BarChart2, User, Home, Check, X, 
  ChevronLeft, ChevronRight, Settings, Plus, 
  Sun, Moon, Edit3, Clock, Trophy, Mail, Lock, Key,
  EyeOff, Eye, Zap, Palette, WifiOff, ChevronDown, Activity, Smartphone
} from 'lucide-react';
import Calendar from 'react-calendar';
import { 
  format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, 
  isSameDay, startOfMonth, endOfMonth, addMonths, subMonths, 
  addWeeks, subWeeks, isAfter
} from 'date-fns';
import 'react-calendar/dist/Calendar.css';

// --- CONFIGURATION ---
const THEMES = {
  saffron: { primary: '#FF9933', dim: 'rgba(255, 153, 51, 0.12)' },
  ocean: { primary: '#007AFF', dim: 'rgba(0, 122, 255, 0.12)' },
  emerald: { primary: '#34C759', dim: 'rgba(52, 199, 89, 0.12)' },
  rose: { primary: '#FF2D55', dim: 'rgba(255, 45, 85, 0.12)' },
  violet: { primary: '#AF52DE', dim: 'rgba(175, 82, 222, 0.12)' },
};

const formatNum = (num, isPrivate) => {
  if (isPrivate) return '••••';
  return num ? num.toLocaleString() : 0;
};

// --- COMPONENTS ---

const OfflineBanner = () => (
  <motion.div initial={{ y: -50 }} animate={{ y: 0 }} className="fixed top-0 inset-x-0 bg-red-600 text-white py-3 px-4 flex items-center justify-center gap-2 z-[1000] text-sm font-bold shadow-lg">
    <WifiOff size={16} /> Connection Lost. Counts are not being synced.
  </motion.div>
);

const Navbar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[100]">
      <div className="bg-[var(--card-bg)] backdrop-blur-3xl border border-[var(--glass-border)] rounded-[2.5rem] px-8 py-5 flex justify-between items-center shadow-2xl">
        {[ { p: '/', i: Home }, { p: '/stats', i: BarChart2 }, { p: '/profile', i: User } ].map((item) => (
          <Link key={item.p} to={item.p} className="relative group">
            <item.i size={26} className={`transition-all ${isActive(item.p) ? "text-[var(--accent)] scale-110" : "text-gray-400"}`} />
            {isActive(item.p) && <motion.div layoutId="nav-dot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[var(--accent)] rounded-full shadow-[0_0_8px_var(--accent)]" />}
          </Link>
        ))}
      </div>
    </div>
  );
};

const HomePage = ({ user, userData, updateCount, isOnline }) => {
  const [showMomentum, setShowMomentum] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [sessionSecs, setSessionSecs] = useState(0);
  
  const currentNaam = userData?.currentNaam || "Hare Krishna";
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const isPrivate = userData?.isPrivate || false;
  const tapIncrement = userData?.tapIncrement || 1;
  const goal = userData?.dailyGoal || 108;
  
  const todayTotal = useMemo(() => {
    const dayData = userData?.history?.[todayKey];
    if (typeof dayData === 'number') return dayData;
    return dayData?.[currentNaam] || 0;
  }, [userData?.history, todayKey, currentNaam]);

  useEffect(() => {
    let interval;
    if (todayTotal > 0) interval = setInterval(() => setSessionSecs(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [todayTotal > 0]);

  const roundsCompleted = Math.floor(todayTotal / goal);
  const currentRoundProgress = todayTotal % goal;
  const percentage = Math.min((currentRoundProgress / goal) * 100, 100);
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const highestDayCount = useMemo(() => {
    if (!userData?.history) return 0;
    return Math.max(...Object.values(userData.history).map(day => 
      typeof day === 'number' ? day : Object.values(day).reduce((a,b)=>a+b,0)
    ), 0);
  }, [userData?.history]);

  return (
    <div className="min-h-screen pb-40 pt-10 px-6 max-w-2xl mx-auto flex flex-col items-center">
      {!isOnline && <OfflineBanner />}

      {/* Header Info */}
      <div className="w-full flex justify-between items-center mb-10">
        <div className="flex items-center gap-3 bg-[var(--card-bg)] px-5 py-2.5 rounded-full border border-[var(--glass-border)] text-[var(--text-primary)] shadow-sm font-bold">
          <Activity size={18} className="text-[var(--accent)]" />
          <span className="text-xs tracking-tighter">{Math.floor(sessionSecs/60)}m {sessionSecs%60}s</span>
        </div>
        <button 
          onClick={() => setShowMomentum(true)}
          className="flex items-center gap-2 bg-[var(--accent-dim)] px-5 py-2.5 rounded-full border border-[var(--accent)]/30 active:scale-95 transition-transform"
        >
          <Flame size={20} className="text-[var(--accent)] fill-[var(--accent)]" />
          <span className="font-black text-[var(--accent)] text-lg">{userData?.streak || 0}</span>
        </button>
      </div>

      {/* Mantra Selector */}
      <motion.button onClick={() => setShowSettings(true)} className="text-center mb-8 group">
        <span className="text-[10px] uppercase tracking-[0.4em] text-[var(--text-secondary)] mb-2 block font-bold">Divine Focus</span>
        <div className="flex items-center gap-3 justify-center">
          <h2 className="text-4xl font-serif text-[var(--text-primary)]">{currentNaam}</h2>
          <ChevronDown size={24} className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-all" />
        </div>
      </motion.button>

      {/* Ring Counter */}
      <div className="relative mb-12 flex items-center justify-center scale-95 sm:scale-110">
        <motion.div 
          whileTap={isOnline ? { scale: 0.95 } : {}}
          onClick={() => isOnline && updateCount(tapIncrement)}
          className={`relative z-10 ${isOnline ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}
        >
          <AnimatePresence>
              {currentRoundProgress === 0 && todayTotal > 0 && (
                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.5, opacity: 0.5 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[var(--accent)] rounded-full blur-3xl pointer-events-none" />
              )}
          </AnimatePresence>
          <div className="absolute inset-0 bg-[var(--accent)] blur-[120px] opacity-10 rounded-full" />
          <svg width="320" height="320" className="transform -rotate-90">
            <circle cx="160" cy="160" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-[var(--card-bg)]" />
            <motion.circle 
              cx="160" cy="160" r={radius} stroke="var(--accent)" strokeWidth="10" fill="transparent" 
              strokeDasharray={circumference} animate={{ strokeDashoffset: offset }}
              strokeLinecap="round" className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1 font-bold">Round {roundsCompleted + 1}</span>
            <div className="flex items-baseline">
              <span className="text-8xl font-serif font-bold text-[var(--text-primary)]">{isPrivate ? '••' : currentRoundProgress}</span>
              <span className="text-[var(--text-secondary)] text-2xl font-light">/{goal}</span>
            </div>
            <div className="mt-4 bg-[var(--accent-dim)] text-[var(--accent)] px-4 py-1.5 rounded-full text-[10px] font-black border border-[var(--accent)]/10">
              +{tapIncrement} Per Tap
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-md">
        <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-[2.5rem] p-6 flex flex-col items-center shadow-lg">
          <span className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] mb-1 font-bold">Today</span>
          <span className="text-2xl font-bold text-[var(--text-primary)]">{formatNum(todayTotal, isPrivate)}</span>
        </div>
        <button onClick={() => setShowManual(true)} className="bg-[var(--accent)] rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-[var(--accent-dim)] active:scale-90 transition-all">
          <Edit3 size={32} />
        </button>
        <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-[2.5rem] p-6 flex flex-col items-center shadow-lg">
          <span className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] mb-1 font-bold">Mala Done</span>
          <span className="text-2xl font-bold text-[var(--accent)]">{roundsCompleted}x</span>
        </div>
      </div>

      {/* MOMENTUM MODAL (Improved) */}
      <AnimatePresence>
        {showMomentum && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[var(--bg-primary)]/95 backdrop-blur-2xl z-[500] p-6 overflow-y-auto pt-20">
            <button onClick={() => setShowMomentum(false)} className="fixed top-8 right-8 p-4 bg-[var(--card-bg)] rounded-full text-[var(--text-primary)]"><X size={24}/></button>
            <div className="max-w-md mx-auto w-full space-y-8 pb-10">
              <div className="text-center">
                <Flame size={80} className="mx-auto text-orange-500 mb-4 drop-shadow-[0_0_20px_rgba(255,165,0,0.4)]" />
                <h2 className="text-5xl font-serif text-[var(--text-primary)]">{userData?.streak || 0} Day Streak</h2>
                <p className="text-[var(--text-secondary)] font-medium mt-2">Momentum is the fire of practice.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-[2rem] p-6 text-center">
                      <span className="text-[10px] uppercase font-black text-[var(--text-secondary)] block mb-1">Max Streak</span>
                      <span className="text-2xl font-bold text-[var(--text-primary)]">{userData?.maxStreak || 0} Days</span>
                  </div>
                  <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-[2rem] p-6 text-center">
                      <span className="text-[10px] uppercase font-black text-[var(--text-secondary)] block mb-1">Best Day</span>
                      <span className="text-2xl font-bold text-[var(--accent)]">{highestDayCount.toLocaleString()}</span>
                  </div>
              </div>

              <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-[3rem] p-8 shadow-xl">
                <div className="flex justify-between mb-8">
                  {eachDayOfInterval({ start: startOfWeek(new Date()), end: endOfWeek(new Date()) }).map((day, i) => {
                    const key = format(day, 'yyyy-MM-dd');
                    const dayData = userData?.history?.[key];
                    const hasDone = dayData && (typeof dayData === 'number' ? dayData > 0 : Object.values(dayData).some(v => v > 0));
                    return (
                      <div key={i} className="flex flex-col items-center gap-3">
                        <span className="text-[10px] text-[var(--text-secondary)] uppercase font-black">{format(day, 'E')[0]}</span>
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${isSameDay(day, new Date()) ? 'border-[var(--accent)] scale-110' : 'border-transparent'} ${hasDone ? 'bg-[var(--accent)] text-white shadow-lg' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                          {hasDone ? <Check size={20} strokeWidth={4} /> : <X size={16} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-[3rem] p-4 shadow-xl">
                <Calendar 
                   tileClassName={({ date }) => {
                    const str = format(date, 'yyyy-MM-dd');
                    return userData?.history?.[str] ? 'highlight-day' : '';
                   }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MANTRA & GOAL SETTINGS */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={()=>setShowSettings(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150]" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-x-0 bottom-0 bg-[var(--bg-secondary)] rounded-t-[3.5rem] z-[160] p-10 pb-16 max-w-2xl mx-auto border-t border-[var(--glass-border)] shadow-2xl">
              <div className="w-16 h-1.5 bg-gray-300 dark:bg-white/10 rounded-full mx-auto mb-10" />
              <div className="space-y-8">
                <div>
                  <h4 className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-5 font-bold">Daily Goal (Mala)</h4>
                  <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                    {[11, 21, 51, 108, 1008].map(num => (
                      <button key={num} onClick={() => updateDoc(doc(db, "users", user.uid), { dailyGoal: num })} className={`px-8 py-4 rounded-2xl font-black transition-all ${goal === num ? 'bg-[var(--accent)] text-white' : 'bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--glass-border)]'}`}>{num}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-5 font-bold">Select Mantra</h4>
                  <div className="space-y-3">
                    {userData?.naams?.map((n, i) => (
                      <button key={i} onClick={() => { updateDoc(doc(db, "users", user.uid), { currentNaam: n }); setShowSettings(false); }} className={`w-full p-5 rounded-[2rem] text-left flex justify-between items-center transition-all ${currentNaam === n ? 'bg-[var(--accent-dim)] border border-[var(--accent)]/30 text-[var(--accent)]' : 'bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--glass-border)]'}`}>
                        <span className="font-bold text-lg">{n}</span>
                        {currentNaam === n && <Check size={22} strokeWidth={3} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MANUAL ENTRY */}
      <AnimatePresence>
        {showManual && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[600] flex items-center justify-center p-6">
            <div className="bg-[var(--card-bg)] w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border border-[var(--glass-border)]">
              <h3 className="text-2xl font-serif mb-8 text-center text-[var(--text-primary)]">Manual Count</h3>
              <input type="number" autoFocus value={manualInput} onChange={(e) => setManualInput(e.target.value)} className="w-full bg-[var(--bg-secondary)] text-5xl text-center py-8 rounded-3xl outline-none mb-8 text-[var(--text-primary)] border border-[var(--glass-border)] focus:border-[var(--accent)]" placeholder="0" />
              <div className="flex gap-4">
                <button onClick={() => setShowManual(false)} className="flex-1 py-5 font-bold text-[var(--text-secondary)] uppercase tracking-widest text-xs">Cancel</button>
                <button onClick={() => { updateCount(parseInt(manualInput) || 0); setShowManual(false); setManualInput(""); }} className="flex-1 py-5 bg-[var(--accent)] text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-[var(--accent-dim)]">Save</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatsPage = ({ userData }) => {
  const [view, setView] = useState('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  const isPrivate = userData?.isPrivate || false;

  const getChartData = () => {
    if (!userData?.history) return { total: 0, data: [], label: "" };
    let data = [];
    let total = 0;
    const start = view === 'daily' ? startOfWeek(currentDate) : startOfMonth(currentDate);
    const end = view === 'daily' ? endOfWeek(currentDate) : endOfMonth(currentDate);
    
    eachDayOfInterval({ start, end }).forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      const entry = userData.history[key];
      const val = typeof entry === 'number' ? entry : Object.values(entry || {}).reduce((a,b)=>a+b, 0);
      total += val;
      data.push({ label: format(day, view === 'daily' ? 'EEE' : 'd'), val });
    });
    
    return { total, data, label: format(currentDate, view === 'daily' ? 'MMM d - MMM d, yyyy' : 'MMMM yyyy') };
  };

  const stats = getChartData();
  const maxVal = Math.max(...stats.data.map(d => d.val), 1);

  return (
    <div className="min-h-screen pb-40 pt-16 px-6 max-w-4xl mx-auto transition-colors duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-serif text-[var(--text-primary)] tracking-tight">Analytics</h2>
          <p className="text-[var(--text-secondary)] font-bold mt-1 text-sm uppercase tracking-widest">{stats.label}</p>
        </div>
        <div className="flex bg-[var(--card-bg)] p-1.5 rounded-2xl w-full sm:w-auto shadow-inner border border-[var(--glass-border)]">
          <button onClick={() => setView('daily')} className={`flex-1 sm:px-6 py-2.5 rounded-xl text-xs font-black transition-all ${view === 'daily' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-secondary)]'}`}>Weekly</button>
          <button onClick={() => setView('monthly')} className={`flex-1 sm:px-6 py-2.5 rounded-xl text-xs font-black transition-all ${view === 'monthly' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-secondary)]'}`}>Monthly</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] p-8 rounded-[2.5rem] shadow-sm">
          <span className="text-[10px] font-black uppercase text-[var(--text-secondary)]">Total</span>
          <p className="text-4xl font-bold mt-2 text-[var(--text-primary)]">{formatNum(stats.total, isPrivate)}</p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] p-8 rounded-[2.5rem] shadow-sm">
          <span className="text-[10px] font-black uppercase text-[var(--text-secondary)]">Average</span>
          <p className="text-4xl font-bold mt-2 text-[var(--accent)]">{formatNum(Math.round(stats.total / stats.data.length), isPrivate)}</p>
        </div>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-[3rem] p-10 h-80 flex items-end justify-between gap-1 shadow-2xl relative overflow-hidden">
        {stats.data.map((d, i) => {
          const h = (d.val / maxVal) * 100;
          return (
            <div key={i} className="flex-1 group relative flex flex-col items-center justify-end h-full">
              <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] py-1.5 px-3 rounded-xl z-20 pointer-events-none font-black shadow-2xl">
                {isPrivate ? '••' : d.val}
              </div>
              <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(h, 5)}%` }} className={`w-full max-w-[12px] rounded-full transition-all ${d.val > 0 ? 'bg-[var(--accent)] shadow-[0_0_15px_var(--accent)]/30' : 'bg-[var(--bg-secondary)]'}`} />
              <span className="text-[9px] text-[var(--text-secondary)] mt-4 uppercase font-black tracking-tighter truncate w-full text-center">{d.label}</span>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-center gap-10 mt-12">
        <button onClick={() => setCurrentDate(view === 'daily' ? subWeeks(currentDate, 1) : subMonths(currentDate, 1))} className="p-5 bg-[var(--card-bg)] text-[var(--text-primary)] rounded-full shadow-lg border border-[var(--glass-border)] active:scale-90 transition-transform"><ChevronLeft size={24}/></button>
        <button onClick={() => setCurrentDate(view === 'daily' ? addWeeks(currentDate, 1) : addMonths(currentDate, 1))} className="p-5 bg-[var(--card-bg)] text-[var(--text-primary)] rounded-full shadow-lg border border-[var(--glass-border)] active:scale-90 transition-transform"><ChevronRight size={24}/></button>
      </div>
    </div>
  );
};

const ProfilePage = ({ user, userData, updateProfileData, toggleTheme, isDark }) => {
  const [newNaam, setNewNaam] = useState("");
  const [showArchive, setShowArchive] = useState(false);
  const hapticsEnabled = userData?.hapticsEnabled !== false;
  
  const lifetimeTotal = useMemo(() => {
    if (!userData?.history) return 0;
    return Object.values(userData.history).reduce((acc, day) => {
      if (typeof day === 'number') return acc + day;
      return acc + Object.values(day).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
    }, 0);
  }, [userData?.history]);

  return (
    <div className="min-h-screen pb-40 pt-16 px-6 max-w-2xl mx-auto">
      <div className="flex flex-col items-center mb-12 text-center">
        <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-[var(--accent)] to-transparent mb-6 shadow-2xl">
          <div className="w-full h-full rounded-full bg-neutral-900 border-4 border-[var(--bg-primary)] flex items-center justify-center text-4xl overflow-hidden font-serif text-white shadow-inner">
            {user.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover"/> : user.displayName?.[0] || 'S'}
          </div>
        </div>
        <h2 className="text-3xl font-serif text-[var(--text-primary)]">{user.displayName || 'Seeker'}</h2>
        <p className="text-[var(--text-secondary)] font-bold text-xs uppercase tracking-widest mt-1">{user.email}</p>
      </div>

      <div className="space-y-5">
        {/* Spiritual Archive (Lifetime) */}
        <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-[2.5rem] overflow-hidden shadow-sm">
          <button onClick={() => setShowArchive(!showArchive)} className="w-full p-8 flex justify-between items-center text-[var(--text-primary)] group">
            <span className="flex items-center gap-4 font-black text-xs uppercase tracking-widest"><Trophy size={24} className="text-yellow-500"/> Spiritual Archive</span>
            <ChevronDown size={22} className={`transition-transform duration-500 ${showArchive ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showArchive && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-8 pb-8">
                <div className="bg-[var(--bg-secondary)] rounded-[2rem] p-8 text-center border border-[var(--glass-border)]">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-secondary)] mb-3 font-black">Lifetime Connection</p>
                    <p className="text-5xl font-bold text-[var(--text-primary)] font-serif">{lifetimeTotal.toLocaleString()}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={toggleTheme} className="bg-[var(--card-bg)] border border-[var(--glass-border)] p-8 rounded-[2.5rem] flex flex-col items-center gap-4 shadow-sm active:scale-95 transition-transform">
            {isDark ? <Moon size={30} className="text-violet-400"/> : <Sun size={30} className="text-orange-400"/>}
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
          <button onClick={() => updateProfileData({ isPrivate: !userData?.isPrivate })} className="bg-[var(--card-bg)] border border-[var(--glass-border)] p-8 rounded-[2.5rem] flex flex-col items-center gap-4 shadow-sm active:scale-95 transition-transform">
            {userData?.isPrivate ? <EyeOff size={30} className="text-red-400"/> : <Eye size={30} className="text-green-400"/>}
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">{userData?.isPrivate ? 'Privacy On' : 'Privacy Off'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <button onClick={() => updateProfileData({ hapticsEnabled: !hapticsEnabled })} className="bg-[var(--card-bg)] border border-[var(--glass-border)] p-8 rounded-[2.5rem] flex flex-col items-center gap-4 shadow-sm active:scale-95 transition-transform">
                <Smartphone size={30} className={hapticsEnabled ? "text-blue-500" : "text-gray-400"} />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">{hapticsEnabled ? 'Haptics On' : 'Haptics Off'}</span>
            </button>
            <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] p-8 rounded-[2.5rem] flex flex-col items-center gap-4 shadow-sm">
                <div className="flex gap-2">
                    {[1, 10, 108].map(v => (
                        <button key={v} onClick={() => updateProfileData({ tapIncrement: v })} className={`w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-bold ${userData?.tapIncrement === v ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>+{v}</button>
                    ))}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">Tap Power</span>
            </div>
        </div>

        {/* Theme Essence */}
        <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] p-8 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center gap-3 mb-6 text-[var(--text-secondary)]">
             <Palette size={20} /> <span className="text-[10px] uppercase font-black tracking-widest">Aura Essence</span>
          </div>
          <div className="flex justify-between items-center px-2">
            {Object.keys(THEMES).map(t => (
              <button key={t} onClick={() => updateProfileData({ theme: t })} className={`w-11 h-11 rounded-full transition-all relative ${userData?.theme === t ? 'scale-125 ring-4 ring-offset-4 dark:ring-offset-black ring-[var(--accent)]' : 'opacity-30 hover:opacity-100'}`} style={{ backgroundColor: THEMES[t].primary }} />
            ))}
          </div>
        </div>

        {/* Mantra Management */}
        <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] p-8 rounded-[2.5rem] shadow-sm">
          <h4 className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-6 font-black">Spiritual Mantras</h4>
          <div className="flex gap-3 mb-6">
            <input value={newNaam} onChange={e => setNewNaam(e.target.value)} placeholder="Add new mantra..." className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-2xl px-6 py-4 outline-none border border-[var(--glass-border)] focus:border-[var(--accent)] transition-all font-medium" />
            <button onClick={() => { if(newNaam.trim()){ updateProfileData({ naams: [...(userData.naams || []), newNaam] }); setNewNaam(""); } }} className="bg-[var(--accent)] p-4 rounded-2xl text-white shadow-lg"><Plus size={24}/></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {userData?.naams?.map((n, i) => (
              <div key={i} className="bg-[var(--bg-secondary)] px-5 py-2.5 rounded-full text-[10px] font-black text-[var(--text-primary)] border border-[var(--glass-border)] uppercase tracking-tighter">
                {n}
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => signOut(auth)} className="w-full py-7 text-red-500 font-black uppercase tracking-[0.4em] text-xs bg-red-500/5 rounded-[2.5rem] border border-red-500/10 mt-6 active:scale-95 transition-all shadow-sm">
          End Session
        </button>
      </div>
    </div>
  );
};

// --- AUTH ---
const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[var(--bg-primary)] transition-colors duration-500">
      <div className="w-full max-w-sm">
        <h1 className="text-6xl font-serif text-[var(--accent)] text-center mb-4 tracking-tighter">NaamJaap</h1>
        <p className="text-center text-[var(--text-secondary)] mb-12 text-sm font-serif italic">Digital Beads for Spiritual Excellence.</p>
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && <input type="text" placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} className="w-full p-5 rounded-2xl bg-[var(--card-bg)] text-[var(--text-primary)] outline-none border border-[var(--glass-border)] focus:border-[var(--accent)] shadow-sm" required />}
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-5 rounded-2xl bg-[var(--card-bg)] text-[var(--text-primary)] outline-none border border-[var(--glass-border)] focus:border-[var(--accent)] shadow-sm" required />
          <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-5 rounded-2xl bg-[var(--card-bg)] text-[var(--text-primary)] outline-none border border-[var(--glass-border)] focus:border-[var(--accent)] shadow-sm" required />
          <button className="w-full py-5 bg-[var(--accent)] text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl active:scale-95 transition-transform">
            {isSignUp ? 'Begin Journey' : 'Portal Login'}
          </button>
        </form>
        <button onClick={() => signInWithPopup(auth, googleProvider)} className="w-full py-5 mt-4 border border-[var(--glass-border)] rounded-2xl font-black uppercase tracking-widest text-xs text-[var(--text-primary)] flex items-center justify-center gap-3 shadow-sm bg-[var(--card-bg)]">
          Continue with Google
        </button>
        <p className="mt-10 text-center text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest">
          {isSignUp ? "Already a seeker?" : "New to NaamJaap?"} 
          <button onClick={()=>setIsSignUp(!isSignUp)} className="ml-2 text-[var(--accent)] underline underline-offset-4">{isSignUp ? 'Sign In' : 'Join Now'}</button>
        </p>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [themeMode, setThemeMode] = useState('dark');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleSync = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleSync);
    window.addEventListener('offline', handleSync);
    return () => { window.removeEventListener('online', handleSync); window.removeEventListener('offline', handleSync); };
  }, []);

  useEffect(() => {
    const accent = THEMES[userData?.theme || 'saffron'].primary;
    const accentDim = THEMES[userData?.theme || 'saffron'].dim;
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-dim', accentDim);
    
    if (themeMode === 'light') {
        document.documentElement.style.setProperty('--bg-primary', '#f8fafc');
        document.documentElement.style.setProperty('--bg-secondary', '#f1f5f9');
        document.documentElement.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.9)');
        document.documentElement.style.setProperty('--text-primary', '#0f172a');
        document.documentElement.style.setProperty('--text-secondary', '#64748b');
        document.documentElement.style.setProperty('--glass-border', '#e2e8f0');
    } else {
        document.documentElement.style.setProperty('--bg-primary', '#000000');
        document.documentElement.style.setProperty('--bg-secondary', '#111111');
        document.documentElement.style.setProperty('--card-bg', 'rgba(25, 25, 25, 0.6)');
        document.documentElement.style.setProperty('--text-primary', '#ffffff');
        document.documentElement.style.setProperty('--text-secondary', '#888888');
        document.documentElement.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.1)');
    }
  }, [userData?.theme, themeMode]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, "users", u.uid);
        onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            // SELF-HEALING STREAK 
            const history = data.history || {};
            let currentStreak = 0;
            let checkDate = new Date();
            while (true) {
              const str = format(checkDate, 'yyyy-MM-dd');
              const d = history[str];
              const total = typeof d === 'number' ? d : Object.values(d || {}).reduce((a,b)=>a+b, 0);
              if (total > 0) {
                currentStreak++;
                checkDate = subDays(checkDate, 1);
              } else {
                if (isSameDay(checkDate, new Date())) { checkDate = subDays(checkDate, 1); continue; }
                break;
              }
            }
            setUserData({ ...data, streak: currentStreak });
          } else {
            const init = {
              naams: ["Hare Krishna", "Om Namah Shivaya", "Jai Shri Ram"],
              currentNaam: "Hare Krishna", dailyGoal: 108,
              streak: 0, maxStreak: 0, history: {}, theme: 'saffron', isPrivate: false, tapIncrement: 1, hapticsEnabled: true
            };
            setDoc(docRef, init);
            setUserData(init);
          }
          setLoading(false);
        });
      } else { setLoading(false); }
    });
    return () => unsub();
  }, []);

  const updateCount = async (amount) => {
    if (!user || !isOnline) return;
    if (userData.hapticsEnabled !== false && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
    }
    const today = format(new Date(), 'yyyy-MM-dd');
    const currentNaam = userData.currentNaam;
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      [`history.${today}.${currentNaam}`]: increment(amount),
      lastActiveDate: today
    });
  };

  const updateProfileData = async (data) => {
    if (user) await updateDoc(doc(db, "users", user.uid), data);
  };

  if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-black gap-6">
    <div className="w-16 h-16 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
    <span className="text-[var(--accent)] font-serif italic text-2xl animate-pulse">NaamJaap...</span>
  </div>;

  if (!user) return <Login />;

  return (
    <Router>
      <div className="min-h-screen bg-[var(--bg-primary)] transition-all duration-700 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<HomePage user={user} userData={userData} updateCount={updateCount} isOnline={isOnline} />} />
          <Route path="/stats" element={<StatsPage userData={userData} />} />
          <Route path="/profile" element={<ProfilePage user={user} userData={userData} updateProfileData={updateProfileData} isDark={themeMode === 'dark'} toggleTheme={() => setThemeMode(t => t === 'dark' ? 'light' : 'dark')} />} />
        </Routes>
        <Navbar />
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .react-calendar { border: none !important; width: 100% !important; background: transparent !important; color: inherit !important; font-family: inherit !important; padding: 1.5rem; }
        .react-calendar__tile { height: 55px; font-weight: bold; border-radius: 15px; }
        .react-calendar__tile--now { background: var(--accent-dim) !important; color: var(--accent) !important; }
        .react-calendar__tile--active { background: var(--accent) !important; color: white !important; transform: scale(0.9); box-shadow: 0 10px 20px var(--accent-dim); }
        .react-calendar__navigation button { color: inherit !important; font-size: 1.8rem; font-weight: 200; }
        .react-calendar__month-view__days__day--neighboringMonth { opacity: 0.1; }
        .react-calendar__month-view__weekdays__weekday { font-size: 0.7rem; text-transform: uppercase; font-weight: 900; color: var(--text-secondary); text-decoration: none !important; }
        .highlight-day { position: relative; color: var(--accent) !important; font-weight: 900 !important; }
        .highlight-day::after { content: ''; position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; background: var(--accent); border-radius: 50%; }
      `}</style>
    </Router>
  );
}
