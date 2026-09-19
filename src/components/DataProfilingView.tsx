import React, { useMemo } from 'react';
import { Participant } from '../types/ist';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

interface DataProfilingViewProps {
  participants: Participant[];
}

const COLORS = ['#8BC34A', '#4285F4', '#FFCA28', '#EF4444', '#8B5CF6'];

export function DataProfilingView({ participants }: DataProfilingViewProps) {
  
  const genderData = useMemo(() => {
    let m = 0;
    let f = 0;
    participants.forEach(p => {
      if (p.jenisKelamin === 'L') m++;
      else if (p.jenisKelamin === 'P') f++;
    });
    return [
      { name: 'Laki-Laki (L)', value: m },
      { name: 'Perempuan (P)', value: f }
    ].filter(d => d.value > 0);
  }, [participants]);

  const educationData = useMemo(() => {
    const counts: Record<string, number> = {};
    participants.forEach(p => {
      const edu = p.pendidikan || 'Tidak Diketahui';
      counts[edu] = (counts[edu] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [participants]);

  const ageData = useMemo(() => {
    const counts: Record<string, number> = {};
    participants.forEach(p => {
      const ageRaw = p.usia;
      let ageGroup = 'Tidak Diketahui';
      
      if (ageRaw) {
        // Simple heuristic to extract number if string like '14 Tahun'
        const ageNum = typeof ageRaw === 'number' ? ageRaw : parseInt(ageRaw.toString().replace(/[^0-9]/g, ''));
        if (!isNaN(ageNum)) {
          if (ageNum < 15) ageGroup = '< 15';
          else if (ageNum >= 15 && ageNum <= 18) ageGroup = '15 - 18';
          else if (ageNum >= 19 && ageNum <= 22) ageGroup = '19 - 22';
          else if (ageNum >= 23 && ageNum <= 30) ageGroup = '23 - 30';
          else ageGroup = '> 30';
        }
      }
      
      counts[ageGroup] = (counts[ageGroup] || 0) + 1;
    });
    
    // Sort logic for specific groups
    const order = ['< 15', '15 - 18', '19 - 22', '23 - 30', '> 30', 'Tidak Diketahui'];
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
         const indexA = order.indexOf(a.name);
         const indexB = order.indexOf(b.name);
         return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      });
  }, [participants]);

  if (participants.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-500">
        Belum ada data peserta untuk dianalisis.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Distribusi Gender</h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Latar Belakang Pendidikan</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={educationData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <RechartsTooltip cursor={{fill: '#F3F4F6'}} />
                <Bar dataKey="value" fill="#4285F4" radius={[4, 4, 0, 0]}>
                  {educationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Distribusi Usia (Tahun)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ageData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <RechartsTooltip cursor={{fill: '#F3F4F6'}} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]}>
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
