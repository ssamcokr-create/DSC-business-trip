import React, { useState, useEffect } from 'react';
import { X, Copy, Calendar } from 'lucide-react';
import { Project, TripAssignment, TripStatus } from '../types/trip';
import { calculateTripDays } from '../utils/dateUtils';

interface TripAssignmentModalProps {
  assignment: TripAssignment | null;
  project: Project | null;
  onClose: () => void;
  onSave: (updated: TripAssignment) => void;
}

export function TripAssignmentModal({
  assignment,
  project,
  onClose,
  onSave,
}: TripAssignmentModalProps) {
  const [form, setForm] = useState<TripAssignment | null>(assignment);

  useEffect(() => {
    setForm(assignment);
  }, [assignment]);

  if (!form) return null;

  const plannedDays = calculateTripDays(form.plannedStartDate, form.plannedEndDate);
  const actualDays = calculateTripDays(form.actualStartDate, form.actualEndDate);
  const diffDays = actualDays - plannedDays;

  const handleCopyPlannedToActual = () => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            actualStartDate: prev.plannedStartDate,
            actualEndDate: prev.plannedEndDate,
            actualHeadcount: prev.plannedStartDate && prev.plannedEndDate ? 1 : prev.actualHeadcount,
          }
        : null
    );
  };

  const handleClearActual = () => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            actualStartDate: '',
            actualEndDate: '',
            actualHeadcount: 0,
          }
        : null
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trip-modal-title"
        className="relative z-10 h-full w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="trip-modal-title" className="text-base font-bold text-slate-900">
              개인별 계획·실적 일정 및 상세 입력
            </h2>
            {project && (
              <p className="text-xs text-slate-500 mt-0.5">
                {project.year} · {project.vehicleModel} {project.stage} · {project.destination}
              </p>
            )}
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                소속 / 업체명
              </label>
              <input
                type="text"
                required
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                성명
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="성명 또는 미정"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                담당업무
              </label>
              <input
                type="text"
                value={form.task}
                onChange={(e) => setForm({ ...form, task: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Status & headcount */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                출장 상태
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as TripStatus })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="준비중">준비중</option>
                <option value="출장중">출장중</option>
                <option value="완료">완료</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                인원 (계획)
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={form.plannedHeadcount}
                onChange={(e) =>
                  setForm({ ...form, plannedHeadcount: Math.max(0, Number(e.target.value)) })
                }
                className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                인원 (실적)
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={form.actualHeadcount}
                onChange={(e) =>
                  setForm({ ...form, actualHeadcount: Math.max(0, Number(e.target.value)) })
                }
                className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Planned Schedule */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Calendar className="w-4 h-4 text-blue-700" />
                <span>계획일정 (Plan)</span>
              </div>
              <span className="text-xs font-mono-num font-semibold text-blue-700">
                출장일수: {plannedDays}일
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">계획 시작일</label>
                <input
                  type="date"
                  value={form.plannedStartDate}
                  onChange={(e) => setForm({ ...form, plannedStartDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">계획 종료일</label>
                <input
                  type="date"
                  value={form.plannedEndDate}
                  min={form.plannedStartDate || undefined}
                  onChange={(e) => setForm({ ...form, plannedEndDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Actual Schedule */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <span>실적일정 (Actual)</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyPlannedToActual}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors whitespace-nowrap"
                >
                  <Copy className="w-3 h-3" />
                  <span>계획일정 복사</span>
                </button>
                {(form.actualStartDate || form.actualEndDate) && (
                  <button
                    type="button"
                    onClick={handleClearActual}
                    className="text-xs text-slate-500 hover:text-slate-800 whitespace-nowrap"
                  >
                    초기화
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">실적 시작일</label>
                <input
                  type="date"
                  value={form.actualStartDate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      actualStartDate: e.target.value,
                      actualHeadcount:
                        e.target.value && form.actualEndDate
                          ? Math.max(1, form.actualHeadcount)
                          : form.actualHeadcount,
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">실적 종료일</label>
                <input
                  type="date"
                  value={form.actualEndDate}
                  min={form.actualStartDate || undefined}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      actualEndDate: e.target.value,
                      actualHeadcount:
                        form.actualStartDate && e.target.value
                          ? Math.max(1, form.actualHeadcount)
                          : form.actualHeadcount,
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs">
              <span className="text-slate-600">실적 출장일수 및 계획대비 증감</span>
              <span className="font-mono-num font-semibold text-slate-900">
                실적 {actualDays}일 · 계획대비{' '}
                <span
                  className={
                    diffDays > 0
                      ? 'text-rose-700'
                      : diffDays < 0
                        ? 'text-sky-700'
                        : 'text-slate-700'
                  }
                >
                  {diffDays > 0 ? `+${diffDays}` : diffDays}일
                </span>
              </span>
            </div>
          </div>

          {/* Costs */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="text-sm font-semibold text-slate-900">비용 내역 (원)</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">식대비</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={form.costs.meal}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      costs: { ...form.costs, meal: Math.max(0, Number(e.target.value)) },
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">숙박비</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={form.costs.lodging}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      costs: { ...form.costs, lodging: Math.max(0, Number(e.target.value)) },
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">렌트비</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={form.costs.rental}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      costs: { ...form.costs, rental: Math.max(0, Number(e.target.value)) },
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Jig & Equipment */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="text-sm font-semibold text-slate-900">지그 및 설비 구분</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">지그</label>
                <input
                  type="text"
                  value={form.jig}
                  placeholder="예: O, 중량지그"
                  onChange={(e) => setForm({ ...form, jig: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">CO2 설비</label>
                <input
                  type="text"
                  value={form.equipment.co2}
                  placeholder="O 또는 내용"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      equipment: { ...form.equipment, co2: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">SPOT 설비</label>
                <input
                  type="text"
                  value={form.equipment.spot}
                  placeholder="O 또는 내용"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      equipment: { ...form.equipment, spot: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">LASER 설비</label>
                <input
                  type="text"
                  value={form.equipment.laser}
                  placeholder="O 또는 내용"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      equipment: { ...form.equipment, laser: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-600 mb-1">조립 & 검사</label>
                <input
                  type="text"
                  value={form.equipment.assemblyInspection}
                  placeholder="O 또는 내용"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      equipment: { ...form.equipment, assemblyInspection: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="pt-4 border-t border-slate-200">
            <label className="block text-xs font-medium text-slate-700 mb-1">비고</label>
            <textarea
              rows={2}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="특이사항 또는 변경 사유 입력"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </form>

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
            onClick={() => onSave(form)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md whitespace-nowrap"
          >
            일정 저장
          </button>
        </div>
      </div>
    </div>
  );
}
