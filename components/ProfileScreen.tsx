
import React, { useState, useRef } from 'react';
import { 
  ArrowLeft,
  Camera, 
  User, 
  Check, 
  Moon, 
  Globe, 
  Ruler, 
  Map as MapIcon,
  Share2,
  ExternalLink,
  Volume2,
  Clock,
  Plus,
  Trash2,
  Tally4,
  Settings2
} from 'lucide-react';
import { Language, UnitSystem, AudioCuesSettings, PaceZone } from '../types';

interface ProfileScreenProps {
  onBack: () => void;
  userName: string;
  setUserName: (name: string) => void;
  profilePhoto: string | null;
  setProfilePhoto: (photo: string | null) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  customDistanceUnit: string;
  setCustomDistanceUnit: (u: string) => void;
  customAltitudeUnit: string;
  setCustomAltitudeUnit: (u: string) => void;
  audioCues: AudioCuesSettings;
  setAudioCues: (settings: AudioCuesSettings) => void;
  paceZones: PaceZone[];
  setPaceZones: (zones: PaceZone[]) => void;
  t: any; // Translation object
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  userName,
  setUserName,
  profilePhoto,
  setProfilePhoto,
  isDarkMode,
  setIsDarkMode,
  language,
  setLanguage,
  unitSystem,
  setUnitSystem,
  customDistanceUnit,
  setCustomDistanceUnit,
  customAltitudeUnit,
  setCustomAltitudeUnit,
  audioCues,
  setAudioCues,
  paceZones,
  setPaceZones,
  t
}) => {
  const [editNameValue, setEditNameValue] = useState(userName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const APP_SHARE_LINK = "https://drive.google.com/file/d/FIT_GO_APP_DOWNLOAD/view?usp=sharing";

  const saveProfile = () => {
    if (editNameValue.trim()) {
        setUserName(editNameValue);
        localStorage.setItem('userName', editNameValue);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfilePhoto(base64);
        localStorage.setItem('profilePhoto', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShareApp = async () => {
      const shareData = {
          title: 'Fit GO App',
          text: t.shareAppText || "Join me on Fit GO! Track your runs with GPS and get audio cues.",
          url: APP_SHARE_LINK
      };
      if (navigator.share && navigator.canShare(shareData)) {
          try {
              await navigator.share(shareData);
          } catch (err) {
              window.open(APP_SHARE_LINK, '_blank');
          }
      } else {
          window.open(APP_SHARE_LINK, '_blank');
      }
  };

  const toggleAudioCue = (key: keyof AudioCuesSettings) => {
      setAudioCues({ ...audioCues, [key]: !audioCues[key] });
  };

  const setFrequency = (freq: number) => {
      setAudioCues({ ...audioCues, alertFrequency: freq });
  };

  const clearMapCache = async () => {
    if ('caches' in window) {
        try {
            const keys = await caches.keys();
            for (const key of keys) {
                if (key.includes('gemini-run-map-cache')) {
                    await caches.delete(key);
                }
            }
            alert(t.cacheCleared);
        } catch (e) { console.error(e); }
    }
  };

  const addPaceZone = () => {
    const newZone: PaceZone = {
      id: Date.now().toString(),
      name: `Zone ${paceZones.length + 1}`,
      minPace: 300,
      maxPace: 360,
      color: '#3B82F6'
    };
    setPaceZones([...paceZones, newZone]);
  };

  const updateZone = (id: string, updates: Partial<PaceZone>) => {
    setPaceZones(paceZones.map(z => z.id === id ? { ...z, ...updates } : z));
  };

  const deleteZone = (id: string) => {
    setPaceZones(paceZones.filter(z => z.id !== id));
  };

  return (
    <div className="h-screen w-screen bg-white dark:bg-black flex flex-col transition-colors duration-300 overflow-hidden">
        <div className="p-6 pt-12 flex items-center bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 z-20 rounded-b-[64px] shadow-xl shadow-gray-200/50 dark:shadow-none pb-12 transition-all">
             <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                 <ArrowLeft size={24} className="text-gray-800 dark:text-white" />
             </button>
             <span className="mx-auto font-black text-lg text-gray-800 dark:text-white uppercase tracking-[0.2em]">{t.settings}</span>
             <div className="w-9"></div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-24 -mt-4 transition-all z-10">
            <div className="flex flex-col items-center">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-700 shadow-xl">
                        {profilePhoto ? (
                            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <User size={56} className="text-gray-300 dark:text-gray-600" />
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-2.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors border-2 border-white dark:border-gray-900"
                    >
                        <Camera size={18} />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
                </div>
                <p className="text-sm font-black text-gray-500 mt-4 uppercase tracking-widest opacity-60">{t.changePhoto}</p>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t.name}</label>
                    <div className="flex gap-3">
                        <input value={editNameValue} onChange={(e) => setEditNameValue(e.target.value)} className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-5 py-4 dark:text-white focus:ring-2 ring-blue-500 shadow-sm transition-all" placeholder={t.namePlaceholder} />
                        <button onClick={saveProfile} className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all"><Check size={20} /></button>
                    </div>
                </div>

                <div className="grid gap-4">
                    <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400"><Moon size={20} /></div>
                            <span className="font-bold dark:text-white">{t.darkMode}</span>
                        </div>
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-14 h-8 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
                            <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${isDarkMode ? 'translate-x-6' : ''}`}></div>
                        </button>
                    </div>

                    <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl text-yellow-600 dark:text-yellow-400"><Volume2 size={20} /></div>
                                <div className="flex flex-col">
                                    <span className="font-bold dark:text-white">{t.audioCues}</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t.audioCuesDesc}</span>
                                </div>
                            </div>
                            <button onClick={() => toggleAudioCue('enabled')} className={`w-14 h-8 rounded-full p-1 transition-colors ${audioCues.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${audioCues.enabled ? 'translate-x-6' : ''}`}></div>
                            </button>
                        </div>
                        {audioCues.enabled && (
                            <div className="grid gap-4 pl-14 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{t.paceAlerts}</span>
                                    <button onClick={() => toggleAudioCue('paceAlerts')} className={`w-10 h-6 rounded-full p-1 transition-colors ${audioCues.paceAlerts ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${audioCues.paceAlerts ? 'translate-x-4' : ''}`}></div>
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{t.milestoneAlerts}</span>
                                    <button onClick={() => toggleAudioCue('distanceMilestones')} className={`w-10 h-6 rounded-full p-1 transition-colors ${audioCues.distanceMilestones ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${audioCues.distanceMilestones ? 'translate-x-4' : ''}`}></div>
                                    </button>
                                </div>
                                {audioCues.paceAlerts && (
                                    <div className="pt-2 space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                                            <Clock size={12} />
                                            {t.alertFrequency}
                                        </div>
                                        <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1.5 rounded-xl">
                                            <button onClick={() => setFrequency(60)} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${audioCues.alertFrequency === 60 ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-500'}`}>{t.everyMinute}</button>
                                            <button onClick={() => setFrequency(120)} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${audioCues.alertFrequency === 120 ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-500'}`}>{t.everyTwoMinutes}</button>
                                            <button onClick={() => setFrequency(300)} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${audioCues.alertFrequency === 300 ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-500'}`}>{t.everyFiveMinutes}</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400"><Tally4 size={20} /></div>
                                <span className="font-bold dark:text-white">{t.paceZones}</span>
                            </div>
                            <button onClick={addPaceZone} className="p-2 bg-blue-600 text-white rounded-xl shadow-lg active:scale-95 transition-all"><Plus size={18} /></button>
                        </div>
                        <div className="space-y-3 pt-2">
                            {paceZones.map(zone => (
                                <div key={zone.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: zone.color }}></div>
                                        <input 
                                            value={zone.name} 
                                            onChange={e => updateZone(zone.id, { name: e.target.value })}
                                            className="flex-1 text-sm font-bold bg-transparent border-none focus:ring-0 dark:text-white"
                                            placeholder={t.zoneName}
                                        />
                                        <button onClick={() => deleteZone(zone.id)} className="text-red-500 p-1"><Trash2 size={16} /></button>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1 flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-gray-400 uppercase">{t.minPace}</span>
                                            <input 
                                                type="number" 
                                                value={zone.minPace} 
                                                onChange={e => updateZone(zone.id, { minPace: parseInt(e.target.value) })}
                                                className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-2 text-xs font-bold dark:text-white border-none"
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-gray-400 uppercase">{t.maxPace}</span>
                                            <input 
                                                type="number" 
                                                value={zone.maxPace} 
                                                onChange={e => updateZone(zone.id, { maxPace: parseInt(e.target.value) })}
                                                className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-2 text-xs font-bold dark:text-white border-none"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-gray-400 uppercase">{t.zoneColor}</span>
                                            <input 
                                                type="color" 
                                                value={zone.color} 
                                                onChange={e => updateZone(zone.id, { color: e.target.value })}
                                                className="w-10 h-8 p-0 border-none bg-transparent rounded cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400"><Globe size={20} /></div>
                            <span className="font-bold dark:text-white">{t.language}</span>
                        </div>
                        <div className="flex bg-gray-200 dark:bg-gray-700 rounded-xl p-1.5">
                            <button onClick={() => setLanguage('en')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${language === 'en' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-md' : 'text-gray-500'}`}>EN</button>
                            <button onClick={() => setLanguage('id')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${language === 'id' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-md' : 'text-gray-500'}`}>ID</button>
                        </div>
                    </div>

                    <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-xl text-pink-600 dark:text-pink-400"><Ruler size={20} /></div>
                                <span className="font-bold dark:text-white">{t.units}</span>
                            </div>
                            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-xl p-1.5">
                                <button onClick={() => setUnitSystem('metric')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${unitSystem === 'metric' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-md' : 'text-gray-500'}`}>{t.unitKm}</button>
                                <button onClick={() => setUnitSystem('imperial')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${unitSystem === 'imperial' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-md' : 'text-gray-500'}`}>{t.unitMi}</button>
                                <button onClick={() => setUnitSystem('custom')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${unitSystem === 'custom' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-md' : 'text-gray-500'}`}>{t.custom || 'Custom'}</button>
                            </div>
                        </div>
                        {unitSystem === 'custom' && (
                            <div className="grid grid-cols-2 gap-3 pl-14 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.distance}</label>
                                    <input value={customDistanceUnit} onChange={e => setCustomDistanceUnit(e.target.value)} className="w-full bg-white dark:bg-gray-900 p-2 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 dark:text-white" placeholder="e.g. steps" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.gain}</label>
                                    <input value={customAltitudeUnit} onChange={e => setCustomAltitudeUnit(e.target.value)} className="w-full bg-white dark:bg-gray-900 p-2 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 dark:text-white" placeholder="e.g. floors" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400"><MapIcon size={20} /></div>
                            <div className="flex flex-col">
                                <span className="font-bold dark:text-white">{t.offlineMaps}</span>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{t.cacheInfo}</span>
                            </div>
                        </div>
                        <button onClick={clearMapCache} className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl active:scale-95 transition-all">
                            <span className="text-xs font-black">{t.clearCache}</span>
                        </button>
                    </div>

                    <button onClick={handleShareApp} className="flex items-center justify-between p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 group active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30"><Share2 size={20} /></div>
                            <div className="flex flex-col items-start text-left">
                                <span className="font-bold text-blue-900 dark:text-blue-100">{t.shareApp}</span>
                                <span className="text-[10px] font-black text-blue-500/70 uppercase tracking-widest">{t.shareAppText}</span>
                            </div>
                        </div>
                        <ExternalLink size={18} className="text-blue-400" />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
