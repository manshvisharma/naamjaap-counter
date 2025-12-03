import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, BarChart2, User, Home, Check, X, 
  ChevronLeft, ChevronRight, Settings, Plus, 
  Sun, Moon, Edit3, Clock, Trophy
} from 'lucide-react';
import Calendar from 'react-calendar';
import { 
  format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, 
  isSameDay, startOfMonth, endOfMonth, addMonths, subMonths, 
  addWeeks, subWeeks, isAfter
} from 'date-fns';
import 'react-calendar/dist/Calendar.css';

// --- UTILS ---
const formatNum = (num) => num ? num.toLocaleString() : 0;
const triggerHaptic = () => { 
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(15);
  }
};

// --- COMPONENTS ---

// 1. Navbar
const Navbar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[320px] z-[100]">
      <div className="floating-nav rounded-full px-8 py-5 flex justify-between items-center transition-all duration-300">
        <Link to="/" className="relative flex flex-col items-center group">
          <Home size={26} className={`transition-colors duration-300 ${isActive('/') ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`} />
          {isActive('/') && <motion.div layoutId="nav-dot" className="absolute -bottom-3 w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />}
        </Link>
        <Link to="/stats" className="relative flex flex-col items-center group">
          <BarChart2 size={26} className={`transition-colors duration-300 ${isActive('/stats') ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`} />
          {isActive('/stats') && <motion.div layoutId="nav-dot" className="absolute -bottom-3 w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />}
        </Link>
        <Link to="/profile" className="relative flex flex-col items-center group">
          <User size={26} className={`transition-colors duration-300 ${isActive('/profile') ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`} />
          {isActive('/profile') && <motion.div layoutId="nav-dot" className="absolute -bottom-3 w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />}
        </Link>
      </div>
    </div>
  );
};

// 2. Login
const Login = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] p-6 relative overflow-hidden transition-colors duration-500">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="z-10 text-center">
        <h1 className="text-6xl font-serif text-[var(--accent)] mb-2 tracking-tighter text-glow">NaamJaap</h1>
        <p className="text-[var(--text-secondary)] mb-10 text-lg font-light tracking-wide">Quantify your Divinity.</p>
        <button 
          onClick={() => signInWithPopup(auth, googleProvider)}
          className="bg-[var(--accent)] text-white font-medium py-4 px-12 rounded-full shadow-glow transition-all transform active:scale-95"
        >
          Begin Journey
        </button>
      </motion.div>
    </div>
  );
};

// 3. Home Page
const HomePage = ({ user, userData, updateCount, changeNaam, naams, setGoal, manualAdd }) => {
  const [showStreak, setShowStreak] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualInput, setManualInput] = useState("");
  
  const currentNaam = userData?.currentNaam || "Hare Krishna";
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  
  const todaySpecificCount = userData?.history?.[todayKey]?.[currentNaam] || 0;
  
  // Totals for Streak Page
  const todayTotalAll = userData?.history?.[todayKey] 
    ? Object.values(userData.history[todayKey]).reduce((a,b) => (typeof a === 'number' ? a : 0) + (typeof b === 'number' ? b : 0), 0)
    : 0;

  const getHighestCount = () => {
      if (!userData?.history) return 0;
      let max = 0;
      Object.values(userData.history).forEach(dayData => {
          if (typeof dayData === 'number') max = Math.max(max, dayData);
          else if (dayData) {
              const dayTotal = Object.values(dayData).reduce((a,b)=>a+b, 0);
              max = Math.max(max, dayTotal);
          }
      });
      return max;
  };

  const goal = userData?.dailyGoal || 108;
  const roundsCompleted = Math.floor(todaySpecificCount / goal);
  const currentRoundProgress = todaySpecificCount % goal;
  const percentage = (currentRoundProgress / goal) * 100;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const handleManualSubmit = () => {
      const val = parseInt(manualInput);
      if (!isNaN(val) && val !== 0) {
          manualAdd(val);
          setManualInput("");
          setShowManual(false);
      }
  };

  return (
    <div className="min-h-screen pb-32 p-6 flex flex-col items-center relative overflow-hidden transition-colors duration-500">
      
      {/* Header */}
      <div className="w-full flex justify-between items-start pt-8 z-10 px-2">
        <div className="flex flex-col items-start"></div>
        <button 
          onClick={() => setShowStreak(true)} 
          className="glass-card flex items-center gap-2 px-4 py-2 rounded-full active:scale-95 transition-transform cursor-pointer"
        >
          <Flame className={userData?.streak > 0 ? "fill-orange-500 text-orange-500" : "text-[var(--text-secondary)]"} size={20} />
          <span className="font-bold text-[var(--accent)] text-lg">{userData?.streak || 0}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full flex flex-col items-center mt-4">
        
        {/* Naam Selector */}
        <motion.button 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowSettings(true)}
          className="mb-8 flex flex-col items-center group cursor-pointer"
        >
           <span className="text-xs text-[var(--text-secondary)] uppercase tracking-[0.3em] mb-2">Chanting</span>
           <div className="flex items-center gap-3">
             <h2 className="text-3xl font-serif text-[var(--text-primary)]">{currentNaam}</h2>
             <Settings size={18} className="text-[var(--text-secondary)] opacity-50 group-hover:opacity-100 transition-opacity"/>
           </div>
        </motion.button>

        {/* Counter Ring */}
        <div className="relative mb-8">
            <motion.div 
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault(); 
              updateCount(1);
            }}
            className="relative cursor-pointer select-none z-10 touch-manipulation"
            >
            <div className={`absolute inset-0 rounded-full blur-[80px] transition-all duration-1000 opacity-40 bg-[var(--accent)]`}></div>
            
            <svg width="320" height="320" className="transform -rotate-90">
                <circle cx="160" cy="160" r={radius} stroke="var(--bg-secondary)" strokeWidth="12" fill="transparent" />
                <circle 
                    cx="160" 
                    cy="160" 
                    r={radius} 
                    stroke="var(--accent)" 
                    strokeWidth="16" 
                    fill="transparent" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={offset} 
                    strokeLinecap="round"
                    className="transition-[stroke-dashoffset] duration-100 ease-out"
                />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-[var(--text-secondary)] text-[10px] uppercase tracking-[0.2em] mb-2">
                    {roundsCompleted > 0 ? `Round ${roundsCompleted + 1}` : 'Start'}
                </div>
                <div className="flex items-baseline gap-1">
                    <motion.span 
                        key={currentRoundProgress} 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-7xl font-serif font-bold text-[var(--text-primary)]"
                    >
                        {currentRoundProgress}
                    </motion.span>
                    <span className="text-[var(--text-secondary)] text-xl font-light">/{goal}</span>
                </div>
            </div>
            </motion.div>
        </div>

        {/* Controls */}
        <div className="w-full max-w-[300px] flex justify-between items-center px-4">
            <div className="flex flex-col">
                <span className="text-[10px] text-[var(--text-secondary)] uppercase">Today's Total</span>
                <span className="text-xl font-bold text-[var(--text-primary)]">{todaySpecificCount}</span>
            </div>
            
            <button 
                onClick={() => setShowManual(true)}
                className="w-12 h-12 rounded-full glass-card flex items-center justify-center text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all shadow-lg"
            >
                <Edit3 size={20} />
            </button>

            <div className="flex flex-col text-right">
                <span className="text-[10px] text-[var(--text-secondary)] uppercase">Goal Met</span>
                <span className="text-xl font-bold text-[var(--accent)]">{roundsCompleted}x</span>
            </div>
        </div>
      </div>

      {/* --- STREAK MODAL --- */}
      <AnimatePresence>
        {showStreak && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-lg h-[85vh] overflow-y-auto bg-[var(--bg-secondary)] rounded-[3rem] p-6 border border-[var(--glass-border)] relative hide-scrollbar shadow-2xl">
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-[var(--bg-secondary)] z-10 py-2">
                <h2 className="text-2xl font-serif text-[var(--text-primary)]">Momentum</h2>
                <button onClick={() => setShowStreak(false)} className="bg-[var(--bg-primary)] p-2 rounded-full text-[var(--text-secondary)]"><X size={20}/></button>
              </div>

              {/* Streak Cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="glass-card p-5 rounded-3xl flex flex-col items-center">
                  <Flame className="text-orange-500 mb-2" size={24} />
                  <span className="text-2xl font-bold text-[var(--text-primary)]">{userData?.streak || 0}</span>
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase">Current Streak</span>
                </div>
                <div className="glass-card p-5 rounded-3xl flex flex-col items-center">
                  <Trophy className="text-[var(--accent)] mb-2" size={24} />
                  <span className="text-2xl font-bold text-[var(--text-primary)]">{userData?.maxStreak || 0}</span>
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase">Best Streak</span>
                </div>
              </div>

              {/* Weekly Momentum */}
              <div className="glass-card p-5 rounded-3xl border border-[var(--glass-border)] mb-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[var(--text-primary)] font-medium text-sm">This Week</span>
                </div>
                <div className="flex justify-between items-center">
                  {eachDayOfInterval({ start: startOfWeek(new Date()), end: endOfWeek(new Date()) }).map((day, idx) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const isFuture = isAfter(day, new Date()) && !isSameDay(day, new Date());
                    const isToday = isSameDay(day, new Date());
                    
                    const dayData = userData?.history?.[dateKey];
                    let dayTotal = 0;
                    if (typeof dayData === 'number') dayTotal = dayData;
                    else if (dayData && typeof dayData === 'object') dayTotal = Object.values(dayData).reduce((a,b)=>a+b,0);
                    
                    const hasDone = dayTotal > 0;
                    
                    return (
                      <div key={idx} className="flex flex-col items-center gap-2">
                        <span className="text-[10px] text-[var(--text-secondary)] uppercase">{format(day, 'EEEEE')}</span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all
                          ${isToday ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--glass-border)] bg-[var(--bg-primary)]'}
                          ${hasDone ? 'bg-[var(--accent)] border-[var(--accent)]' : ''}
                        `}>
                           {isFuture ? <Clock size={14} className="text-[var(--text-secondary)]"/> : 
                            hasDone ? <Check size={14} className="text-white" /> : 
                            isToday ? <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-pulse"></div> : 
                            <X size={14} className="text-[var(--text-secondary)] opacity-50" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Today's Total & Highest */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="glass-card p-5 rounded-3xl flex flex-col">
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase mb-1">Today's Total</span>
                  <span className="text-2xl font-bold text-[var(--text-primary)]">{todayTotalAll}</span>
                </div>
                <div className="glass-card p-5 rounded-3xl flex flex-col">
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase mb-1">Highest Record</span>
                  <span className="text-2xl font-bold text-[var(--accent)]">{getHighestCount()}</span>
                </div>
              </div>

              {/* Calendar */}
              <div className="glass-card p-4 rounded-3xl border border-[var(--glass-border)] mb-8">
                <Calendar 
                  tileClassName={({ date, view }) => {
                    if (view === 'month' && userData?.history) {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const dayData = userData.history[dateStr];
                      let dayTotal = 0;
                      if (typeof dayData === 'number') dayTotal = dayData;
                      else if (typeof dayData === 'object') dayTotal = Object.values(dayData).reduce((a,b)=>a+b,0);
                      
                      if (dayTotal >= goal) return 'text-[var(--accent)] font-bold';
                      if (dayTotal > 0) return 'text-[var(--text-secondary)]';
                    }
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MANUAL ENTRY --- */}
      <AnimatePresence>
        {showManual && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6"
            >
                <div className="glass-card w-full max-w-sm rounded-[2rem] p-8 flex flex-col items-center bg-[var(--bg-secondary)]">
                    <h3 className="text-xl text-[var(--text-primary)] font-serif mb-2">Adjust Count</h3>
                    <input 
                        type="number" 
                        autoFocus
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        placeholder="e.g. 10 or -1"
                        className="w-full bg-[var(--bg-primary)] text-[var(--text-primary)] text-3xl text-center py-4 rounded-2xl outline-none mb-6 border border-[var(--glass-border)] focus:border-[var(--accent)]"
                    />
                    <div className="flex gap-4 w-full">
                        <button onClick={() => setShowManual(false)} className="flex-1 py-4 rounded-xl bg-[var(--bg-primary)] text-[var(--text-secondary)] font-bold">Cancel</button>
                        <button onClick={handleManualSubmit} className="flex-1 py-4 rounded-xl bg-[var(--accent)] text-white font-bold shadow-glow">Update</button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- SETTINGS SHEET --- */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            className="fixed inset-x-0 bottom-0 bg-[var(--bg-secondary)] rounded-t-[3rem] z-[60] p-6 shadow-[0_-10px_60px_rgba(0,0,0,0.5)] h-[60vh] flex flex-col border-t border-[var(--glass-border)]"
          >
             <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-serif text-[var(--text-primary)]">Mantras</h3>
              <button onClick={() => setShowSettings(false)} className="bg-[var(--bg-primary)] p-2 rounded-full text-[var(--text-secondary)]"><X/></button>
            </div>
            <div className="overflow-y-auto flex-1 pb-10 hide-scrollbar space-y-3">
                {naams.map((naam, idx) => (
                    <button 
                    key={idx}
                    onClick={() => { changeNaam(naam); setShowSettings(false); }}
                    className={`w-full p-5 rounded-2xl text-left flex justify-between items-center transition-all ${userData?.currentNaam === naam ? 'bg-[var(--accent)] text-white shadow-glow' : 'bg-[var(--bg-primary)] text-[var(--text-primary)]'}`}
                    >
                    <span className="font-medium text-lg">{naam}</span>
                    {userData?.currentNaam === naam && <Check size={20}/>}
                    </button>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 4. Stats Page
const StatsPage = ({ userData }) => {
  const [view, setView] = useState('daily');
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentNaam = userData?.currentNaam || "Hare Krishna";

  const handleNext = () => {
    if (view === 'daily') setCurrentDate(addWeeks(currentDate, 1));
    if (view === 'monthly') setCurrentDate(addMonths(currentDate, 1));
  };

  const handlePrev = () => {
    if (view === 'daily') setCurrentDate(subWeeks(currentDate, 1));
    if (view === 'monthly') setCurrentDate(subMonths(currentDate, 1));
  };

  const getChartData = () => {
    if (!userData?.history) return { total: 0, avg: 0, data: [], label: "" };
    
    let data = [];
    let total = 0;
    let label = "";

    if (view === 'daily') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      label = `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
      
      eachDayOfInterval({ start, end }).forEach(day => {
        const key = format(day, 'yyyy-MM-dd');
        const entry = userData.history[key];
        let val = 0;
        if (typeof entry === 'number') val = entry; 
        else if (entry && typeof entry === 'object') val = entry[currentNaam] || 0;
        
        total += val;
        data.push({ label: format(day, 'EEE'), value: val, fullDate: day });
      });
    } else if (view === 'monthly') {
      label = format(currentDate, 'MMMM yyyy');
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      
      eachDayOfInterval({ start, end }).forEach(day => {
        const key = format(day, 'yyyy-MM-dd');
        const entry = userData.history[key];
        let val = 0;
        if (typeof entry === 'number') val = entry;
        else if (entry && typeof entry === 'object') val = entry[currentNaam] || 0;

        total += val;
        data.push({ label: format(day, 'd'), value: val });
      });
    }
    
    const avg = Math.round(total / (data.length || 1));
    return { total, avg, data, label };
  };

  const stats = getChartData();
  const maxVal = Math.max(...stats.data.map(d => d.value), 10);

  return (
    <div className="min-h-screen pb-32 p-6 bg-[var(--bg-primary)] transition-colors duration-500">
       <div className="flex justify-between items-center mt-6 mb-8">
         <div>
            <h2 className="text-2xl font-serif text-[var(--accent)]">Statistics</h2>
            <p className="text-[var(--text-secondary)] text-xs mt-1">For <span className="text-[var(--text-primary)] font-bold">{currentNaam}</span></p>
         </div>
         <div className="flex gap-2">
           <button onClick={handlePrev} className="p-2 bg-[var(--bg-secondary)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><ChevronLeft size={20}/></button>
           <button onClick={handleNext} className="p-2 bg-[var(--bg-secondary)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><ChevronRight size={20}/></button>
         </div>
       </div>

       <div className="flex bg-[var(--bg-secondary)] p-1 rounded-2xl mb-8 border border-[var(--glass-border)]">
         {['daily', 'monthly'].map(t => (
           <button 
             key={t} onClick={() => setView(t)}
             className={`flex-1 py-3 rounded-xl capitalize text-sm font-bold transition-all ${view === t ? 'bg-[var(--bg-primary)] text-[var(--accent)] shadow-lg' : 'text-[var(--text-secondary)]'}`}
           >
             {t}
           </button>
         ))}
       </div>

       <div className="text-center mb-6">
         <p className="text-[var(--text-secondary)] text-sm font-medium tracking-wide">{stats.label}</p>
       </div>

       <div className="grid grid-cols-2 gap-4 mb-8">
         <div className="glass-card p-5 rounded-3xl border-t border-[var(--accent)]/20">
           <p className="text-[var(--text-secondary)] text-[10px] uppercase tracking-widest">Total</p>
           <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{formatNum(stats.total)}</p>
         </div>
         <div className="glass-card p-5 rounded-3xl border-t border-[var(--accent)]/20">
           <p className="text-[var(--text-secondary)] text-[10px] uppercase tracking-widest">Avg / Day</p>
           <p className="text-3xl font-bold text-[var(--accent)] mt-1">{formatNum(stats.avg)}</p>
         </div>
       </div>

       <div className="glass-card p-6 rounded-3xl border border-[var(--glass-border)]">
          <div className="flex items-end justify-between h-56 gap-1">
             {stats.data.map((item, idx) => {
               const height = (item.value / maxVal) * 100;
               const isToday = item.fullDate && isSameDay(item.fullDate, new Date());
               
               return (
                 <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group cursor-pointer">
                   <div className="relative w-full flex justify-center items-end h-full">
                      {item.value > 0 && (
                          <div className="absolute -top-8 bg-[var(--bg-secondary)] text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 text-[var(--text-primary)]">
                            {item.value}
                          </div>
                      )}
                      <div 
                        className={`w-full max-w-[12px] min-h-[4px] rounded-t-full transition-all duration-700 ${isToday ? 'bg-[var(--accent)] shadow-glow' : 'bg-[var(--bg-secondary)]'}`}
                        style={{ height: `${height}%` }}
                      ></div>
                   </div>
                   <p className="text-[9px] text-[var(--text-secondary)] mt-3 font-medium truncate w-full text-center">{item.label}</p>
                 </div>
               )
             })}
          </div>
       </div>
    </div>
  );
};

// 5. Profile Page
const ProfilePage = ({ user, userData, addNaam, toggleTheme, isDark }) => {
  const [newNaam, setNewNaam] = useState("");

  const handleAdd = () => {
    if (newNaam.trim()) {
      addNaam(newNaam);
      setNewNaam("");
    }
  };

  return (
    <div className="min-h-screen pb-32 p-6 transition-colors duration-500">
      <div className="mt-12 flex flex-col items-center">
        <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dim)] shadow-glow mb-6">
          <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full border-4 border-[var(--bg-primary)]" />
        </div>
        <h2 className="text-3xl font-serif text-[var(--text-primary)]">{user.displayName}</h2>
        <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
      </div>

      <div className="mt-12 space-y-4">
        <button onClick={toggleTheme} className="w-full glass-card p-5 rounded-3xl flex justify-between items-center bg-[var(--bg-secondary)]">
            <span className="flex items-center gap-3 text-[var(--text-primary)] font-medium">
                {isDark ? <Moon size={20} className="text-[var(--accent)]"/> : <Sun size={20} className="text-[var(--accent)]"/>}
                Appearance
            </span>
            <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-primary)] px-3 py-1 rounded-full uppercase tracking-wider">
                {isDark ? 'Divine Dark' : 'Apple Light'}
            </span>
        </button>

        <div className="glass-card rounded-3xl p-6 bg-[var(--bg-secondary)]">
          <h3 className="text-lg text-[var(--accent)] font-serif mb-4 flex items-center gap-2">
            <Plus size={18}/> Add Mantra
          </h3>
          <div className="flex gap-3">
            <input 
              value={newNaam}
              onChange={(e) => setNewNaam(e.target.value)}
              placeholder="e.g. Om Namah Shivaya"
              className="flex-1 bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 rounded-xl outline-none border border-transparent focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-secondary)]"
            />
            <button onClick={handleAdd} className="bg-[var(--accent)] text-white p-4 rounded-xl font-bold shadow-lg"><Plus/></button>
          </div>
        </div>

        <button onClick={() => signOut(auth)} className="w-full bg-red-500/10 text-red-500 py-5 rounded-3xl font-bold border border-red-500/20 mt-4">
          Sign Out
        </button>
      </div>
    </div>
  );
};

// --- MAIN APP LOGIC ---

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-theme' : '';
  }, [theme]);

  const defaultNaams = ["Om Namah Shivaya", "Hare Krishna", "Jai Shri Ram", "Om"];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setUserData(docSnap.data());
            } else {
                const todayKey = format(new Date(), 'yyyy-MM-dd');
                const newUser = {
                    naams: defaultNaams,
                    currentNaam: defaultNaams[0],
                    dailyGoal: 108,
                    streak: 0,
                    maxStreak: 0,
                    history: { [todayKey]: {} }, 
                    lastActiveDate: todayKey
                };
                setDoc(docRef, newUser);
                setUserData(newUser);
            }
            setLoading(false);
        }, (error) => {
            console.error("Listener error:", error);
            setLoading(false); 
        });
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const updateCount = async (amount = 1) => {
    if (!user || !userData) return;
    if (amount > 0) triggerHaptic();

    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const yesterdayKey = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const currentNaam = userData.currentNaam || defaultNaams[0];
    
    let newData = JSON.parse(JSON.stringify(userData));
    if (!newData.history) newData.history = {};
    let currentDayData = newData.history[todayKey];
    if (typeof currentDayData === 'number') currentDayData = { [currentNaam]: currentDayData };
    else if (!currentDayData) currentDayData = {};
    
    const currentVal = currentDayData[currentNaam] || 0;
    const newVal = currentVal + amount;
    if (newVal < 0) return;

    currentDayData[currentNaam] = newVal;
    newData.history[todayKey] = currentDayData;

    // --- SELF-HEALING STREAK LOGIC ---
    // Even if lastActiveDate is today, we check if streak is broken (0)
    if (amount > 0) {
        if (newData.lastActiveDate === todayKey) {
            // Already active today. 
            // BUT: If streak is 0 (due to bug), fix it to at least 1, or 2 if yesterday exists.
            if (!newData.streak || newData.streak === 0) {
                const yesterdayEntry = newData.history[yesterdayKey];
                let activeYesterday = false;
                if (typeof yesterdayEntry === 'number') activeYesterday = yesterdayEntry > 0;
                else if (yesterdayEntry && typeof yesterdayEntry === 'object') activeYesterday = Object.values(yesterdayEntry).reduce((a,b)=>a+b,0) > 0;
                
                if (activeYesterday) newData.streak = 2; // Recover consecutive
                else newData.streak = 1; // Start fresh
            }
        } else if (newData.lastActiveDate === yesterdayKey) {
            // Consecutive day normal increment
            newData.streak = (newData.streak || 0) + 1;
        } else {
            // Missed a day or first time
            newData.streak = 1;
        }
        newData.maxStreak = Math.max(newData.streak, newData.maxStreak || 0);
    }
    newData.lastActiveDate = todayKey;

    setUserData(newData); 

    const userRef = doc(db, "users", user.uid);
    try {
      await updateDoc(userRef, {
        [`history.${todayKey}`]: newData.history[todayKey],
        streak: newData.streak,
        maxStreak: newData.maxStreak,
        lastActiveDate: todayKey
      });
    } catch (e) {
      console.log("Saving locally...");
    }
  };

  const changeNaam = async (naam) => {
    if(!userData) return;
    const updated = { ...userData, currentNaam: naam };
    setUserData(updated);
    await updateDoc(doc(db, "users", user.uid), { currentNaam: naam });
  };

  const setGoal = async (goal) => {
    if (!goal || !userData) return;
    const updated = { ...userData, dailyGoal: goal };
    setUserData(updated);
    await updateDoc(doc(db, "users", user.uid), { dailyGoal: goal });
  };

  const addNaam = async (naam) => {
    if(!userData) return;
    const updatedNaams = [...(userData.naams || defaultNaams), naam];
    const updated = { ...userData, naams: updatedNaams };
    setUserData(updated);
    await updateDoc(doc(db, "users", user.uid), { naams: updatedNaams });
  };

  if (loading) return <div className="h-screen bg-[var(--bg-primary)] flex items-center justify-center text-[var(--accent)] animate-pulse">Connecting...</div>;

  if (!user) return <Login />;

  return (
    <Router>
      <div className="text-[var(--text-primary)] font-sans min-h-screen">
        <Routes>
          <Route path="/" element={<HomePage user={user} userData={userData} updateCount={updateCount} changeNaam={changeNaam} naams={userData?.naams || defaultNaams} setGoal={setGoal} manualAdd={updateCount} />} />
          <Route path="/stats" element={<StatsPage userData={userData} />} />
          <Route path="/profile" element={<ProfilePage user={user} userData={userData} addNaam={addNaam} toggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} isDark={theme === 'dark'} />} />
        </Routes>
        <Navbar />
      </div>
    </Router>
  );
}