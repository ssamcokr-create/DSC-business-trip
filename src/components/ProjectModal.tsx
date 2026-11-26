import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Project } from '../types/trip';

interface ProjectModalProps {
  open: boolean;
  editingProject: Project | null;
  existingProjects: Project[];
  onClose: () => void;
  onSave: (
    data: Omit<Project, 'id' | 'order'>,
    copyFromProjectId?: string
  ) => void;
}

export function ProjectModal({
  open,
  editingProject,
  existingProjects,
  onClose,
  onSave,
}: ProjectModalProps) {
  const [year, setYear] = useState(2026);
  const [vehicleModel, setVehicleModel] = useState('');
  const [stage, setStage] = useState('');
  const [destination, setDestination] = useState('');
  const [copyFromProjectId, setCopyFromProjectId] = useState('');

  useEffect(() => {
    if (editingProject) {
      setYear(editingProject.year);
      setVehicleModel(editingProject.vehicleModel);
      setStage(editingProject.stage);
      setDestination(editingProject.destination);
      setCopyFromProjectId('');
    } else {
      setYear(2026);
      setVehicleModel('');
      setStage('[FRM]');
      setDestination('');
      setCopyFromProjectId('');
    }
  }, [editingProject, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleModel.trim() || !destination.trim()) return;
    onSave(
      {
        year: Number(year),
        vehicleModel: vehicleModel.trim(),
        stage: stage.trim(),
        destination: destination.trim(),
      },
      editingProject ? undefined : copyFromProjectId || undefined
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="project-modal-title" className="text-base font-bold text-slate-900">
            {editingProject ? '프로젝트 정보 수정' : '새 프로젝트 추가'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">연도</label>
              <input
                type="number"
                required
                min={2024}
                max={2035}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">차종 (프로젝트명)</label>
              <input
                type="text"
                required
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="예: NX5e, SX3i, QY2i"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">단계 / 구분</label>
            <input
              type="text"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              placeholder="예: [FRM], [CCB], [통풍], [FRM] M단계 지원"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">출장지 (국가/거점)</label>
            <input
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="예: 체코 [트지네츠], 인도 [만누르], 인도 [뱅갈로]"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {!editingProject && existingProjects.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                기존 프로젝트 인원 구성 복사 (선택)
              </label>
              <select
                value={copyFromProjectId}
                onChange={(e) => setCopyFromProjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">빈 프로젝트로 시작</option>
                {existingProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.year} · {p.vehicleModel} {p.stage} ({p.destination}) 인원 복사
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                선택 시 해당 프로젝트의 선행기술팀 및 협력업체 인원·업무 목록이 복사됩니다 (일정은 초기화).
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 whitespace-nowrap"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md whitespace-nowrap"
            >
              {editingProject ? '수정 저장' : '프로젝트 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
