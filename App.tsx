
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Activity, 
  Flame, 
  User,
  Locate,
  Plus,
  Minus,
  Eye,
  Sun,
  Timer,
  Zap,
  Square,
  Pause,
  Play,
  Share2,
  Trash2,
  Calendar,
  ChevronRight,
  Gauge,
  Mountain,
  Radar,
  Signal,
  SignalLow,
  SignalMedium,
  SignalHigh,
  Footprints,
  Tally4,
  ShieldCheck,
  Settings,
  AlertCircle
} from 'lucide-react';
import { StatCard } from './components/StatCard';
import { RunMap } from './components/RunMap';
import { ProfileScreen } from './components/ProfileScreen';
import { Dashboard } from './components/Dashboard';
import { HistoryScreen } from './components/HistoryScreen';
import { Screen, RunSession, GeoPoint, RunType, Language, WorkoutPreset, WeatherData, UnitSystem, ActiveSession, AudioCuesSettings, PaceZone } from './types';
import { en } from './locale/en';
import { id } from './locale/id';
import { 
  formatTime, 
  formatPaceString, 
  getDistanceDisplay, 
  getPaceDisplay, 
  getAltitudeDisplay, 
  getSpeedDisplay 
} from './utils';
import { getCoachInsight } from './services/geminiService';

declare const html2canvas: any;

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const triggerHaptic = (pattern: number | number[] = 50) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

const speak = (text: string) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }
};

const translations = { en, id };

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved === null ? window.matchMedia('(prefers-color-scheme: dark)').matches : saved === 'true';
  });
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || "Runner");
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'en');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(() => (localStorage.getItem('unitSystem') as UnitSystem) || 'metric');
  const [customDistanceUnit, setCustomDistanceUnit] = useState(() => localStorage.getItem('customDistanceUnit') || 'km');
  const [customAltitudeUnit, setCustomAltitudeUnit] = useState(() => localStorage.getItem('customAltitudeUnit') || 'm');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => localStorage.getItem('profilePhoto'));
  
  const [coachInsight, setCoachInsight] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const [audioCues, setAudioCues] = useState<AudioCuesSettings>(() => {
      try {
          const saved = localStorage.getItem('audioCues');
          return saved ? JSON.parse(saved) : { enabled: true, paceAlerts: true, distanceMilestones: true, alertFrequency: 60 };
      } catch (e) { return { enabled: true, paceAlerts: true, distanceMilestones: true, alertFrequency: 60 }; }
  });

  const [paceZones, setPaceZones] = useState<PaceZone[]>(() => {
    try {
        const saved = localStorage.getItem('paceZones');
        return saved ? JSON.parse(saved) : [
          { id: '1', name: 'Warmup', minPace: 400, maxPace: 500, color: '#10B981' },
          { id: '2', name: 'Tempo', minPace: 300, maxPace: 360, color: '#3B82F6' },
          { id: '3', name: 'Race', minPace: 240, maxPace: 280, color: '#EF4444' }
        ];
    } catch (e) { return []; }
  });

  const [runHistory, setRunHistory] = useState<RunSession[]>(() => {
    try {
        const saved = localStorage.getItem('runHistory');
        return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const t = translations[language];

  const [selectedRunType, setSelectedRunType] = useState<string>('Run');
  const [targetPace, setTargetPace] = useState<number | null>(null);
  const [selectedPresetName, setSelectedPresetName] = useState<string | null>(null);
  const [isZenMode, setIsZenMode] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [currentPace, setCurrentPace] = useState(0);
  const [currentAltitude, setCurrentAltitude] = useState<number | null>(null);
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);
  const [path, setPath] = useState<GeoPoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [lastSession, setLastSession] = useState<RunSession | null>(null);
  const [selectedHistorySession, setSelectedHistorySession] = useState<RunSession | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const timerRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastLocationTimeRef = useRef<number>(Date.now());
  const lastPaceSpeechTimeRef = useRef<number>(0);
  const lastDistanceSpeechKmRef = useRef<number>(0);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('isDarkMode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => { localStorage.setItem('unitSystem', unitSystem); }, [unitSystem]);
  useEffect(() => { localStorage.setItem('language', language); }, [language]);
  useEffect(() => { localStorage.setItem('audioCues', JSON.stringify(audioCues)); }, [audioCues]);
  useEffect(() => { localStorage.setItem('userName', userName); }, [userName]);
  useEffect(() => { localStorage.setItem('paceZones', JSON.stringify(paceZones)); }, [paceZones]);
  useEffect(() => { localStorage.setItem('customDistanceUnit', customDistanceUnit); }, [customDistanceUnit]);
  useEffect(() => { localStorage.setItem('customAltitudeUnit', customAltitudeUnit); }, [customAltitudeUnit]);
  useEffect(() => { localStorage.setItem('runHistory', JSON.stringify(runHistory)); }, [runHistory]);

  const checkPermissions = useCallback(async (silent = true) => {
    try {
      const nav = navigator as any;
      if (nav.permissions && nav.permissions.query) {
        const status = await nav.permissions.query({ name: 'geolocation' });
        if (status.state === 'granted') {
          setHasPermissions(true);
          return true;
        } else if (status.state === 'denied' && !silent) {
          setPermissionError(t.permissionDenied);
          setHasPermissions(false);
          return false;
        }
      }
      
      // Secondary check: try to get a quick position
      return new Promise<boolean>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => { setHasPermissions(true); resolve(true); },
          (err) => { 
            if (!silent) setPermissionError(err.message);
            setHasPermissions(false); 
            resolve(false); 
          },
          { timeout: 3000 }
        );
      });
    } catch (err) {
      setHasPermissions(null);
      return false;
    }
  }, [t.permissionDenied]);

  useEffect(() => {
    checkPermissions(true);
  }, [checkPermissions]);

  const requestPermissions = useCallback(async () => {
    triggerHaptic(50);
    setPermissionError(null);
    navigator.geolocation.getCurrentPosition(
      () => { 
        setHasPermissions(true); 
        triggerHaptic(100); 
        setPermissionError(null);
      },
      (err) => { 
        setHasPermissions(false);
        setPermissionError(err.code === 1 ? t.permissionDenied : `${t.searching} (${err.message})`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [t.permissionDenied, t.searching]);

  useEffect(() => {
    const savedActive = localStorage.getItem('activeSession');
    if (savedActive) {
        try {
            const active: ActiveSession = JSON.parse(savedActive);
            setElapsedTime(active.elapsedTime);
            setDistance(active.distance);
            setPath(active.path);
            setSelectedRunType(active.type);
            setSelectedPresetName(active.selectedPresetName);
            setTargetPace(active.targetPace);
        } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (elapsedTime > 0 || isRunning) {
        const active: ActiveSession = {
            type: selectedRunType,
            elapsedTime,
            distance,
            path,
            targetPace,
            selectedPresetName,
            isPaused: !isRunning
        };
        localStorage.setItem('activeSession', JSON.stringify(active));
    } else if (currentScreen !== 'run' && !isRunning && elapsedTime === 0) {
        localStorage.removeItem('activeSession');
    }
  }, [elapsedTime, distance, path, isRunning, selectedRunType, targetPace, selectedPresetName, currentScreen]);

  const refreshWeather = useCallback(async () => {
    if (currentLocation) {
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${currentLocation.latitude}&longitude=${currentLocation.longitude}&current_weather=true&hourly=temperature_2m,weathercode`);
            const data = await res.json();
             if (data.current_weather) {
               setWeather({ 
                   temperature: data.current_weather.temperature, 
                   weathercode: data.current_weather.weathercode,
                   hourly: {
                       temperature_2m: data.hourly.temperature_2m.slice(0, 6),
                       weathercode: data.hourly.weathercode.slice(0, 6)
                   }
               });
             }
        } catch (err) { console.error(err); }
    }
  }, [currentLocation]);

  useEffect(() => { if (currentLocation && !weather) refreshWeather(); }, [currentLocation, refreshWeather, weather]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
        if (Date.now() - lastLocationTimeRef.current > 3500) setCurrentPace(0);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning]);

  useEffect(() => {
      if (isRunning && audioCues.enabled) {
          const freq = audioCues.alertFrequency || 60;
          if (audioCues.paceAlerts && targetPace && elapsedTime > 0 && elapsedTime % freq === 0) {
              if (lastPaceSpeechTimeRef.current !== elapsedTime) {
                  lastPaceSpeechTimeRef.current = elapsedTime;
                  if (currentPace > 0) {
                      const diff = currentPace - targetPace;
                      const tolerance = 15; 
                      if (diff < -tolerance) speak(t.slowDown);
                      else if (diff > tolerance) speak(t.speedUp);
                      else speak(t.onTarget);
                  }
              }
          }
          if (audioCues.distanceMilestones && distance >= lastDistanceSpeechKmRef.current + 1) {
              const currentKm = Math.floor(distance);
              if (currentKm > lastDistanceSpeechKmRef.current) {
                  lastDistanceSpeechKmRef.current = currentKm;
                  const distDisplay = getDistanceDisplay(currentKm, unitSystem, customDistanceUnit);
                  speak(`${distDisplay.value} ${distDisplay.unit} ${t.completed}`);
              }
          }
      }
  }, [elapsedTime, isRunning, targetPace, currentPace, distance, audioCues, t, unitSystem, customDistanceUnit]);

  useEffect(() => {
      if (currentScreen !== 'login' && currentScreen !== 'dashboard') {
          window.history.pushState({ screen: currentScreen }, '');
      }
      const handlePopState = () => handleBack();
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, [currentScreen]);

  useEffect(() => {
    let isMounted = true;
    if (currentScreen === 'summary') {
      const session = selectedHistorySession || lastSession;
      if (session && !coachInsight && !isGeneratingInsight) {
        setIsGeneratingInsight(true);
        getCoachInsight(session, language).then(insight => {
          if (isMounted) {
            setCoachInsight(insight || null);
            setIsGeneratingInsight(false);
          }
        }).catch(err => {
          console.error(err);
          if (isMounted) setIsGeneratingInsight(false);
        });
      }
    } else {
      setCoachInsight(null);
      setIsGeneratingInsight(false);
    }
    return () => { isMounted = false; };
  }, [currentScreen, selectedHistorySession, lastSession, language]);

  const currentZone = useMemo(() => {
    if (currentPace <= 0) return null;
    return paceZones.find(z => currentPace >= z.minPace && currentPace <= z.maxPace) || null;
  }, [currentPace, paceZones]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        lastLocationTimeRef.current = Date.now();
        const currentPaceVal = position.coords.speed && position.coords.speed > 0.1 ? 1000 / position.coords.speed : 0;
        const activeZone = paceZones.find(z => currentPaceVal >= z.minPace && currentPaceVal <= z.maxPace);
        
        const newPoint: GeoPoint = { 
          latitude: position.coords.latitude, 
          longitude: position.coords.longitude, 
          altitude: position.coords.altitude, 
          timestamp: position.timestamp,
          paceZoneId: activeZone?.id
        };
        
        setCurrentLocation(newPoint);
        setCurrentAltitude(position.coords.altitude);
        setCurrentAccuracy(position.coords.accuracy);
        
        if (position.coords.speed !== null && position.coords.speed >= 0) {
            setCurrentPace(currentPaceVal);
        }

        if (isRunning) {
          setPath(prevPath => {
            const lastPoint = prevPath[prevPath.length - 1];
            if (lastPoint) {
              const dist = calculateDistance(lastPoint.latitude, lastPoint.longitude, newPoint.latitude, newPoint.longitude);
              if (dist > 0.002 && dist < 0.1) {
                setDistance(d => d + dist);
                return [...prevPath, newPoint];
              }
              return prevPath;
            }
            return [newPoint];
          });
        }
      },
      (error) => console.error(error),
      { enableHighAccuracy: true }
    );
  }, [isRunning, paceZones]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => { startTracking(); return () => stopTracking(); }, [startTracking, stopTracking]);

  const handleBack = () => {
    setCurrentScreen(prevScreen => {
        if (prevScreen === 'summary' && (selectedHistorySession || lastSession)) {
            setSelectedHistorySession(null);
            setLastSession(null);
            return 'history';
        }
        if (prevScreen === 'run' || prevScreen === 'summary' || prevScreen === 'history' || prevScreen === 'profile') return 'dashboard';
        return 'login';
    });
  };

  const handleFinishRun = () => {
    triggerHaptic([50, 50, 200]); 
    setIsRunning(false);
    const avgPaceVal = distance > 0 ? elapsedTime / distance : 0;
    const session: RunSession = {
      id: Date.now().toString(),
      type: selectedPresetName || selectedRunType,
      startTime: Date.now() - (elapsedTime * 1000),
      duration: elapsedTime,
      distance: distance,
      path: path,
      calories: Math.floor(distance * 60),
      avgPace: formatPaceString(avgPaceVal)
    };
    setLastSession(session);
    setRunHistory(prev => {
        const updated = [session, ...prev];
        localStorage.setItem('runHistory', JSON.stringify(updated));
        return updated;
    });
    setCurrentScreen('summary');
    setElapsedTime(0); setDistance(0); setPath([]); 
    localStorage.removeItem('activeSession');
  };

  const handleDeleteSession = useCallback((sessionId: string) => {
      triggerHaptic(100);
      setRunHistory(prev => {
          const updated = prev.filter(s => String(s.id) !== String(sessionId));
          localStorage.setItem('runHistory', JSON.stringify(updated));
          return [...updated]; 
      });
  }, []);

  const handleExportData = () => {
      const data = { userName, profilePhoto, language, unitSystem, customDistanceUnit, customAltitudeUnit, runHistory, audioCues, paceZones, exportDate: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `fit-go-backup.json`; a.click(); URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const json = JSON.parse(e.target?.result as string);
              if (json.runHistory) {
                  setRunHistory(json.runHistory);
                  if (json.userName) setUserName(json.userName);
                  if (json.profilePhoto) setProfilePhoto(json.profilePhoto);
                  if (json.language) setLanguage(json.language);
                  if (json.unitSystem) setUnitSystem(json.unitSystem);
                  if (json.customDistanceUnit) setCustomDistanceUnit(json.customDistanceUnit);
                  if (json.customAltitudeUnit) setCustomAltitudeUnit(json.customAltitudeUnit);
                  if (json.audioCues) setAudioCues(json.audioCues);
                  if (json.paceZones) setPaceZones(json.paceZones);
              }
          } catch (err) { }
      };
      reader.readAsText(file);
  };

  const handleShare = async (sessionData: RunSession) => {
      if (!summaryRef.current || isSharing) return;
      setIsSharing(true);
      try {
          const canvas = await html2canvas(summaryRef.current, {
              useCORS: true, allowTaint: true, scale: 2,
              backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
              ignoreElements: (el: HTMLElement) => el.hasAttribute('data-html2canvas-ignore')
          });
          canvas.toBlob(async (blob: Blob | null) => {
              if (blob) {
                  const file = new File([blob], 'fit-go-run.png', { type: 'image/png' });
                  const shareData = { title: t.appTitle, text: `${t.runSummary}: ${getDistanceDisplay(sessionData.distance, unitSystem, customDistanceUnit).value} ${getDistanceDisplay(sessionData.distance, unitSystem, customDistanceUnit).unit} in ${formatTime(sessionData.duration)}!`, files: [file] };
                  if (navigator.share && navigator.canShare(shareData)) await navigator.share(shareData);
                  else {
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = 'fit-go-run.png'; a.click(); URL.revokeObjectURL(url);
                  }
              }
              setIsSharing(false);
          }, 'image/png');
      } catch (e) { console.error(e); setIsSharing(false); }
  };

  const getGPSInfo = (accuracy: number | null) => {
    if (!accuracy || accuracy > 100) return { color: 'text-red-500', bg: 'bg-red-500/10', icon: <Radar size={14} className="animate-pulse" />, pulse: 'animate-ping' };
    if (accuracy < 12) return { color: 'text-green-500', bg: 'bg-green-500/10', icon: <SignalHigh size={14} />, pulse: 'animate-none' };
    if (accuracy < 35) return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: <SignalMedium size={14} />, pulse: 'animate-pulse' };
    return { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: <SignalLow size={14} />, pulse: 'animate-pulse' };
  };

  const currentSPM = currentPace > 0 ? Math.round((60 / currentPace) * 1250) : 0;

  return (
    <div className={`font-sans antialiased selection:bg-blue-200 ${isDarkMode ? 'dark' : ''}`}>
      {currentScreen === 'login' && (
        <div className="h-screen w-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-between p-10 transition-colors">
            {!hasPermissions && (
              <div className="absolute inset-0 z-[1000] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in">
                 <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/40 rounded-[32px] flex items-center justify-center mb-8 text-blue-600 dark:text-blue-400 shadow-2xl shadow-blue-500/20">
                    <ShieldCheck size={48} />
                 </div>
                 <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase mb-4 tracking-tight leading-tight">{t.needPermission}</h2>
                 <p className="text-gray-500 dark:text-gray-400 font-medium mb-4 leading-relaxed max-w-xs text-sm">{t.permissionDesc}</p>
                 
                 {permissionError && (
                   <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl mb-6 text-xs font-bold w-full max-w-xs animate-bounce">
                      <AlertCircle size={14} />
                      {permissionError}
                   </div>
                 )}

                 <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button onClick={requestPermissions} className="w-full bg-blue-600 text-white font-black py-5 rounded-[24px] shadow-xl shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest text-sm">
                        {t.grantPermission}
                    </button>
                    <button onClick={() => setCurrentScreen('dashboard')} className="w-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 font-black py-4 rounded-[24px] active:scale-95 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                         {t.backHome}
                    </button>
                 </div>
              </div>
            )}
            
            <div className="flex-1 flex flex-col justify-center items-center">
                <div className="w-40 h-40 mb-10 drop-shadow-[0_25px_40px_rgba(59,130,246,0.4)] animate-[bounce_3s_infinite] transition-transform duration-700">
                    <img 
                        src="/barbel.png" 
                        alt="Fit Go Logo" 
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/3144/3144837.png"; }}
                        className="w-full h-full object-contain"
                    />
                </div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tighter uppercase">{t.appTitle}</h1>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{t.ready}</p>
            </div>
            <button onClick={() => setCurrentScreen('dashboard')} className="w-full bg-gray-900 dark:bg-blue-600 text-white font-black py-5 rounded-[24px] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all uppercase tracking-widest text-sm">
                <User size={20} /> {t.login}
            </button>
        </div>
      )}

      {currentScreen === 'dashboard' && (
        <Dashboard 
            userName={userName} weather={weather} profilePhoto={profilePhoto}
            onOpenProfile={() => setCurrentScreen('profile')} runHistory={runHistory}
            unitSystem={unitSystem} t={t} onNavigateHistory={() => setCurrentScreen('history')}
            onHistorySelect={(s) => { setSelectedHistorySession(s); setCurrentScreen('summary'); }}
            onPrepareRun={() => { setElapsedTime(0); setDistance(0); setPath([]); setCurrentScreen('run'); }}
            setSelectedRunType={setSelectedRunType} setSelectedPresetName={setSelectedPresetName}
            setTargetPace={setTargetPace} getTranslatedRunType={(type) => (t as any)[type.toLowerCase().replace(' ', '')] || type}
            isRunning={isRunning} elapsedTime={elapsedTime} distance={distance}
            onResumeRun={() => setCurrentScreen('run')} onRefresh={refreshWeather}
        />
      )}

      {currentScreen === 'run' && (
          <div className="h-screen w-screen relative bg-gray-200 dark:bg-gray-900 flex flex-col overflow-hidden">
          <RunMap currentLocation={currentLocation} path={path} isRunning={isRunning} isFollowingUser={isFollowingUser} isSheetExpanded={isSheetExpanded} isDarkMode={isDarkMode} isZenMode={isZenMode} onToggleFollow={() => setIsFollowingUser(!isFollowingUser)} onToggleZenMode={() => setIsZenMode(!isZenMode)} paceZones={paceZones} />
          
          <div className={`absolute top-12 left-1/2 -translate-x-1/2 z-[400] transition-all duration-500 ease-in-out ${!isZenMode ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5 bg-gray-900/90 dark:bg-gray-800/90 backdrop-blur-2xl px-5 py-2.5 rounded-[24px] shadow-2xl border border-white/10">
                    <div className="flex items-center gap-2 pr-3 border-r border-white/10">
                        <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                            <div className={`absolute inset-0 rounded-full scale-150 ${getGPSInfo(currentAccuracy).pulse} ${getGPSInfo(currentAccuracy).bg}`}></div>
                            <div className={`relative z-10 ${getGPSInfo(currentAccuracy).color}`}>{getGPSInfo(currentAccuracy).icon}</div>
                        </div>
                        <div className="flex flex-col -gap-1">
                            <span className="text-[14px] font-black text-white tabular-nums leading-none">{currentLocation ? Math.round(currentAccuracy || 0) : '--'}</span>
                            <span className="text-[8px] font-black uppercase text-gray-500 tracking-tighter leading-none">{t.accuracy}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pl-2">
                        <Gauge size={14} className="text-blue-400" />
                        <div className="flex flex-col -gap-1">
                            <span className="text-[14px] font-black text-white tabular-nums leading-none">
                                {getSpeedDisplay(currentPace, unitSystem).value}
                                <span className="text-[9px] font-bold text-blue-400 ml-0.5 uppercase tracking-tighter">{getSpeedDisplay(currentPace, unitSystem).unit}</span>
                            </span>
                            <span className="text-[8px] font-black uppercase text-gray-500 tracking-tighter leading-none">{t.pace}</span>
                        </div>
                    </div>
                </div>
                {currentZone && (
                  <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg animate-in fade-in slide-in-from-top-2" style={{ backgroundColor: currentZone.color }}>
                      {currentZone.name}
                  </div>
                )}
              </div>
          </div>

          <div className={`absolute top-0 left-0 w-full p-6 pt-12 flex flex-col gap-3 z-[400] transition-all duration-500 ${isZenMode ? 'opacity-0 -translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
              <div className="flex justify-between items-center w-full">
                <button onClick={handleBack} className="w-11 h-11 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-lg flex items-center justify-center active:scale-90 transition-transform border border-gray-100 dark:border-white/5">
                    <ArrowLeft size={22} className="text-gray-900 dark:text-white" />
                </button>
                <div className="bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-xl text-[10px] font-black uppercase text-white flex items-center gap-2 border border-white/10">
                    <Activity size={12} className="text-blue-400" />
                    {selectedPresetName || selectedRunType}
                </div>
              </div>
          </div>

          <div className={`absolute bottom-12 left-0 w-full px-6 z-[600] transition-all duration-500 ease-in-out ${isZenMode ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'}`}>
              <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-3xl rounded-[48px] p-8 border border-white/20 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.4)] flex justify-between items-center transition-colors">
                  <div className="flex flex-col items-center flex-1">
                      <span className="text-[10px] font-black text-blue-500 dark:text-blue-300 uppercase tracking-[0.2em] mb-3">{t.duration}</span>
                      <span className="text-5xl font-black tabular-nums tracking-tighter text-gray-900 dark:text-white leading-none whitespace-nowrap">{formatTime(elapsedTime)}</span>
                  </div>
                  <div className="w-[1.5px] h-12 bg-gray-100 dark:bg-white/10 mx-2"></div>
                  <div className="flex flex-col items-center flex-1">
                      <span className="text-[10px] font-black text-blue-500 dark:text-blue-300 uppercase tracking-[0.2em] mb-3">{t.distance}</span>
                      <div className="flex items-baseline text-blue-600 dark:text-blue-400 leading-none whitespace-nowrap">
                          <span className="text-5xl font-black tabular-nums tracking-tighter">
                              {getDistanceDisplay(distance, unitSystem, customDistanceUnit).value}
                          </span>
                          <span className="text-lg font-black ml-1.5 uppercase tracking-tight opacity-70">
                              {getDistanceDisplay(distance, unitSystem, customDistanceUnit).unit}
                          </span>
                      </div>
                  </div>
                  <div className="w-[1.5px] h-12 bg-gray-100 dark:bg-white/10 mx-2"></div>
                  <div className="flex flex-col items-center flex-1">
                      <span className="text-[10px] font-black text-blue-500 dark:text-blue-300 uppercase tracking-[0.2em] mb-3">{t.pace}</span>
                      <span className="text-5xl font-black tabular-nums text-gray-900 dark:text-white leading-none tracking-tighter whitespace-nowrap">
                          {getPaceDisplay(currentPace, unitSystem)}
                      </span>
                  </div>
              </div>
          </div>

          <div className={`mt-auto bg-white dark:bg-gray-900 rounded-t-[56px] shadow-2xl z-[500] px-10 transition-all duration-500 relative flex flex-col border-t border-gray-100 dark:border-gray-800 ${isZenMode ? 'h-0 opacity-0 pointer-events-none' : (isSheetExpanded ? 'h-auto pb-4 pt-1' : 'h-[24vh] pb-3 pt-1')}`}>
              <div className="w-full flex justify-center py-1.5 cursor-pointer" onClick={() => setIsSheetExpanded(!isSheetExpanded)}>
                  <div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
              </div>
              
              <div className="flex flex-col gap-1.5 pt-1.5 flex-1"> 
                  <div className="flex justify-between items-end mb-1">
                      <StatCard label={t.duration} value={formatTime(elapsedTime)} large />
                      <StatCard label={t.distance} value={getDistanceDisplay(distance, unitSystem, customDistanceUnit).value} unit={getDistanceDisplay(distance, unitSystem, customDistanceUnit).unit} large highlight />
                  </div>
                  
                  <div className={`grid grid-cols-2 gap-2 transition-all duration-500 overflow-hidden ${isSheetExpanded ? 'max-h-[500px] opacity-100 py-1' : 'max-h-0 opacity-0'}`}>
                      <StatCard label={t.cal} value={Math.floor(distance * 60)} />
                      <StatCard label={t.pace} value={getPaceDisplay(currentPace, unitSystem)} />
                      
                      <div className="bg-gray-50 dark:bg-gray-800/80 rounded-[28px] p-4 flex flex-col justify-center border border-transparent dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-0.5 opacity-60">
                              <Mountain size={12} className="text-purple-600" />
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.gain}</span>
                          </div>
                          <span className="text-xl font-black text-gray-900 dark:text-gray-100 tabular-nums">
                              {getAltitudeDisplay(currentAltitude, unitSystem, customAltitudeUnit).value}
                              <span className="text-[10px] font-bold text-gray-400 ml-1 uppercase">{getAltitudeDisplay(currentAltitude, unitSystem, customAltitudeUnit).unit}</span>
                          </span>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-800/80 rounded-[28px] p-4 flex flex-col justify-center border border-transparent dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-0.5 opacity-60">
                              <Footprints size={12} className="text-green-600" />
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.spm}</span>
                          </div>
                          <span className="text-xl font-black text-gray-900 dark:text-gray-100 tabular-nums">
                              {currentSPM}
                              <span className="text-[9px] font-bold text-gray-400 ml-1 uppercase tracking-tighter">{t.spmLabel}</span>
                          </span>
                      </div>
                  </div>

                  <div className="pb-3 mt-1">
                      {!isRunning && elapsedTime === 0 ? (
                          <button onClick={() => { triggerHaptic(200); setIsRunning(true); }} className="w-full bg-blue-600 text-white font-black py-4 rounded-[28px] shadow-xl text-lg flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest">{t.startRun}</button>
                      ) : (
                          <div className="flex gap-3">
                              <button onClick={() => { triggerHaptic(50); setIsRunning(!isRunning); }} className={`flex-1 font-black py-4 rounded-[28px] shadow-xl text-lg flex items-center justify-center gap-3 active:scale-95 uppercase tracking-widest transition-all ${isRunning ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'}`}>
                                  {isRunning ? <><Pause size={22} fill="currentColor" /> {t.pause}</> : <><Play size={22} fill="currentColor" /> {t.resume}</>}
                              </button>
                              {!isRunning && (
                                  <button onClick={handleFinishRun} className="bg-red-500 text-white font-black px-8 rounded-[28px] shadow-xl flex items-center justify-center active:scale-95 transition-all">
                                      <Square size={24} fill="currentColor" />
                                  </button>
                              )}
                          </div>
                      )}
                  </div>
              </div>
          </div>
        </div>
      )}

      {currentScreen === 'summary' && (
        <div className="h-screen w-screen bg-gray-50 dark:bg-black flex flex-col relative overflow-hidden" ref={summaryRef}>
            <div className="h-[45%] relative">
                <RunMap currentLocation={null} path={(selectedHistorySession || lastSession)!.path} isRunning={false} isFollowingUser={false} isSheetExpanded={false} isDarkMode={isDarkMode} isZenMode={false} readOnly={true} paceZones={paceZones} />
                <div className="absolute top-0 left-0 w-full p-6 pt-12 flex justify-between items-center z-[400]" data-html2canvas-ignore>
                     <button onClick={handleBack} className="p-3 bg-white/95 dark:bg-gray-800/95 rounded-2xl backdrop-blur-xl text-gray-900 dark:text-white active:scale-90 shadow-2xl border border-gray-100 dark:border-white/10"><ArrowLeft size={22} /></button>
                     <span className="font-black text-xs uppercase text-gray-900 dark:text-white tracking-[0.2em] drop-shadow-sm bg-white/90 dark:bg-black/80 px-5 py-2 rounded-2xl backdrop-blur-md border border-gray-200 dark:border-white/10">{selectedHistorySession ? t.runDetails : t.runSummary}</span>
                     <button onClick={() => handleShare((selectedHistorySession || lastSession)!)} disabled={isSharing} className="p-3 bg-white/95 dark:bg-gray-800/95 rounded-2xl backdrop-blur-xl text-gray-900 dark:text-white shadow-2xl border border-gray-100 dark:border-white/10">
                         {isSharing ? <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <Share2 size={22} />}
                     </button>
                </div>
            </div>
            <div className="flex-1 bg-white dark:bg-gray-900 -mt-12 rounded-t-[64px] shadow-2xl relative z-10 flex flex-col overflow-y-auto no-scrollbar pb-10 border-t border-gray-100 dark:border-gray-800">
                <div className="p-10 flex flex-col gap-10">
                     <div className="text-center pt-2">
                         <div className="inline-block px-5 py-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black mb-8 uppercase tracking-[0.2em]">{(selectedHistorySession || lastSession)!.type}</div>
                         <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.25em] mb-3 opacity-60">{t.totalDist}</p>
                         <div className="flex items-baseline justify-center gap-3">
                             <h1 className="text-8xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">{getDistanceDisplay((selectedHistorySession || lastSession)!.distance, unitSystem, customDistanceUnit).value}</h1>
                             <span className="text-3xl font-black text-gray-300 dark:text-gray-600 uppercase tracking-tighter">{getDistanceDisplay((selectedHistorySession || lastSession)!.distance, unitSystem, customDistanceUnit).unit}</span>
                         </div>
                         <p className="text-gray-500 font-black text-2xl mt-4 tabular-nums tracking-tight opacity-80">{formatTime((selectedHistorySession || lastSession)!.duration)}</p>
                     </div>
                     <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800/60 p-6 rounded-[32px] flex flex-col items-center border border-transparent dark:border-gray-700/50">
                            <Activity size={24} className="text-orange-500 mb-4" />
                            <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums leading-none">{getPaceDisplay((selectedHistorySession || lastSession)!.duration / ((selectedHistorySession || lastSession)!.distance || 1), unitSystem)}</p>
                            <p className="text-[9px] uppercase font-black text-gray-400 mt-2 tracking-widest opacity-60">{t.pace}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/60 p-6 rounded-[32px] flex flex-col items-center border border-transparent dark:border-gray-700/50">
                            <Flame size={24} className="text-red-500 mb-4" />
                            <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums leading-none">{(selectedHistorySession || lastSession)!.calories}</p>
                            <p className="text-[9px] uppercase font-black text-gray-400 mt-2 tracking-widest opacity-60">{t.calories}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/60 p-6 rounded-[32px] flex flex-col items-center border border-transparent dark:border-gray-700/50">
                            <Zap size={24} className="text-yellow-500 mb-4" />
                            <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums leading-none">{Math.floor((selectedHistorySession || lastSession)!.distance * 1250)}</p>
                            <p className="text-[9px] uppercase font-black text-gray-400 mt-2 tracking-widest opacity-60">{t.steps}</p>
                        </div>
                     </div>
                     
                     <div className="bg-blue-50 dark:bg-blue-900/10 rounded-[32px] p-8 border border-blue-100 dark:border-blue-800/50 -mt-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30">
                                <Zap size={20} fill="currentColor" />
                            </div>
                            <h3 className="font-black text-blue-900 dark:text-blue-100 uppercase text-xs tracking-[0.2em]">{t.aiCoach}</h3>
                        </div>
                        {isGeneratingInsight ? (
                            <div className="flex flex-col gap-3 animate-pulse">
                                <div className="h-4 bg-blue-200 dark:bg-blue-800/40 rounded-full w-3/4"></div>
                                <div className="h-4 bg-blue-200 dark:bg-blue-800/40 rounded-full w-full"></div>
                                <div className="h-4 bg-blue-200 dark:bg-blue-800/40 rounded-full w-1/2"></div>
                            </div>
                        ) : (
                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-bold italic opacity-90">
                                {coachInsight || t.generatingInsight}
                            </p>
                        )}
                     </div>

                     <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase justify-center opacity-40 tracking-widest">
                        <Calendar size={14} />
                        <span>{new Date((selectedHistorySession || lastSession)!.startTime).toLocaleString()}</span>
                     </div>
                     <button onClick={handleBack} className="w-full bg-gray-900 dark:bg-gray-800 text-white font-black py-6 rounded-[32px] mt-6 shadow-2xl active:scale-95 transition-all uppercase tracking-[0.2em] text-sm" data-html2canvas-ignore>{t.backHome}</button>
                </div>
            </div>
        </div>
      )}

      {currentScreen === 'history' && (
          <HistoryScreen onBack={handleBack} runHistory={runHistory} unitSystem={unitSystem} t={t} onHistorySelect={(s) => { setSelectedHistorySession(s); setCurrentScreen('summary'); }} onDeleteSession={handleDeleteSession} onExportData={handleExportData} onImportData={handleImportData} getTranslatedRunType={(type) => (t as any)[type.toLowerCase().replace(' ', '')] || type} />
      )}

      {currentScreen === 'profile' && (
         <ProfileScreen onBack={handleBack} userName={userName} setUserName={setUserName} profilePhoto={profilePhoto} setProfilePhoto={setProfilePhoto} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} language={language} setLanguage={setLanguage} unitSystem={unitSystem} setUnitSystem={setUnitSystem} customDistanceUnit={customDistanceUnit} setCustomDistanceUnit={setCustomDistanceUnit} customAltitudeUnit={customAltitudeUnit} setCustomAltitudeUnit={setCustomAltitudeUnit} audioCues={audioCues} setAudioCues={setAudioCues} paceZones={paceZones} setPaceZones={setPaceZones} t={t} />
       )}
    </div>
  );
};

export default App;
