import { useState, useCallback } from 'react';
import { addReport, getAllReports, updateReportStatus } from '@/lib/db';
import type { Report, ReportInput, StatusReport } from '@/types/report';

export default function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    const data = await getAllReports();
    setReports(data);
    setLoading(false);
  }, []);

  const criar = useCallback(async (data: ReportInput) => {
    const report = await addReport(data);
    return report;
  }, []);

  const atualizarStatus = useCallback(async (
    id: string,
    status: StatusReport,
    resolvidoPor: string,
    notasAdmin?: string,
  ) => {
    await updateReportStatus(id, status, resolvidoPor, notasAdmin);
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, resolvidoPor, notasAdmin } : r)),
    );
  }, []);

  return {
    reports,
    loading,
    carregar,
    criar,
    atualizarStatus,
  };
}
