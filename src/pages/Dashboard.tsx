import React, { useState, useEffect } from 'react';
import { Presentation, Users, FileQuestion, Users2, Download, BarChart3, Activity, CheckCircle2, ChevronDown, Calendar, FileText, Clock, History } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';

export function Dashboard() {
  const { data: events } = useFirestore('events');
  const { data: clients } = useFirestore('clients');
  const { data: participants } = useFirestore('participants');

  const { data: activityLogs, addData: addActivity } = useFirestore('activity_logs');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');

  // Daily Backup Logic
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastBackup = localStorage.getItem('last_backup_date');
    
    // Only trigger if not backed up today, and data has loaded
    if (lastBackup !== today && events.length > 0 && participants.length > 0) {
      const backupData = {
        events,
        clients,
        participants,
        timestamp: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-psikotes-${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      localStorage.setItem('last_backup_date', today);
    }
  }, [events, clients, participants]);

  // Filter hanya event aktif (bukan di tempat sampah / isDeleted)
  const activeEvents = events.filter((e: any) => !e.isDeleted);
  const activeEventIds = new Set(activeEvents.map((e: any) => e.id));
  const activeParticipants = participants.filter((p: any) => !p.isDeleted && p.eventId && activeEventIds.has(p.eventId));

  // General Stats Calculations
  const stats = [
    { label: 'Total Event', value: activeEvents.length.toString(), icon: Presentation },
    { label: 'Total Member', value: activeParticipants.length.toString(), icon: Users },
    { label: 'Total Soal', value: '304', icon: FileQuestion },
    { label: 'Total Client', value: clients.length.toString(), icon: Users2 },
  ];

  // Weekly Stats Calculations
  const activeParticipantsCount = activeParticipants.filter((p: any) => p.status === 'Account Active' || p.status === 'Active' || p.status === 'Sedang Mengerjakan').length;
  const pendingReportsCount = activeParticipants.filter((p: any) => p.completedTests && Object.keys(p.completedTests).length > 0 && !p.reportDownloaded).length;
  
  const upcomingEventsCount = activeEvents.filter((e: any) => {
    if (!e.date) return false;
    const eventDate = new Date(e.date);
    const now = new Date();
    // Compare if event is today or in the future
    eventDate.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    return eventDate >= now;
  }).length;

  // Specific Event Stats Calculations
  const filteredParticipants = selectedEventId === 'all' 
    ? activeParticipants 
    : activeParticipants.filter((p: any) => p.eventId === selectedEventId);
    
  const totalEventParticipants = filteredParticipants.length;
  
  const completedCount = filteredParticipants.filter((p: any) => p.completedTests && Object.keys(p.completedTests).length > 0).length;
  const completionPercentage = totalEventParticipants > 0 ? Math.round((completedCount / totalEventParticipants) * 100) : 0;
  
  const selectedEvent = activeEvents.find((e: any) => e.id === selectedEventId);
  const subtests = selectedEvent ? (selectedEvent.kategoriSoal || []) : [];

  const handleManualBackup = async () => {
    const today = new Date().toISOString().split('T')[0];
    const backupData = { events, clients, participants, timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-manual-psikotes-${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    try {
      await addActivity({ type: 'admin', message: 'Admin melakukan backup data secara manual', timestamp: new Date().toISOString() });
    } catch(e) {}
  };

  return (
    <div className="space-y-8">
      {/* Top Banner and General Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Welcome Banner */}
        <div className="lg:col-span-2 bg-[#8BC34A] rounded-xl p-6 text-white relative overflow-hidden flex flex-col justify-center min-h-[200px] shadow-sm">
           <div className="relative z-10">
              <p className="text-white/90 text-sm font-medium mb-1">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <h2 className="text-4xl font-bold mb-1">Welcome</h2>
              <h2 className="text-4xl font-bold">Dashboard</h2>
           </div>
           {/* Placeholder for illustration */}
           <div className="absolute right-0 bottom-0 w-48 h-full opacity-90 mix-blend-luminosity flex items-end justify-end pointer-events-none">
              <img 
                src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/graduation-cap.svg" 
                alt="Illustration"
                className="w-32 h-32 opacity-20 mr-4 mb-4"
              />
           </div>
        </div>
        
        {/* Stat Cards */}
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100">
             <h3 className="text-gray-900 font-bold text-lg mb-1 w-full text-left">{stat.label}</h3>
             <p className="text-3xl font-bold text-gray-900 w-full text-left mb-4">{stat.value}</p>
             <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mt-auto border border-blue-100/50">
               <stat.icon className="w-8 h-8 text-blue-400 stroke-[1.5]" />
             </div>
          </div>
        ))}
      </div>

      {/* Weekly Progress Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Total Active Participants */}
         <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-sm flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium mb-1">Peserta Aktif</p>
              <h3 className="text-3xl font-bold">{activeParticipantsCount}</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
         </div>
         {/* Upcoming Events */}
         <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-sm flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-1">Event Akan Datang</p>
              <h3 className="text-3xl font-bold">{upcomingEventsCount}</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
         </div>
         {/* Pending Reports */}
         <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-sm flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium mb-1">Laporan Tertunda</p>
              <h3 className="text-3xl font-bold">{pendingReportsCount}</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
         </div>
      </div>

      {/* Backup Utility Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <Download className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Backup Cloud ke Penyimpanan Lokal</h4>
            <p className="text-xs text-gray-500">Otomatis didownload setiap hari. Anda juga bisa memicu backup manual.</p>
          </div>
        </div>
        <button onClick={handleManualBackup} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm whitespace-nowrap">
          Backup Manual Sekarang
        </button>
      </div>

      {/* Papan Informasi Pintar (Smart Dashboard) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-[#8BC34A]/10 p-2.5 rounded-lg">
              <BarChart3 className="w-6 h-6 text-[#8BC34A]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">Papan Informasi Pintar</h3>
              <p className="text-sm text-gray-500">Ringkasan performa event secara real-time</p>
            </div>
          </div>
          
          {/* Event Filter */}
          <div className="relative">
            <select 
              value={selectedEventId} 
              onChange={e => setSelectedEventId(e.target.value)} 
              className="w-full sm:w-64 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8BC34A]/50 focus:border-[#8BC34A] bg-gray-50 appearance-none cursor-pointer"
            >
              <option value="all">Semua Event Aktif (Global)</option>
              {activeEvents.map((ev: any) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
               <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Total Peserta Box */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col justify-center text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <h4 className="text-sm font-semibold text-gray-500 mb-1">Total Peserta Terdaftar</h4>
            <div className="text-4xl font-bold text-gray-900">{totalEventParticipants}</div>
            <p className="text-xs text-gray-400 mt-2">
              {selectedEventId === 'all' ? 'Di seluruh event' : `Di event: ${selectedEvent?.title}`}
            </p>
          </div>

          {/* Persentase Kelulusan Box */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-200">
               <div className="h-full bg-[#8BC34A] transition-all duration-1000" style={{ width: `${completionPercentage}%` }}></div>
            </div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Activity className="w-6 h-6 text-[#8BC34A]" />
            </div>
            <h4 className="text-sm font-semibold text-gray-500 mb-1">Tingkat Penyelesaian</h4>
            <div className="text-4xl font-bold text-gray-900 flex items-baseline justify-center gap-1">
              {completionPercentage}<span className="text-2xl">%</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {completedCount} dari {totalEventParticipants} peserta telah menyelesaikan setidaknya 1 subtes.
            </p>
          </div>

          {/* Persebaran Subtes Box */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-gray-400" />
              <h4 className="text-sm font-semibold text-gray-700">Persebaran Subtes (Paket Soal)</h4>
            </div>
            {selectedEventId === 'all' ? (
              <div className="h-24 flex items-center justify-center text-sm text-gray-400 text-center border-2 border-dashed border-gray-200 rounded-lg p-4">
                Pilih satu event spesifik untuk melihat rincian paket soal yang diujikan.
              </div>
            ) : subtests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {subtests.map((test: string, i: number) => (
                  <span key={i} className="bg-white border border-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
                    {test}
                  </span>
                ))}
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-sm text-gray-400 text-center border-2 border-dashed border-gray-200 rounded-lg p-4">
                Belum ada subtes untuk event ini.
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* Aktivitas Terkini Widget */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
          <div className="bg-indigo-50 p-2.5 rounded-lg">
            <History className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">Aktivitas Terkini</h3>
            <p className="text-sm text-gray-500">Log riwayat aksi admin dan peserta</p>
          </div>
        </div>
        
        {activityLogs.length > 0 ? (
          <div className="space-y-4">
            {[...activityLogs].sort((a: any, b: any) => new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime()).slice(0, 5).map((log: any, idx: number) => (
              <div key={log.id || idx} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                <div className={`mt-1 w-2 h-2 rounded-full ${log.type === 'admin' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{log.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(log.timestamp || log.createdAt?.toDate?.() || new Date()).toLocaleString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center text-center text-gray-400">
            <History className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">Belum ada aktivitas tercatat</p>
            <p className="text-xs mt-1 max-w-xs">Aktivitas seperti backup manual atau peserta menyelesaikan tes akan muncul di sini.</p>
          </div>
        )}
      </div>

    </div>
  );
}
