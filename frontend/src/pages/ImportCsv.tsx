import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Layout } from '../components/Layout';
import { downloadSampleCSV } from '../utils/csv';
import { 
  FileSpreadsheet, 
  Upload, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  X, 
  ArrowRight
} from 'lucide-react';

interface Anomaly {
  id: string;
  rowIndex: number;
  issueType: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  description: string;
  suggestedAction: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IGNORED';
}

interface CSVRowPreview {
  rowIndex: number;
  date: string;
  title: string;
  description: string;
  amount: string;
  currency: string;
  paidByEmail: string;
  splitType: string;
  participantEmails: string;
  splitValues: string;
  notes: string;
  attachment: string;
  action: 'APPROVE' | 'REJECT' | 'IGNORE';
}

export const ImportCsv: React.FC = () => {
  const { apiFetch } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Workspace groups
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  
  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard state
  const [importStep, setImportStep] = useState<'upload' | 'review' | 'success'>('upload');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Parsing result state
  const [session, setSession] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [previewRows, setPreviewRows] = useState<CSVRowPreview[]>([]);

  // Editing drawer
  const [editRowIndex, setEditRowIndex] = useState<number | null>(null);
  const [editRowData, setEditRowData] = useState<Partial<CSVRowPreview> | null>(null);

  // Load user groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await apiFetch('/groups');
        setGroups(res);
        if (res.length > 0) setSelectedGroup(res[0].id);
      } catch (err: any) {
        toast.error('Failed to load user groups');
      }
    };
    fetchGroups();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      } else {
        toast.error('Please drop a valid .csv spreadsheet file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Upload and scan CSV file
  const handleUpload = async () => {
    if (!selectedGroup) {
      toast.error('Please select a target group workspace first');
      return;
    }
    if (!file) {
      toast.error('Please select or drag a CSV file to upload');
      return;
    }

    setLoading(true);
    setProgress(20);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setProgress(50);
      const res = await apiFetch(`/groups/${selectedGroup}/import`, {
        method: 'POST',
        body: formData
      });

      setProgress(80);
      setSession(res.session);

      // Fetch the raw anomalies details
      const issuesRes = await apiFetch(`/imports/${res.session.id}/issues`);
      
      // Parse the CSV rows on client for previews
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        
        const rowsParsed: CSVRowPreview[] = [];
        for (let i = 1; i < lines.length; i++) {
          const rawCols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          
          // Construct row object mapping header fields
          const rowObj: any = {
            rowIndex: i,
            date: rawCols[0] || '',
            title: rawCols[1] || '',
            description: rawCols[2] || '',
            amount: rawCols[3] || '',
            currency: rawCols[4] || '',
            paidByEmail: rawCols[5] || '',
            splitType: rawCols[6] || 'EQUAL',
            participantEmails: rawCols[7] || '',
            splitValues: rawCols[8] || '',
            notes: rawCols[9] || '',
            attachment: rawCols[10] || '',
            action: 'APPROVE' // default action
          };
          rowsParsed.push(rowObj);
        }

        setPreviewRows(rowsParsed);
        setProgress(100);
        
        // Map backend issues to frontend Anomaly state
        const anomaliesMapped: Anomaly[] = issuesRes.map((issue: any) => ({
          id: issue.id,
          rowIndex: issue.rowIndex,
          issueType: issue.issueType,
          severity: issue.severity,
          description: issue.description,
          suggestedAction: issue.suggestedAction,
          status: 'PENDING'
        }));

        setAnomalies(anomaliesMapped);
        
        // Auto-reject malformed rows or rows that have critical errors
        const initialRows = rowsParsed.map(row => {
          const rowIssues = anomaliesMapped.filter(a => a.rowIndex === row.rowIndex);
          const hasError = rowIssues.some(i => i.severity === 'ERROR');
          return {
            ...row,
            action: hasError ? 'REJECT' : 'APPROVE' as any
          };
        });
        setPreviewRows(initialRows);

        setImportStep('review');
        setLoading(false);
      };
      
      reader.readAsText(file);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error uploading CSV data');
      setLoading(false);
      setProgress(0);
    }
  };

  // Resolve Anomaly Action
  const handleResolveAnomaly = async (anomalyId: string, action: 'APPROVE' | 'REJECT' | 'IGNORE') => {
    try {
      await apiFetch(`/imports/issues/${anomalyId}`, {
        method: 'PUT',
        body: JSON.stringify({ action })
      });

      setAnomalies(prev => prev.map(a => {
        if (a.id === anomalyId) {
          return { ...a, status: action === 'APPROVE' ? 'APPROVED' : (action === 'IGNORE' ? 'IGNORED' : 'REJECTED') };
        }
        return a;
      }));

      // Adjust preview row action accordingly
      const anomaly = anomalies.find(a => a.id === anomalyId);
      if (anomaly) {
        setPreviewRows(prev => prev.map(row => {
          if (row.rowIndex === anomaly.rowIndex) {
            return { ...row, action: action === 'REJECT' ? 'REJECT' : 'APPROVE' };
          }
          return row;
        }));
      }

      toast.success(`Anomaly action marked: ${action}`);
    } catch (err: any) {
      toast.error('Failed to update resolution');
    }
  };

  // Batch Resolve Warnings
  const handleBatchResolveWarnings = async () => {
    try {
      await apiFetch(`/imports/${session.id}/batch-resolve`, {
        method: 'PUT',
        body: JSON.stringify({ severity: 'WARNING', action: 'APPROVED' })
      });

      // Update local state
      setAnomalies(prev => prev.map(a => {
        if (a.severity === 'WARNING' && a.status === 'PENDING') {
          return { ...a, status: 'APPROVED' };
        }
        return a;
      }));

      toast.success('All warning alerts have been approved');
    } catch (err: any) {
      toast.error('Failed to batch resolve warnings');
    }
  };

  // Inline Row Editor Drawer Launch
  const openRowEditor = (row: CSVRowPreview) => {
    setEditRowIndex(row.rowIndex);
    setEditRowData({ ...row });
  };

  // Inline Row Editor Save
  const saveRowEdits = () => {
    if (editRowIndex === null || !editRowData) return;

    setPreviewRows(prev => prev.map(row => {
      if (row.rowIndex === editRowIndex) {
        return { ...row, ...editRowData };
      }
      return row;
    }));

    // Clear anomalies for this row in the UI (since the user edited and resolved the values)
    setAnomalies(prev => prev.filter(a => a.rowIndex !== editRowIndex));
    
    // Auto-approve row in preview
    setPreviewRows(prev => prev.map(row => {
      if (row.rowIndex === editRowIndex) {
        return { ...row, action: 'APPROVE' };
      }
      return row;
    }));

    toast.success(`Row #${editRowIndex} updated successfully`);
    setEditRowIndex(null);
    setEditRowData(null);
  };

  // Final Commit Import
  const handleCommitImport = async () => {
    // Check if there are any remaining PENDING anomalies (errors or warnings)
    const pendingCount = anomalies.filter(a => a.status === 'PENDING').length;
    if (pendingCount > 0) {
      toast.warning(`Please resolve all ${pendingCount} remaining alerts before finalizing the import`);
      return;
    }

    setLoading(true);
    try {
      // Map frontend preview rows to backend format:
      // rowIndex, data, action
      const bodyRows = previewRows.map(row => ({
        rowIndex: row.rowIndex,
        action: row.action,
        data: {
          date: row.date,
          title: row.title,
          description: row.description,
          amount: row.amount,
          currency: row.currency,
          paidByEmail: row.paidByEmail,
          splitType: row.splitType,
          participantEmails: row.participantEmails,
          splitValues: row.splitValues,
          notes: row.notes,
          attachment: row.attachment
        }
      }));

      const res = await apiFetch(`/imports/${session.id}/commit`, {
        method: 'POST',
        body: JSON.stringify({ rows: bodyRows })
      });

      toast.success('Import completed successfully!');
      // Navigate to detailed Import Report
      navigate(`/import/report/${session.id}`, { state: { summary: res } });
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete import');
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setFile(null);
    setAnomalies([]);
    setPreviewRows([]);
    setSession(null);
    setImportStep('upload');
    setProgress(0);
  };

  const getSeverityBadge = (sev: 'ERROR' | 'WARNING' | 'INFO') => {
    switch (sev) {
      case 'ERROR':
        return <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-500 font-bold px-2 py-0.5 rounded text-[10px]"><AlertCircle className="h-3 w-3" /> ERROR</span>;
      case 'WARNING':
        return <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-500 font-bold px-2 py-0.5 rounded text-[10px]"><AlertTriangle className="h-3 w-3" /> WARNING</span>;
      case 'INFO':
        return <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-500 font-bold px-2 py-0.5 rounded text-[10px]"><Info className="h-3 w-3" /> INFO</span>;
    }
  };

  return (
    <Layout title="CSV Importer Wizard">
      {/* STEP 1: Upload CSV file */}
      {importStep === 'upload' && (
        <div className="space-y-6">
          <div className="glass-card p-6 border border-white/20">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Import Shared Expenses Spreadsheet</h3>
            <p className="text-sm text-slate-400">Select your target group workspace, upload an expenses CSV log, and run the real-time anomaly engine.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form selections */}
            <div className="glass-card p-6 border border-white/20 h-fit space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">1. Select Destination Group</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full glass-input text-sm"
                >
                  <option value="">Choose a group...</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.baseCurrency})</option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Test Sandbox Template</label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Download a preloaded testing template that simulates all 13 anomaly rules.</p>
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="w-full btn-secondary text-xs flex items-center justify-center gap-2 py-2"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                  Download Sample CSV
                </button>
              </div>
            </div>

            {/* Drag & drop upload area */}
            <div className="lg:col-span-2 space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[300px]
                  ${dragging 
                    ? 'border-brand-500 bg-brand-500/10' 
                    : 'border-slate-300 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/10 hover:border-brand-500/50 hover:bg-white/60 dark:hover:bg-slate-900/20'
                  }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />
                
                <div className="p-4 bg-brand-500/10 text-brand-500 rounded-2xl mb-4">
                  <Upload className="h-8 w-8" />
                </div>
                
                {file ? (
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Drag and drop your spreadsheet here</p>
                    <p className="text-xs text-slate-400">or click to browse local files (CSV only)</p>
                  </div>
                )}
              </div>

              {progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400 font-semibold">
                    <span>Analyzing data...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-brand-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                {file && (
                  <button
                    onClick={resetWizard}
                    className="btn-secondary py-2"
                  >
                    Clear File
                  </button>
                )}
                <button
                  onClick={handleUpload}
                  disabled={loading || !file || !selectedGroup}
                  className="btn-primary py-2 px-6"
                >
                  Scan CSV for Anomalies <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Review & Resolve Anomalies */}
      {importStep === 'review' && (
        <div className="space-y-6">
          <div className="glass-card p-6 border border-white/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Review Diagnostics</h3>
              <p className="text-sm text-slate-400 mt-1">
                Found {anomalies.length} anomaly warnings in {previewRows.length} rows. Please review and approve actions.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={resetWizard} className="btn-secondary py-2 text-xs">
                Reset Upload
              </button>
              <button
                onClick={handleBatchResolveWarnings}
                disabled={anomalies.filter(a => a.severity === 'WARNING' && a.status === 'PENDING').length === 0}
                className="btn-secondary py-2 text-xs border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
              >
                Approve All Warnings
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Anomalies alert list */}
            <div className="glass-card p-6 border border-white/20 h-[500px] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Validation Alerts</h3>
                <p className="text-xs text-slate-400 mb-4">Critical errors must be corrected. Warnings can be approved/ignored.</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {anomalies.length > 0 ? (
                  anomalies.map(anomaly => (
                    <div 
                      key={anomaly.id}
                      className={`p-3.5 rounded-2xl border transition-all duration-200 
                        ${anomaly.status !== 'PENDING' 
                          ? 'opacity-40 border-slate-200 dark:border-slate-800' 
                          : anomaly.severity === 'ERROR' 
                            ? 'border-rose-500/20 bg-rose-500/5' 
                            : 'border-amber-500/20 bg-amber-500/5'
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-slate-400 font-bold">Row #{anomaly.rowIndex}</span>
                        {getSeverityBadge(anomaly.severity)}
                      </div>
                      
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">{anomaly.issueType.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{anomaly.description}</p>
                      
                      {anomaly.status === 'PENDING' ? (
                        <div className="mt-3 flex gap-2 justify-end">
                          <button
                            onClick={() => handleResolveAnomaly(anomaly.id, 'REJECT')}
                            className="px-2 py-1 text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors border border-rose-500/20"
                          >
                            Skip Row
                          </button>
                          
                          {anomaly.severity !== 'ERROR' && (
                            <button
                              onClick={() => handleResolveAnomaly(anomaly.id, 'APPROVE')}
                              className="px-2 py-1 text-[10px] font-bold text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors border border-emerald-500/20"
                            >
                              Approve
                            </button>
                          )}

                          <button
                            onClick={() => openRowEditor(previewRows.find(r => r.rowIndex === anomaly.rowIndex)!)}
                            className="px-2 py-1 text-[10px] font-bold text-brand-500 hover:bg-brand-500/10 rounded-lg transition-colors border border-brand-500/20"
                          >
                            Edit
                          </button>
                        </div>
                      ) : (
                        <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Resolved as {anomaly.status}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 text-slate-400 text-xs">
                    <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                    All checks passed! No anomalies found in spreadsheet.
                  </div>
                )}
              </div>
            </div>

            {/* CSV preview table */}
            <div className="lg:col-span-2 glass-card-no-hover border border-white/20 flex flex-col justify-between h-[500px]">
              <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50">
                <h3 className="font-bold text-slate-900 dark:text-white">Spreadsheet Preview Grid</h3>
                <p className="text-xs text-slate-400 mt-0.5">Double check details. Rows marked as REJECT will be skipped.</p>
              </div>

              <div className="flex-1 overflow-auto scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-200/40 dark:bg-slate-900/40 border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0">
                      <th className="p-3 font-semibold text-slate-400">Row</th>
                      <th className="p-3 font-semibold text-slate-400">Date</th>
                      <th className="p-3 font-semibold text-slate-400">Title</th>
                      <th className="p-3 font-semibold text-slate-400 text-right">Amount</th>
                      <th className="p-3 font-semibold text-slate-400">Payer Email</th>
                      <th className="p-3 font-semibold text-slate-400">Split Method</th>
                      <th className="p-3 font-semibold text-slate-400">Import Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map(row => {
                      const isRejected = row.action === 'REJECT';
                      const rowIssues = anomalies.filter(a => a.rowIndex === row.rowIndex);
                      const hasCritical = rowIssues.some(i => i.severity === 'ERROR');

                      return (
                        <tr 
                          key={row.rowIndex} 
                          className={`border-b border-slate-100 dark:border-slate-800/30 transition-colors
                            ${isRejected 
                              ? 'bg-rose-500/5 text-slate-400 dark:text-slate-600 line-through' 
                              : hasCritical 
                                ? 'bg-rose-500/5 dark:bg-rose-950/5' 
                                : 'hover:bg-slate-100/30 dark:hover:bg-slate-900/10'
                            }`}
                        >
                          <td className="p-3 font-bold">{row.rowIndex}</td>
                          <td className="p-3 font-medium">{row.date}</td>
                          <td className="p-3">
                            <span className="font-semibold">{row.title}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{row.description}</span>
                          </td>
                          <td className="p-3 text-right font-bold">{row.currency} {row.amount}</td>
                          <td className="p-3 truncate max-w-[150px]">{row.paidByEmail}</td>
                          <td className="p-3 uppercase font-medium">{row.splitType}</td>
                          <td className="p-3">
                            <select
                              value={row.action}
                              onChange={(e) => {
                                const act = e.target.value as any;
                                setPreviewRows(prev => prev.map(r => r.rowIndex === row.rowIndex ? { ...r, action: act } : r));
                              }}
                              className="bg-transparent dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1"
                            >
                              <option value="APPROVE">Import</option>
                              <option value="REJECT">Skip (Exclude)</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Commit Footer */}
              <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between bg-slate-200/10 dark:bg-slate-900/10">
                <span className="text-xs text-slate-400">
                  Importing {previewRows.filter(r => r.action === 'APPROVE').length} of {previewRows.length} expenses
                </span>
                <button
                  onClick={handleCommitImport}
                  disabled={loading || anomalies.filter(a => a.status === 'PENDING').length > 0}
                  className="btn-primary py-2 px-6 disabled:opacity-50"
                >
                  {loading ? 'Processing Import...' : 'Commit Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROW EDIT DRAWER */}
      {editRowIndex !== null && editRowData && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setEditRowIndex(null)} />
          <div className="relative w-full max-w-md h-full glass-panel border-l border-white/20 flex flex-col justify-between p-6 shadow-2xl animate-slide-left overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Correct Row #{editRowIndex}</h3>
                <p className="text-xs text-slate-400">Inline diagnostics correction form</p>
              </div>
              <button onClick={() => setEditRowIndex(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Title</label>
                <input
                  type="text"
                  value={editRowData.title || ''}
                  onChange={(e) => setEditRowData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full glass-input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editRowData.amount || ''}
                    onChange={(e) => setEditRowData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full glass-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Currency</label>
                  <select
                    value={editRowData.currency || 'USD'}
                    onChange={(e) => setEditRowData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full glass-input text-sm"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Date</label>
                <input
                  type="text"
                  placeholder="YYYY-MM-DD"
                  value={editRowData.date || ''}
                  onChange={(e) => setEditRowData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Payer Email</label>
                <input
                  type="email"
                  value={editRowData.paidByEmail || ''}
                  onChange={(e) => setEditRowData(prev => ({ ...prev, paidByEmail: e.target.value }))}
                  className="w-full glass-input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Split Method</label>
                  <select
                    value={editRowData.splitType || 'EQUAL'}
                    onChange={(e) => setEditRowData(prev => ({ ...prev, splitType: e.target.value }))}
                    className="w-full glass-input text-sm"
                  >
                    <option value="EQUAL">EQUAL</option>
                    <option value="PERCENTAGE">PERCENTAGE</option>
                    <option value="EXACT">EXACT</option>
                    <option value="SHARES">SHARES</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Participant Emails (Semicolon Split)</label>
                  <input
                    type="text"
                    value={editRowData.participantEmails || ''}
                    onChange={(e) => setEditRowData(prev => ({ ...prev, participantEmails: e.target.value }))}
                    className="w-full glass-input text-sm"
                  />
                </div>
              </div>

              {editRowData.splitType !== 'EQUAL' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Split Values (Semicolon Split)</label>
                  <input
                    type="text"
                    placeholder="e.g. 50;50"
                    value={editRowData.splitValues || ''}
                    onChange={(e) => setEditRowData(prev => ({ ...prev, splitValues: e.target.value }))}
                    className="w-full glass-input text-sm"
                  />
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-200/50 dark:border-slate-800/50 mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setEditRowIndex(null)}
                className="w-1/2 btn-secondary py-2.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveRowEdits}
                className="w-1/2 btn-primary py-2.5"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
