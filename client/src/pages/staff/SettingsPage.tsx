import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { GymSettings, Staff } from '../../types/index.js';
import PlateCard from '../../components/common/PlateCard.js';
import BarbellLoader from '../../components/common/BarbellLoader.js';
import { Settings, Shield, UserPlus, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<GymSettings | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New staff form state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffDesignation, setNewStaffDesignation] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [addingStaff, setAddingStaff] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, staffRes] = await Promise.all([
        api.get('/staff/settings'),
        api.get('/staff/list'),
      ]);
      setSettings(settingsRes.data);
      setStaffList(staffRes.data);
    } catch (e) {
      console.error('Failed to load settings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      setStatusMessage(null);
      await api.put('/staff/settings', settings);
      setStatusMessage({ type: 'success', text: 'Gym settings updated successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Failed to update gym settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail || !newStaffDesignation || !newStaffPassword) {
      setStatusMessage({ type: 'error', text: 'All new staff fields are required.' });
      return;
    }

    try {
      setAddingStaff(true);
      setStatusMessage(null);
      const res = await api.post('/staff/create', {
        name: newStaffName,
        email: newStaffEmail,
        designation: newStaffDesignation,
        password: newStaffPassword,
      });

      setStatusMessage({ type: 'success', text: res.data.message });
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffDesignation('');
      setNewStaffPassword('');

      // Refresh staff list
      const staffRes = await api.get('/staff/list');
      setStaffList(staffRes.data);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to create staff account.',
      });
    } finally {
      setAddingStaff(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <BarbellLoader text="Loading System Configuration..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
          SYSTEM CONFIGURATION & STAFF
        </h1>
        <p className="text-xs sm:text-sm text-gym-muted">
          Configure automated reminder thresholds, billing cycle parameters, and staff credentials.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-lg ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-200 border-2 border-emerald-600'
              : 'bg-red-950/80 text-red-200 border-2 border-red-600'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Automation & Billing Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <PlateCard accent="red">
            <div className="flex items-center space-x-2.5 border-b border-gym-border pb-3 mb-5">
              <Settings className="w-5 h-5 text-gym-red" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Automation & Threshold Rules
                </h3>
                <p className="text-xs text-gym-muted">Rule engine parameters for insights & alerts</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-1">
                  Gym / Facility Name
                </label>
                <input
                  type="text"
                  value={settings.gymName}
                  onChange={(e) => setSettings({ ...settings, gymName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-sm text-white focus:outline-none focus:border-gym-red"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-1">
                    Fee Reminder Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.reminderLeadTimeDays}
                    onChange={(e) => setSettings({ ...settings, reminderLeadTimeDays: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-sm text-white focus:outline-none focus:border-gym-red"
                  />
                  <p className="text-[11px] text-gym-muted mt-1">Triggers reminder X days before due date.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-1">
                    AI Attendance Drop Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="90"
                    value={settings.attendanceDropThreshold}
                    onChange={(e) => setSettings({ ...settings, attendanceDropThreshold: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-sm text-white focus:outline-none focus:border-gym-red"
                  />
                  <p className="text-[11px] text-gym-muted mt-1">Flags at-risk when 2-wk drops vs 8-wk baseline.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-1">
                    Default Billing Cycle
                  </label>
                  <select
                    value={settings.billingCycle}
                    onChange={(e) => setSettings({ ...settings, billingCycle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-sm text-white focus:outline-none focus:border-gym-red"
                  >
                    <option value="monthly">Monthly Recurring</option>
                    <option value="quarterly">Quarterly (3 Months)</option>
                    <option value="annual">Annual Pass</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-1">
                    Max Inactivity Gap (Days)
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="60"
                    value={settings.inactivityThresholdDays}
                    onChange={(e) => setSettings({ ...settings, inactivityThresholdDays: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-sm text-white focus:outline-none focus:border-gym-red"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gym-red hover:bg-gym-redHover disabled:opacity-50 text-white text-xs font-bold tracking-wider transition-colors shadow-glow-red"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'SAVING...' : 'SAVE CONFIGURATION'}</span>
              </button>
            </form>
          </PlateCard>
        </div>

        {/* Right Column: Staff Account Management (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <PlateCard className="space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-gym-border pb-3">
              <Shield className="w-5 h-5 text-gym-muted" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Active Staff Credentials
                </h3>
                <p className="text-xs text-gym-muted">Staff accounts created by existing staff only</p>
              </div>
            </div>

            {/* List existing staff */}
            <div className="divide-y divide-gym-border/40 max-h-48 overflow-y-auto">
              {staffList.map((s) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{s.name}</div>
                    <div className="text-[11px] text-gym-muted font-mono">{s.designation}</div>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400">{s.user.email}</div>
                </div>
              ))}
            </div>

            {/* Add new staff form */}
            <div className="pt-4 border-t border-gym-border space-y-3">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-gym-subtext uppercase">
                <UserPlus className="w-4 h-4 text-gym-red" />
                <span>Add Staff Member</span>
              </div>

              <form onSubmit={handleAddStaff} className="space-y-2.5">
                <input
                  type="text"
                  required
                  placeholder="Full Name (e.g. Alex Ross)"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-3 py-2 bg-gym-darkest border border-gym-border rounded-lg text-xs text-white placeholder-gym-muted focus:outline-none focus:border-gym-red"
                />
                <input
                  type="text"
                  required
                  placeholder="Designation (e.g. Strength Coach)"
                  value={newStaffDesignation}
                  onChange={(e) => setNewStaffDesignation(e.target.value)}
                  className="w-full px-3 py-2 bg-gym-darkest border border-gym-border rounded-lg text-xs text-white placeholder-gym-muted focus:outline-none focus:border-gym-red"
                />
                <input
                  type="email"
                  required
                  placeholder="Staff Email"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gym-darkest border border-gym-border rounded-lg text-xs text-white placeholder-gym-muted focus:outline-none focus:border-gym-red"
                />
                <input
                  type="password"
                  required
                  placeholder="Temporary Password"
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gym-darkest border border-gym-border rounded-lg text-xs text-white placeholder-gym-muted focus:outline-none focus:border-gym-red"
                />

                <button
                  type="submit"
                  disabled={addingStaff}
                  className="w-full py-2 px-3 rounded-lg bg-gym-plate hover:bg-gym-plate/80 border border-gym-border text-white text-xs font-bold tracking-wider transition-colors"
                >
                  {addingStaff ? 'CREATING...' : '+ CREATE STAFF ACCOUNT'}
                </button>
              </form>
            </div>
          </PlateCard>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
