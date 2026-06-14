import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Layout } from '../components/Layout';
import { TableSkeleton } from '../components/Skeletons';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  ArrowLeft, 
  Download, 
  FileCheck,
  FileText
} from 'lucide-react';

interface ReportDetails {
  id: string;
  fileName: string;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  createdAt: string;
  group: { name: string; baseCurrency: string };
  uploadedBy: { name: string };
  expenses: {
    id: string;
    title: string;
    amount: number;
    currency: string;
    amountInBase: number;
    date: string;
    paidBy: { name: string };
    splitType: string;
  }[];
  issues: {
    id: string;
    rowIndex: number;
    issueType: string;
    severity: string;
    description: string;
    suggestedAction: string;
    status: string;
  }[];
}

export const ImportReport: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { apiFetch } = useAuth();
  const toast = useToast();

  const [report, setReport] = useState<ReportDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/imports/${sessionId}/report`);
      setReport(res);
    } catch (err: any) {
      toast.error('Failed to retrieve report summaries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [sessionId]);

  const generatePDF = () => {
    if (!report) return;

    try {
      const doc = new jsPDF() as any;

      // Report Header
      doc.setFontSize(20);
      doc.setTextColor(76, 29, 149); // brand-900 color
      doc.text('ExpenseFlow Import Diagnostics Report', 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Group Workspace: ${report.group.name}`, 14, 26);
      doc.text(`File Analyzed: ${report.fileName}`, 14, 31);
      doc.text(`Imported By: ${report.uploadedBy.name}`, 14, 36);
      doc.text(`Timestamp: ${new Date(report.createdAt).toLocaleString()}`, 14, 41);

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 45, 196, 45);

      // Summary Grid Panel
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('Session Summary metrics:', 14, 53);

      doc.autoTable({
        startY: 57,
        head: [['Metric Column', 'Value Count']],
        body: [
          ['Total Rows in CSV', report.totalRows],
          ['Successfully Imported Expenses', report.importedRows],
          ['Skipped (Rejected) Rows', report.skippedRows],
          ['Exchange Conversions base', report.group.baseCurrency]
        ],
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] }
      });

      // Imported Expenses detailed table
      const nextY = (doc as any).lastAutoTable.finalY + 12;
      doc.text('Imported Expenses Ledger:', 14, nextY);

      const expBody = report.expenses.map(e => [
        new Date(e.date).toLocaleDateString(),
        e.title,
        e.paidBy?.name || 'Unknown Payer',
        e.splitType,
        `${e.currency} ${e.amount.toFixed(2)}`,
        `${report.group.baseCurrency} ${e.amountInBase.toFixed(2)}`
      ]);

      doc.autoTable({
        startY: nextY + 4,
        head: [['Date', 'Title', 'Paid By', 'Split Type', 'Original Amt', 'Base Currency Equivalent']],
        body: expBody,
        theme: 'grid',
        headStyles: { fillColor: [76, 29, 149] }
      });

      // Resolved Anomalies detailed table
      if (report.issues.length > 0) {
        const nextY2 = (doc as any).lastAutoTable.finalY + 12;
        doc.text('Anomaly Audit Log Resolutions:', 14, nextY2);

        const issueBody = report.issues.map(i => [
          `Row #${i.rowIndex}`,
          i.issueType.replace('_', ' '),
          i.severity,
          i.description,
          i.status
        ]);

        doc.autoTable({
          startY: nextY2 + 4,
          head: [['Row Index', 'Anomaly Rule', 'Severity', 'Issue Description', 'Action Resolved']],
          body: issueBody,
          theme: 'grid',
          headStyles: { fillColor: [245, 158, 11] }
        });
      }

      doc.save(`expenseflow_report_${report.id.slice(0, 8)}.pdf`);
      toast.success('Report PDF downloaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to compile PDF binary');
    }
  };

  if (loading) {
    return (
      <Layout title="Import Report">
        <TableSkeleton rows={6} />
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout title="Import Report">
        <div className="glass-card-no-hover p-12 text-center">
          <p className="text-slate-400">Failed to compile report summaries.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Import Report">
      {/* Header and Back Link */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Link to="/import" className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xs text-slate-400">CSV Import diagnostics completed successfully</p>
          </div>
        </div>
        <button
          onClick={generatePDF}
          className="btn-primary"
        >
          <Download className="h-4 w-4" /> Download PDF Report
        </button>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="glass-card p-6 border border-white/20">
          <p className="text-xs font-semibold text-slate-400 uppercase">Spreadsheet Rows</p>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{report.totalRows}</h3>
        </div>
        <div className="glass-card p-6 border border-white/20">
          <p className="text-xs font-semibold text-slate-400 uppercase text-emerald-500">Successfully Imported</p>
          <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{report.importedRows}</h3>
        </div>
        <div className="glass-card p-6 border border-white/20">
          <p className="text-xs font-semibold text-slate-400 uppercase text-rose-500">Skipped (Rejected)</p>
          <h3 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">{report.skippedRows}</h3>
        </div>
        <div className="glass-card p-6 border border-white/20">
          <p className="text-xs font-semibold text-slate-400 uppercase text-indigo-500">Resolved Alerts</p>
          <h3 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">{report.issues.length}</h3>
        </div>
      </div>

      {/* Imported Expenses ledger list */}
      <div className="glass-card-no-hover p-6 border border-white/20">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-emerald-500" /> Imported Expenses Ledger
        </h3>

        {report.expenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/40 pb-3">
                  <th className="py-3 font-semibold text-slate-400">Date</th>
                  <th className="py-3 font-semibold text-slate-400">Title</th>
                  <th className="py-3 font-semibold text-slate-400">Paid By</th>
                  <th className="py-3 font-semibold text-slate-400 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {report.expenses.map(expense => (
                  <tr key={expense.id} className="border-b border-slate-100 dark:border-slate-800/30">
                    <td className="py-3 font-medium">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className="font-bold text-slate-900 dark:text-white">{expense.title}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{expense.splitType} Split</span>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">{expense.paidBy?.name}</td>
                    <td className="py-3 text-right">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {expense.currency} {expense.amount.toFixed(2)}
                      </span>
                      {expense.currency !== report.group.baseCurrency && (
                        <span className="text-[10px] text-slate-400">
                          {report.group.baseCurrency} {expense.amountInBase.toFixed(2)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            No expenses were imported. All spreadsheet rows were skipped or rejected.
          </div>
        )}
      </div>

      {/* Resolved Warnings Roster */}
      {report.issues.length > 0 && (
        <div className="glass-card-no-hover p-6 border border-white/20">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" /> Resolved Diagnostic Anomalies
          </h3>
          <div className="space-y-3">
            {report.issues.map(issue => (
              <div key={issue.id} className="flex justify-between items-center p-3.5 border border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded">Row #{issue.rowIndex}</span>
                  <h4 className="font-bold text-sm text-slate-950 dark:text-white mt-1.5">{issue.issueType.replace('_', ' ')}</h4>
                  <p className="text-xs text-slate-400 mt-1">{issue.description}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider 
                    ${issue.status === 'REJECTED' 
                      ? 'bg-rose-500/10 text-rose-500' 
                      : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {issue.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
};
