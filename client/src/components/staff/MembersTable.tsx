import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Member } from '../../types/index.js';
import ChalkBadge from '../common/ChalkBadge.js';
import { Search, ArrowUpDown, ChevronRight, DollarSign, QrCode, AlertCircle } from 'lucide-react';

interface MembersTableProps {
  members: Member[];
  onLogPayment: (member: Member) => void;
  onQuickCheckIn: (member: Member) => void;
}

export const MembersTable: React.FC<MembersTableProps> = ({
  members,
  onLogPayment,
  onQuickCheckIn,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'frozen' | 'due_soon'>('all');
  const [sortField, setSortField] = useState<'name' | 'feeDueDate' | 'lastCheckIn'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter members
  const filtered = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'due_soon') {
      return (m.daysUntilDue !== undefined && m.daysUntilDue <= 5 && m.daysUntilDue >= 0);
    }
    return m.membershipStatus === statusFilter;
  });

  // Sort members
  const sorted = [...filtered].sort((a, b) => {
    if (sortField === 'name') {
      return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    if (sortField === 'feeDueDate') {
      const tA = new Date(a.feeDueDate).getTime();
      const tB = new Date(b.feeDueDate).getTime();
      return sortOrder === 'asc' ? tA - tB : tB - tA;
    }
    if (sortField === 'lastCheckIn') {
      const tA = a.lastCheckIn ? new Date(a.lastCheckIn).getTime() : 0;
      const tB = b.lastCheckIn ? new Date(b.lastCheckIn).getTime() : 0;
      return sortOrder === 'asc' ? tA - tB : tB - tA;
    }
    return 0;
  });

  const toggleSort = (field: 'name' | 'feeDueDate' | 'lastCheckIn') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="bg-gym-card rounded-xl border border-gym-border shadow-plate overflow-hidden">
      {/* Table Controls */}
      <div className="p-4 border-b border-gym-border flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gym-muted" />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gym-darkest border border-gym-border rounded-lg text-sm text-white placeholder-gym-muted focus:outline-none focus:border-gym-red"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'ALL MEMBERS' },
            { id: 'active', label: 'ACTIVE' },
            { id: 'due_soon', label: 'DUE SOON' },
            { id: 'expired', label: 'EXPIRED' },
            { id: 'frozen', label: 'FROZEN' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
                statusFilter === tab.id
                  ? 'bg-gym-red text-white shadow-sm'
                  : 'bg-gym-plate text-gym-subtext hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gym-plate/50 text-xs uppercase font-bold text-gym-muted border-b border-gym-border">
            <tr>
              <th
                onClick={() => toggleSort('name')}
                className="py-3 px-4 cursor-pointer hover:text-white select-none"
              >
                <div className="flex items-center space-x-1">
                  <span>MEMBER</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="py-3 px-4">STATUS</th>
              <th
                onClick={() => toggleSort('feeDueDate')}
                className="py-3 px-4 cursor-pointer hover:text-white select-none"
              >
                <div className="flex items-center space-x-1">
                  <span>FEE DUE DATE</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('lastCheckIn')}
                className="py-3 px-4 cursor-pointer hover:text-white select-none"
              >
                <div className="flex items-center space-x-1">
                  <span>LAST VISIT</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="py-3 px-4">AI INSIGHT</th>
              <th className="py-3 px-4 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gym-border/60">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gym-muted text-sm">
                  No members matched your search criteria.
                </td>
              </tr>
            ) : (
              sorted.map((m) => {
                const dueDate = new Date(m.feeDueDate);
                const isOverdue = m.daysUntilDue !== undefined && m.daysUntilDue < 0;
                const isDueSoon = m.daysUntilDue !== undefined && m.daysUntilDue <= 5 && m.daysUntilDue >= 0;

                return (
                  <tr
                    key={m.id}
                    className="hover:bg-gym-plate/40 transition-colors group"
                  >
                    {/* Member Name & Phone */}
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/staff/members/${m.id}`}
                        className="font-semibold text-white group-hover:text-gym-red transition-colors flex items-center space-x-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-gym-plate border border-gym-border flex items-center justify-center font-bold text-xs text-white">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <div>{m.name}</div>
                          {m.email && <div className="text-xs text-gym-muted">{m.email}</div>}
                        </div>
                      </Link>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <ChalkBadge status={m.membershipStatus} daysUntilDue={m.daysUntilDue} />
                    </td>

                    {/* Fee Due Date */}
                    <td className="py-3.5 px-4">
                      <div className={`font-mono text-xs ${isOverdue ? 'text-red-400 font-bold' : isDueSoon ? 'text-amber-400 font-semibold' : 'text-gym-subtext'}`}>
                        {dueDate.toLocaleDateString()}
                      </div>
                      <div className="text-[11px] text-gym-muted">
                        ${m.feeAmount.toFixed(2)} / mo
                      </div>
                    </td>

                    {/* Last Check-in */}
                    <td className="py-3.5 px-4 font-mono text-xs text-gym-subtext">
                      {m.lastCheckIn ? (
                        <>
                          <div>{new Date(m.lastCheckIn).toLocaleDateString()}</div>
                          <div className="text-[11px] text-gym-muted">
                            {new Date(m.lastCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </>
                      ) : (
                        <span className="text-gym-muted italic">Never</span>
                      )}
                    </td>

                    {/* AI Insight Tag */}
                    <td className="py-3.5 px-4">
                      {m.latestInsight ? (
                        <div className="max-w-[200px] truncate text-xs" title={m.latestInsight.observation}>
                          <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                            m.latestInsight.type === 'drop_risk' ? 'bg-gym-red animate-pulse' : 'bg-gym-greenBright'
                          }`} />
                          <span className="text-zinc-300">{m.latestInsight.observation}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gym-muted font-mono">Calibrating</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onQuickCheckIn(m)}
                          title="Manual Check-In"
                          className="p-1.5 rounded-lg bg-gym-plate hover:bg-gym-red hover:text-white text-gym-subtext border border-gym-border transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onLogPayment(m)}
                          title="Log Fee Payment"
                          className="p-1.5 rounded-lg bg-gym-plate hover:bg-gym-green hover:text-white text-gym-subtext border border-gym-border transition-colors"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/staff/members/${m.id}`}
                          title="View Profile"
                          className="p-1.5 rounded-lg bg-gym-plate hover:text-white text-gym-subtext border border-gym-border transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MembersTable;
