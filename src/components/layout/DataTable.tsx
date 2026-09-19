import React from 'react';
import { Edit2, Trash2, Lock, Eye, Key, RotateCcw } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  className?: string;
  render?: (value: any, row: any, index: number) => React.ReactNode;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: any[];
  onAdd?: () => void;
  addLabel?: string;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onRestore?: (row: any) => void;
  onPermanentDelete?: (row: any) => void;
  onRowClick?: (row: any) => void;
  onView?: (row: any) => void;
  onResetPassword?: (row: any) => void;
  headerActions?: React.ReactNode;
}

export function DataTable({ title, columns, data, onAdd, addLabel = "+ Add Data", onEdit, onDelete, onRestore, onPermanentDelete, onRowClick, onView, onResetPassword, headerActions }: DataTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <div className="flex items-center space-x-3">
          {headerActions}
          {onAdd && (
            <button 
              onClick={onAdd}
              className="bg-[#8BC34A] hover:bg-[#7cb342] text-white px-4 py-2 rounded-md font-medium text-sm transition-colors w-fit"
            >
              {addLabel}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <span>Show</span>
          <select className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-[#8BC34A]">
            <option>10</option>
            <option>25</option>
            <option>50</option>
          </select>
          <span>entries</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>Search:</span>
          <input type="text" className="border border-gray-300 rounded px-3 py-1 w-full sm:w-48 focus:outline-none focus:border-[#8BC34A]" />
        </div>
      </div>

      <div className="overflow-x-auto border-t border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#1C1C1C] text-white font-semibold">
            <tr>
              {columns.map((col, idx) => (
                <th key={col.key} className="px-4 py-3 whitespace-nowrap uppercase tracking-wider text-xs">
                  <div className="flex items-center space-x-1">
                    <span>{col.label}</span>
                    <div className="flex flex-col opacity-50">
                       <span className="text-[8px] leading-[4px]">▲</span>
                       <span className="text-[8px] leading-[4px]">▼</span>
                    </div>
                  </div>
                </th>
              ))}
              {(onView || onEdit || onDelete || onRestore || onPermanentDelete || onResetPassword || data.some(r => r.hasLock)) && (
                <th className="px-4 py-3 whitespace-nowrap text-center uppercase tracking-wider text-xs min-w-[100px]">Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length > 0 ? data.map((row, rowIdx) => (
              <tr 
                key={rowIdx} 
                className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map(col => (
                  <td key={col.key} className={`px-4 py-3 text-gray-700 align-top ${col.className || 'whitespace-nowrap'}`}>
                    {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                  </td>
                ))}
                {(onView || onEdit || onDelete || onRestore || onPermanentDelete || onResetPassword || row.hasLock) && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                       {onView && (
                       <button onClick={() => onView(row)} className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded transition-colors cursor-pointer" title="Detail Peserta & Reset Subtes">
                         <Eye className="w-3.5 h-3.5" />
                       </button>
                     )}
                     {onRestore && (
                       <button 
                         onClick={() => onRestore(row)} 
                         className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded text-xs font-semibold transition-colors cursor-pointer" 
                         title="Pulihkan Data Peserta"
                       >
                         <RotateCcw className="w-3.5 h-3.5" />
                         <span>Pulihkan</span>
                       </button>
                     )}
                     {onResetPassword && (
                       <button onClick={() => onResetPassword(row)} className="p-1.5 bg-purple-100 text-purple-600 hover:bg-purple-200 rounded transition-colors cursor-pointer" title="Kirim Link Reset Password">
                         <Key className="w-3.5 h-3.5" />
                       </button>
                     )}
                     {onEdit && (
                       <button onClick={() => onEdit(row)} className="p-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded transition-colors" title="Edit">
                         <Edit2 className="w-3.5 h-3.5" />
                       </button>
                     )}
                     {row.hasLock && (
                       <button className="p-1.5 bg-amber-100 text-amber-600 hover:bg-amber-200 rounded transition-colors" title="Lock">
                         <Lock className="w-3.5 h-3.5" />
                       </button>
                     )}
                     {onDelete && (
                       <button onClick={() => onDelete(row)} className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded transition-colors" title="Pindahkan ke Tempat Sampah">
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                     )}
                     {onPermanentDelete && (
                       <button 
                         onClick={() => onPermanentDelete(row)} 
                         className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-300 rounded text-xs font-semibold transition-colors cursor-pointer" 
                         title="Hapus Permanen Dari Database"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                         <span>Hapus Permanen</span>
                       </button>
                     )}
                  </div>
                </td>
                )}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-500">
                  No data available in table
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 text-sm text-gray-600">
        <div>
          Showing 1 to {data.length} of {data.length} entries
        </div>
        <div className="flex items-center space-x-1">
          <button className="px-3 py-1.5 bg-[#1C1C1C] text-white rounded font-medium hover:bg-gray-800 transition-colors">Previous</button>
          <button className="px-3 py-1.5 bg-[#8BC34A] text-white rounded font-medium">1</button>
          <button className="px-3 py-1.5 bg-[#1C1C1C] text-white rounded font-medium hover:bg-gray-800 transition-colors">Next</button>
        </div>
      </div>
    </div>
  );
}
