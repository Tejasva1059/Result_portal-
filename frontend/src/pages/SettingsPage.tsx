import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { SchoolSetting } from '../types';
import {
  Settings,
  Save,
  Building,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import schoolLogo from '../assets/school_logo.png';

export const SettingsPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const { success, error } = useToast();

  const [settings, setSettings] = useState<SchoolSetting | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const data = await api.settings.get();
        setSettings(data);
      } catch (err: any) {
        error(err.message || 'Failed to load school settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !isSuperAdmin()) return;
    setSaving(true);
    try {
      const updated = await api.settings.update(settings);
      setSettings(updated);
      success('School settings updated successfully');
    } catch (err: any) {
      error(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin()) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Only the Super Administrator has permission to modify school-wide configuration.
        </p>
      </div>
    );
  }

  if (loading || !settings) {
    return (
      <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        <span className="text-xs">Loading school settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-amber-600" />
          School & Evaluation Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure official school identity, examination sessions, report card titles, and evaluation formulas.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* School Identity Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <Building className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">School Information</h2>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-20 h-20 rounded-xl bg-white border border-slate-300 p-1 flex items-center justify-center shrink-0 shadow-xs">
              <img src={schoolLogo} alt="School Logo" className="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{settings.school_name}</h3>
              <p className="text-xs text-slate-500">{settings.address}</p>
              <p className="text-[11px] text-amber-700 font-mono mt-1 font-bold">
                Official School Logo supplied by administration
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">School Name *</label>
              <input
                type="text"
                value={settings.school_name}
                onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">School Address *</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Institute Code *</label>
              <input
                type="text"
                value={settings.institute_code}
                onChange={(e) => setSettings({ ...settings, institute_code: e.target.value })}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">DISE Code *</label>
              <input
                type="text"
                value={settings.dise_code}
                onChange={(e) => setSettings({ ...settings, dise_code: e.target.value })}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Academic Session *</label>
              <input
                type="text"
                value={settings.academic_session}
                onChange={(e) => setSettings({ ...settings, academic_session: e.target.value })}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Report Card Title *</label>
              <input
                type="text"
                value={settings.report_card_title}
                onChange={(e) => setSettings({ ...settings, report_card_title: e.target.value })}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Examination & Evaluation Rules */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <GraduationCap className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">Evaluation & Passing Criteria</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Overall Passing Percentage (%) *
              </label>
              <input
                type="number"
                min={1}
                max={100}
                step="0.1"
                value={settings.passing_percentage}
                onChange={(e) => setSettings({ ...settings, passing_percentage: parseFloat(e.target.value) || 33 })}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default benchmark: 33.0%</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Subject-wise Minimum Percentage (%) *
              </label>
              <input
                type="number"
                min={1}
                max={100}
                step="0.1"
                value={settings.subject_min_percentage}
                onChange={(e) => setSettings({ ...settings, subject_min_percentage: parseFloat(e.target.value) || 33 })}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Student must achieve at least this percentage in every subject to pass.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
