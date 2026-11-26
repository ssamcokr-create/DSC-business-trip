import { useEffect, useMemo, useState } from 'react';
import { X, Check, Presentation, Download } from 'lucide-react';
import { Project, TripAssignment } from '../types/trip';

export type ExportFormat = 'pptx' | 'csv';

interface ExportProjectsModalProps {
  open: boolean;
  format: ExportFormat;
  projects: Project[];
  assignments: TripAssignment[];
  selectedYear: number | 'all';
  focusedProjectId: string | null;
  onClose: () => void;
  onConfirmExport: (selectedProjects: Project[], format: ExportFormat) => void;
}

export function ExportProjectsModal({
  open,
  format,
  projects,
  assignments,
  selectedYear,
  focusedProjectId,
  onClose,
  onConfirmExport,
}: ExportProjectsModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const visibleProjects = useMemo(() => {
    return [...projects]
      .filter((p) => selectedYear === 'all' || p.year === selectedYear)
      .sort((a, b) => a.year - b.year || a.order - b.order);
  }, [projects, selectedYear]);

  useEffect(() => {
    if (!open) return;
    if (focusedProjectId && visibleProjects.some((p) => p.id === focusedProjectId)) {
      setSelectedIds([focusedProjectId]);
    } else {
      setSelectedIds([]);
    }
  }, [open, focusedProjectId, visibleProjects]);

  if (!open) return null;

  const toggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(visibleProjects.map((p) => p.id));
  };

  const clearAll = () => {
    setSelectedIds([]);
  };

  const selectedProjects = visibleProjects.filter((p) => selectedIds.includes(p.id));
  const isPptx = format === 'pptx';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-projects-modal-title"
        className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="export-projects-modal-title" className="text-base font-bold text-slate-900">
              {isPptx ? 'PPT 내보내기 — 프로젝트 선택' : '엑셀(CSV) 내보내기 — 프로젝트 선택'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              출력할 프로젝트를 선택하세요. 선택한 프로젝트의 출장 인원만 파일로 생성됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600">
            선택됨:{' '}
            <span className="font-mono-num font-bold text-blue-700">
              {selectedProjects.length}
            </span>
            <span className="text-slate-400 font-mono-num"> / {visibleProjects.length}개</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="px-2.5 py-1 font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              전체 선택
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="px-2.5 py-1 font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              선택 해제
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {visibleProjects.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              선택 가능한 프로젝트가 없습니다.
            </div>
          ) : (
            visibleProjects.map((project) => {
              const checked = selectedIds.includes(project.id);
              const count = assignments.filter((a) => a.projectId === project.id).length;
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => toggleId(project.id)}
                  className={`w-full flex items-center justify-between px-6 py-3 text-left transition-colors ${
                    checked ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        checked
                          ? 'bg-blue-700 border-blue-700 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        <span className="font-mono-num text-slate-500 mr-1.5">
                          [{project.year}]
                        </span>
                        {project.vehicleModel} {project.stage}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {project.destination}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono-num text-xs font-medium text-slate-600 shrink-0 ml-3">
                    {count}명
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 whitespace-nowrap"
          >
            취소
          </button>
          <button
            type="button"
            disabled={selectedProjects.length === 0}
            onClick={() => onConfirmExport(selectedProjects, format)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 rounded-md transition-colors whitespace-nowrap"
          >
            {isPptx ? (
              <Presentation className="w-4 h-4 shrink-0" />
            ) : (
              <Download className="w-4 h-4 shrink-0" />
            )}
            <span>
              선택한 {selectedProjects.length}개 프로젝트 {isPptx ? 'PPT 출력' : 'CSV 출력'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
