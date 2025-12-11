
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Wind, 
  CloudRain, 
  MapPin, 
  ChevronRight, 
  Sun, 
  Cloud, 
  Snowflake, 
  CloudLightning,
  Dumbbell, 
  Activity,
  Timer,
  Play,
  Pause
} from 'lucide-react';
import { RunSession, WeatherData, UnitSystem } from '../types';
import { formatTime, getDistanceDisplay } from '../utils';

declare const lottie: any;

interface DashboardProps {
  userName: string;
  weather: WeatherData | null;
  profilePhoto: string | null;
  onOpenProfile: () => void;
  runHistory: RunSession[];
  unitSystem: UnitSystem;
  t: any;
  onNavigateHistory: () => void;
  onHistorySelect: (session: RunSession) => void;
  onPrepareRun: () => void;
  setSelectedRunType: (type: string) => void;
  setSelectedPresetName: (name: string | null) => void;
  setTargetPace: (pace: number | null) => void;
  getTranslatedRunType: (type: string) => string;
  isRunning?: boolean;
  elapsedTime?: number;
  distance?: number;
  onResumeRun?: () => void;
  onRefresh?: () => Promise<void>;
}

const triggerHaptic = (pattern: number | number[] = 50) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

export const Dashboard: React.FC<DashboardProps> = ({
  userName,
  weather,
  profilePhoto,
  onOpenProfile,
  runHistory,
  unitSystem,
  t,
  onNavigateHistory,
  onHistorySelect,
  onPrepareRun,
  setSelectedRunType,
  setSelectedPresetName,
  setTargetPace,
  getTranslatedRunType,
  isRunning = false,
  elapsedTime = 0,
  distance = 0,
  onResumeRun,
  onRefresh
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lottieContainerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const lottieAnimRef = useRef<any>(null);
  const hasVibratedRef = useRef(false);
  const PULL_THRESHOLD = 150;

  const elephantLottieJson = {"v":"5.6.3","fr":60,"ip":0,"op":242,"w":200,"h":200,"nm":"animals 3","ddd":0,"assets":[],"layers":[{"ddd":0,"ind":3,"ty":4,"nm":"elefante Silhouettes","sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[97.458,99.439,0],"ix":2},"a":{"a":0,"k":[76.063,44.119,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,0],[1.526,-0.803],[0.264,-0.252],[-1.746,-1.499],[-1.359,-0.332],[-1.305,0.366],[-0.837,2.736],[4.319,13.442],[4.528,4.406],[7.126,-0.414],[2.488,-0.779],[2.571,-3.431],[-3.287,-4.413],[-1.982,-0.652],[-1.971,0.309],[0,-4.546],[0,0],[0,0],[-0.146,1.308],[1.413,1.295],[3.763,-0.122],[1.607,-3.211],[3.615,-7.23],[8.08,5.025],[2.515,-0.387],[0.465,-6.12],[-1.296,-2.318],[-1.209,-1.439],[-1.814,-0.949],[4.06,3.795],[2.354,-0.354],[3.395,-4.434],[-0.104,-1.66],[-9.756,20.233],[-4.64,0.459],[-6.221,-2.953],[-1.123,-1.919],[0.273,-1.633],[0.834,-1.819],[-1.049,-3.221],[-10.219,2.115],[-4.084,1.792],[-2.742,3.081]],"o":[[-1.302,-1.215],[-0.332,0.175],[-1.664,1.59],[0.782,0.671],[1.306,0.319],[2.755,-0.773],[1.736,-5.673],[-3.133,-9.747],[-5.116,-4.977],[-2.196,0.127],[-9.305,2.915],[-3.618,4.826],[1.63,2.187],[1.895,0.623],[4.155,-0.651],[0,5.422],[0,0],[2.219,-1.306],[0.261,-2.35],[-1.566,-1.436],[-3.406,0.111],[-3.614,7.23],[2.532,-11.202],[-5.975,-3.715],[-10.941,1.704],[-0.094,1.244],[0.629,1.216],[2.36,2.806],[3.482,-5.601],[-4.238,-3.96],[-1.849,0.278],[-4.36,5.696],[-1.429,-3.261],[11.884,-24.648],[14.164,-1.4],[2.01,0.954],[0.874,1.493],[-0.354,2.119],[-0.939,2.052],[1.991,6.115],[3.787,-0.783],[7.386,-3.243],[0,0]],"v":[[46.24,23.742],[41.495,23.064],[40.6,23.71],[41.003,29.527],[44.206,31.197],[48.179,31.105],[53.852,25.322],[53.694,-5.4],[40.584,-26.441],[21.448,-33.8],[14.385,-32.509],[-1.202,-20.987],[-1.88,-5.4],[3.859,-1.359],[10.919,-0.87],[27.941,2.156],[13.031,24.421],[25.007,19.852],[28.01,16.195],[25.659,11.363],[18.452,9.51],[10.32,14.932],[-0.523,36.62],[-10.012,9.51],[-24.922,6.799],[-43.898,20.354],[-42.542,25.775],[-39.831,29.842],[-33.055,35.264],[-34.41,18.999],[-45.253,16.288],[-54.742,23.064],[-58.807,36.62],[-58.807,-6.756],[-14.079,-35.22],[17.723,-29.479],[23.902,-25.55],[24.687,-20.849],[22.699,-15.366],[21.814,-6.097],[41.793,2.521],[53.546,-1.265],[68.563,-12.235]],"c":false},"ix":2},"nm":"TracÃ© 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"st","c":{"a":0,"k":[0,0.442999985639,0.736999990426,1],"ix":3},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":3,"ix":5},"lc":2,"lj":2,"bm":0,"nm":"Contour 1","mn":"ADBE Vector Graphic - Stroke","hd":false},{"ty":"tr","p":{"a":0,"k":[76.063,44.12],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transformer "}],"nm":"Groupe 1","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false},{"ty":"tm","s":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":174,"s":[0]},{"t":245,"s":[100]}],"ix":1},"e":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":6,"s":[0]},{"t":94,"s":[100]}],"ix":2},"o":{"a":0,"k":0,"ix":3},"m":1,"ix":2,"nm":"RÃ©duire les tracÃ©s 2","mn":"ADBE Vector Filter - Trim","hd":false}],"ip":0,"op":244,"st":0,"bm":0}],"markers":[]};

  const resetAnimation = useCallback(() => {
    if (lottieAnimRef.current) {
        lottieAnimRef.current.stop();
        lottieAnimRef.current.goToAndStop(0, true);
    }
  }, []);

  useEffect(() => {
    if (lottieContainerRef.current && !lottieAnimRef.current && typeof lottie !== 'undefined') {
        lottieAnimRef.current = lottie.loadAnimation({
            container: lottieContainerRef.current,
            renderer: 'svg',
            loop: true,
            autoplay: false,
            animationData: elephantLottieJson
        });
        resetAnimation();
    }
  }, [resetAnimation]);

  const getWeatherIcon = (code: number, size: number) => {
    if (code === 0 || code === 1) return <Sun size={size} className="text-yellow-500" />;
    if (code === 2 || code === 3) return <Cloud size={size} className="text-gray-400" />;
    if (code >= 45 && code <= 48) return <Wind size={size} className="text-gray-400" />;
    if (code >= 51 && code <= 67) return <CloudRain size={size} className="text-blue-400" />;
    if (code >= 71 && code <= 77) return <Snowflake size={size} className="text-blue-200" />;
    if (code >= 80 && code <= 82) return <CloudRain size={size} className="text-blue-500" />;
    if (code >= 85 && code <= 86) return <Snowflake size={size} className="text-blue-300" />;
    if (code >= 95) return <CloudLightning size={size} className="text-purple-500" />;
    return <Sun size={size} className="text-yellow-500" />;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop === 0 && !isRefreshing) {
        touchStartY.current = e.touches[0].clientY;
        hasVibratedRef.current = false;
        resetAnimation();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current > 0 && !isRefreshing) {
        const currentY = e.touches[0].clientY;
        const diff = currentY - touchStartY.current;
        if (diff > 0) {
            const newDist = Math.min(diff * 0.45, 200);
            setPullDistance(newDist);
            
            if (lottieAnimRef.current) {
                const progress = Math.min(newDist / PULL_THRESHOLD, 1);
                const targetFrame = progress * 94; 
                lottieAnimRef.current.goToAndStop(targetFrame, true);
            }

            if (newDist > PULL_THRESHOLD && !hasVibratedRef.current) {
                triggerHaptic(20);
                hasVibratedRef.current = true;
            } else if (newDist < PULL_THRESHOLD) {
                hasVibratedRef.current = false;
            }
        }
    }
  };

  const handleTouchEnd = async () => {
    const finalDist = pullDistance;
    touchStartY.current = 0;

    if (finalDist > PULL_THRESHOLD && !isRefreshing && onRefresh) {
        setIsRefreshing(true);
        setPullDistance(130);
        
        if (lottieAnimRef.current) {
            // Segment 95-242 is the "spinning/active" state
            lottieAnimRef.current.playSegments([95, 242], true);
        }

        try {
          await onRefresh();
        } catch (err) {
          console.error("Refresh failed:", err);
        } finally {
            setTimeout(() => {
                setIsRefreshing(false);
                setPullDistance(0);
                resetAnimation();
            }, 1200);
        }
    } else {
        setPullDistance(0);
        if (!isRefreshing) resetAnimation();
    }
  };

  const hasActiveRun = elapsedTime > 0;

  return (
    <div className="h-screen w-screen bg-gray-50 dark:bg-black flex flex-col transition-colors duration-300 relative overflow-hidden">
       {/* REFRESH ANIMATION OVERLAY */}
       <div 
            className="absolute top-0 left-0 w-full flex justify-center pointer-events-none z-[100]"
            style={{ 
                height: '240px', 
                opacity: pullDistance > 5 ? 1 : 0,
                transform: `translateY(${Math.max(0, pullDistance - 100)}px)`,
                transition: isRefreshing ? 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
            }}
       >
           <div className="flex flex-col items-center justify-center">
                <div 
                  ref={lottieContainerRef} 
                  className="w-44 h-44 drop-shadow-2xl" 
                />
                <div className="mt-[-25px] bg-white/95 dark:bg-gray-900/95 px-5 py-2 rounded-full backdrop-blur-xl shadow-xl border border-gray-100 dark:border-gray-800 transition-all">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
                    {isRefreshing ? t.updating : (pullDistance > PULL_THRESHOLD ? t.releaseToRefresh : t.pullToRefresh)}
                  </span>
                </div>
           </div>
       </div>

       {/* MAIN CONTENT CONTAINER */}
       <div 
         ref={scrollContainerRef}
         className="flex-1 flex flex-col overflow-y-auto relative z-10 no-scrollbar"
         onTouchStart={handleTouchStart}
         onTouchMove={handleTouchMove}
         onTouchEnd={handleTouchEnd}
       >
           <div className="bg-white dark:bg-gray-900 rounded-b-[48px] px-6 pt-12 pb-10 shadow-lg shadow-gray-200/50 dark:shadow-none z-20 relative flex-shrink-0 border-b border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{t.hello}, <br /><span className="text-blue-600 dark:text-blue-400">{userName}</span></h2>
                  </div>
                  <div className="flex items-center gap-4">
                    {weather && (
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                                <span className="text-xl font-black tabular-nums">{Math.round(weather.temperature)}°</span>
                                {getWeatherIcon(weather.weathercode, 24)}
                            </div>
                        </div>
                    )}
                    <button onClick={onOpenProfile} className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center border-2 border-white dark:border-gray-700 shadow-md active:scale-90 transition-transform overflow-hidden">
                        {profilePhoto ? (
                            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={20} className="text-gray-500 dark:text-gray-400" />
                        )}
                    </button>
                  </div>
              </div>
              
              {weather?.hourly && (
                  <div className="flex justify-between mt-8 px-1 overflow-x-auto no-scrollbar gap-5">
                      {weather.hourly.temperature_2m.map((temp, i) => (
                          <div key={i} className="flex flex-col items-center gap-2 min-w-[32px]">
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{new Date(Date.now() + i * 3600000).getHours()}:00</span>
                              {getWeatherIcon(weather.hourly!.weathercode[i], 18)}
                              <span className="text-xs font-black text-gray-700 dark:text-gray-200 tabular-nums">{Math.round(temp)}°</span>
                          </div>
                      ))}
                  </div>
              )}
           </div>

           <div className="p-6 space-y-8 flex-1 flex flex-col">
              <div>
                 {hasActiveRun && onResumeRun ? (
                     <div className="w-full">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2 uppercase text-xs tracking-widest">
                                <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
                                {isRunning ? t.activeRun : t.pause}
                            </h3>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{t.appTitle}</span>
                         </div>
                         <div className={`bg-gradient-to-br transition-colors duration-500 ${isRunning ? 'from-blue-600 to-blue-800' : 'from-gray-700 to-gray-900'} rounded-[32px] p-6 shadow-2xl shadow-blue-500/20 text-white relative overflow-hidden group active:scale-[0.98]`}>
                             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
                             
                             <div className="relative z-10 flex justify-between items-center">
                                 <div className="space-y-4">
                                     <div>
                                         <div className="flex items-center gap-2 mb-1 opacity-70">
                                             <Timer size={12} className="text-blue-200" />
                                             <span className="text-[10px] font-black uppercase tracking-widest">{t.duration}</span>
                                         </div>
                                         <p className="text-4xl font-black tabular-nums tracking-tighter">{formatTime(elapsedTime || 0)}</p>
                                     </div>
                                     
                                     <div>
                                         <div className="flex items-center gap-2 mb-1 opacity-70">
                                             <MapPin size={12} className="text-blue-200" />
                                             <span className="text-[10px] font-black uppercase tracking-widest">{t.distance}</span>
                                         </div>
                                         <p className="text-2xl font-black tabular-nums">
                                             {getDistanceDisplay(distance || 0, unitSystem).value} 
                                             <span className="text-xs font-bold ml-1.5 opacity-60 uppercase">{getDistanceDisplay(distance || 0, unitSystem).unit}</span>
                                         </p>
                                     </div>
                                 </div>
                                 <button 
                                    onClick={onResumeRun}
                                    className="w-16 h-16 bg-white text-blue-700 rounded-[24px] flex items-center justify-center shadow-xl active:scale-90 transition-transform"
                                 >
                                     {isRunning ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
                                 </button>
                             </div>
                         </div>
                     </div>
                 ) : (
                     <>
                        <h3 className="font-black text-gray-900 dark:text-white mb-5 uppercase text-xs tracking-widest">{t.chooseActivity}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => { setSelectedRunType('Run'); setSelectedPresetName(null); setTargetPace(null); onPrepareRun(); }} className="bg-white dark:bg-gray-800 p-6 rounded-[28px] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-4 active:scale-95 transition-all group border-b-4 hover:border-blue-500">
                                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                                    <MapPin className="text-blue-600 dark:text-blue-400" size={24} />
                                </div>
                                <span className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wide">{t.outdoorRun}</span>
                            </button>
                            <button className="bg-white dark:bg-gray-800 p-6 rounded-[28px] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-4 opacity-60 cursor-not-allowed relative overflow-hidden group">
                                <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center">
                                    <Dumbbell className="text-orange-500" size={24} />
                                </div>
                                <span className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wide">{t.training}</span>
                                <div className="absolute top-2 right-2 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                    <span className="text-[8px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-tighter">{t.comingSoon}</span>
                                </div>
                            </button>
                        </div>
                     </>
                 )}
              </div>

              <div className="flex-1 flex flex-col pt-4">
                 <div className="flex justify-between items-end mb-5 px-1">
                     <h3 className="font-black text-gray-900 dark:text-white uppercase text-xs tracking-widest">{t.recentActivity}</h3>
                     <button onClick={onNavigateHistory} className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest hover:underline">{t.seeAll}</button>
                 </div>
                 
                 <div className="bg-white dark:bg-gray-900 rounded-[32px] p-2 shadow-sm border border-gray-100 dark:border-gray-800 flex-1 min-h-[120px]">
                    {runHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-center space-y-2">
                            <p className="text-gray-400 dark:text-gray-600 text-[10px] font-black uppercase tracking-widest">{t.noRuns}</p>
                            <p className="text-[9px] text-gray-500 dark:text-gray-500 font-bold uppercase tracking-tight">{t.startPrompt}</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                        {runHistory.slice(0, 3).map(session => {
                            const displayDistance = getDistanceDisplay(session.distance, unitSystem);
                            const date = new Date(session.startTime);
                            return (
                                <div 
                                    key={session.id} 
                                    onClick={() => onHistorySelect(session)}
                                    className="p-4 rounded-[24px] hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex flex-col items-center justify-center">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter leading-none">{date.toLocaleString(undefined, { month: 'short' })}</span>
                                            <span className="text-lg font-black text-gray-900 dark:text-white leading-none mt-0.5">{date.getDate()}</span>
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tight">{getTranslatedRunType(session.type)}</p>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-1 uppercase">
                                                <span>{displayDistance.value} {displayDistance.unit}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700"></span>
                                                <span>{formatTime(session.duration)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-gray-50 dark:bg-gray-900/40 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                                        <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                                    </div>
                                </div>
                            );
                        })}
                        </div>
                    )}
                 </div>
              </div>
           </div>
       </div>
    </div>
  );
};
