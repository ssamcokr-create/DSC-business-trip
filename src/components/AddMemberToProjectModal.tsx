import React, { useState, useMemo } from 'react';
import { X, Users, Building2, UserPlus, Check } from 'lucide-react';
import {
  PersonType,
  Project,
  TeamMember,
  TripAssignment,
  TripStatus,
  VendorPerson,
} from '../types/trip';
import { generateId } from '../utils/dateUtils';

interface AddMemberToProjectModalProps {
  project: Project | null;
  teamMembers: TeamMember[];
  vendors: VendorPerson[];
  onClose: () => void;
  onAddAssignments: (
    newAssignments: TripAssignment[],
    saveNewTeamMember?: TeamMember,
    saveNewVendor?: VendorPerson
  ) => void;
}

type SourceMode = 'team' | 'vendor' | 'custom';

export function AddMemberToProjectModal({
  project,
  teamMembers,
  vendors,
  onClose,
  onAddAssignments,
}: AddMemberToProjectModalProps) {
  const [mode, setMode] = useState<SourceMode>('team');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [vendorCompanyFilter, setVendorCompanyFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Shared initial schedule for selected people
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');
  const [actualStartDate, setActualStartDate] = useState('');
  const [actualEndDate, setActualEndDate] = useState('');
  const [status, setStatus] = useState<TripStatus>('준비중');

  // Custom single entry fields
  const [customType, setCustomType] = useState<PersonType>('vendor');
  const [customCompany, setCustomCompany] = useState('');
  const [customName, setCustomName] = useState('');
  const [customTask, setCustomTask] = useState('');
  const [customCount, setCustomCount] = useState(1);
  const [alsoSaveToRoster, setAlsoSaveToRoster] = useState(true);

  const vendorCompanies = useMemo(() => {
    const set = new Set(vendors.map((v) => v.company));
    return Array.from(set).sort();
  }, [vendors]);

  const filteredTeam = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return teamMembers.filter(
      (m) =>
        m.active &&
        (!q ||
          m.name.toLowerCase().includes(q) ||
          m.defaultTask.toLowerCase().includes(q) ||
          m.position.toLowerCase().includes(q))
    );
  }, [teamMembers, searchTerm]);

  const filteredVendors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return vendors.filter((v) => {
      const matchCompany = vendorCompanyFilter === 'all' || v.company === vendorCompanyFilter;
      const matchQuery =
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.company.toLowerCase().includes(q) ||
        v.defaultTask.toLowerCase().includes(q);
      return matchCompany && matchQuery;
    });
  }, [vendors, vendorCompanyFilter, searchTerm]);

  if (!project) return null;

  const toggleTeam = (id: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleVendor = (id: string) => {
    setSelectedVendorIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasActual = Boolean(actualStartDate && actualEndDate);

    if (mode === 'team') {
      if (selectedTeamIds.length === 0) return;
      const created: TripAssignment[] = selectedTeamIds
        .map((id) => teamMembers.find((m) => m.id === id))
        .filter((m): m is TeamMember => Boolean(m))
        .map((m) => ({
          id: generateId('as'),
          projectId: project.id,
          personType: 'internal',
          teamMemberId: m.id,
          company: '디에스시',
          name: m.name,
          task: m.defaultTask,
          plannedHeadcount: 1,
          actualHeadcount: hasActual ? 1 : 0,
          plannedStartDate,
          plannedEndDate,
          actualStartDate,
          actualEndDate,
          status,
          costs: { meal: 0, lodging: 0, rental: 0 },
          jig: '',
          equipment: { co2: '', spot: '', laser: '', assemblyInspection: '' },
          note: '',
        }));
      onAddAssignments(created);
      return;
    }

    if (mode === 'vendor') {
      if (selectedVendorIds.length === 0) return;
      const created: TripAssignment[] = selectedVendorIds
        .map((id) => vendors.find((v) => v.id === id))
        .filter((v): v is VendorPerson => Boolean(v))
        .map((v) => ({
          id: generateId('as'),
          projectId: project.id,
          personType: 'vendor',
          vendorPersonId: v.id,
          company: v.company,
          name: v.name,
          task: v.defaultTask,
          plannedHeadcount: 1,
          actualHeadcount: hasActual ? 1 : 0,
          plannedStartDate,
          plannedEndDate,
          actualStartDate,
          actualEndDate,
          status,
          costs: { meal: 0, lodging: 0, rental: 0 },
          jig: '',
          equipment: { co2: '', spot: '', laser: '', assemblyInspection: '' },
          note: '',
        }));
      onAddAssignments(created);
      return;
    }

    // Custom entry mode
    const finalCompany = customType === 'internal' ? '디에스시' : customCompany.trim();
    const finalName = customName.trim() || '미정';
    if (!finalCompany) return;

    let newTeamMember: TeamMember | undefined;
    let newVendor: VendorPerson | undefined;

    if (alsoSaveToRoster && finalName !== '미정') {
      if (customType === 'internal') {
        newTeamMember = {
          id: generateId('tm'),
          name: finalName,
          position: '연구원',
          defaultTask: customTask.trim(),
          phone: '',
          active: true,
          note: '',
        };
      } else {
        newVendor = {
          id: generateId('vp'),
          company: finalCompany,
          name: finalName,
          defaultTask: customTask.trim(),
          specialty: '',
          phone: '',
          note: '',
        };
      }
    }

    const repeatCount = Math.max(1, Math.min(20, customCount));
    const created: TripAssignment[] = Array.from({ length: repeatCount }).map(() => ({
      id: generateId('as'),
      projectId: project.id,
      personType: customType,
      teamMemberId: newTeamMember?.id,
      vendorPersonId: newVendor?.id,
      company: finalCompany,
      name: finalName,
      task: customTask.trim(),
      plannedHeadcount: 1,
      actualHeadcount: hasActual ? 1 : 0,
      plannedStartDate,
      plannedEndDate,
      actualStartDate,
      actualEndDate,
      status,
      costs: { meal: 0, lodging: 0, rental: 0 },
      jig: '',
      equipment: { co2: '', spot: '', laser: '', assemblyInspection: '' },
      note: '',
    }));

    onAddAssignments(created, newTeamMember, newVendor);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-member-modal-title"
        className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="add-member-modal-title" className="text-base font-bold text-slate-900">
              프로젝트 인원 추가
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {project.year} · {project.vehicleModel} {project.stage} · {project.destination}
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

        {/* Mode selector */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-100 bg-slate-50/70">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode('team');
                setSearchTerm('');
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                mode === 'team'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>선행기술팀 인원</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('vendor');
                setSearchTerm('');
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                mode === 'vendor'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>협력업체 인원</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('custom')}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                mode === 'custom'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>직접 신규 입력</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {mode !== 'custom' ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    mode === 'team'
                      ? '성명 또는 담당업무 검색...'
                      : '업체명, 성명 또는 담당업무 검색...'
                  }
                  className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {mode === 'vendor' && (
                  <select
                    value={vendorCompanyFilter}
                    onChange={(e) => setVendorCompanyFilter(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="all">전체 업체</option>
                    {vendorCompanies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {mode === 'team' ? (
                  filteredTeam.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      선택 가능한 선행기술팀 인원이 없습니다.
                    </div>
                  ) : (
                    filteredTeam.map((m) => {
                      const checked = selectedTeamIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleTeam(m.id)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
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
                              <div className="text-sm font-medium text-slate-900 truncate">
                                {m.name}{' '}
                                <span className="text-xs font-normal text-slate-500">
                                  · {m.position}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 truncate">{m.defaultTask}</div>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 shrink-0 ml-2">디에스시</span>
                        </button>
                      );
                    })
                  )
                ) : filteredVendors.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    조건에 맞는 협력업체 인원이 없습니다.
                  </div>
                ) : (
                  filteredVendors.map((v) => {
                    const checked = selectedVendorIds.includes(v.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => toggleVendor(v.id)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
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
                            <div className="text-sm font-medium text-slate-900 truncate">
                              {v.company}{' '}
                              <span className="text-slate-700 font-semibold">· {v.name}</span>
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {v.defaultTask}
                              {v.specialty ? ` · ${v.specialty}` : ''}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              <div className="text-xs text-slate-500">
                선택됨:{' '}
                <span className="font-mono-num font-semibold text-blue-700">
                  {mode === 'team' ? selectedTeamIds.length : selectedVendorIds.length}명
                </span>{' '}
                (중복 선택하여 일괄 추가 가능)
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">구분</label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as PersonType)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
                  >
                    <option value="internal">선행기술팀 (디에스시)</option>
                    <option value="vendor">협력업체 인원</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    소속 / 업체명
                  </label>
                  <input
                    type="text"
                    required
                    disabled={customType === 'internal'}
                    value={customType === 'internal' ? '디에스시' : customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    placeholder="예: 누리ECS, 다올이엔지"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    성명 (비워두면 미정)
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="성명 또는 미정"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    추가 인원 수 (동일 조건 복제)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={customCount}
                    onChange={(e) => setCustomCount(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-md"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">담당업무</label>
                  <input
                    type="text"
                    value={customTask}
                    onChange={(e) => setCustomTask(e.target.value)}
                    placeholder="예: 부스 셋업, PLC 배선"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                  />
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alsoSaveToRoster}
                  onChange={(e) => setAlsoSaveToRoster(e.target.checked)}
                  className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                />
                <span>명단 관리(선행기술팀/협력업체)에도 함께 저장 (미정 제외)</span>
              </label>
            </div>
          )}

          {/* Common initial schedule inputs */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="text-xs font-semibold text-slate-800">
              초기 출장 일정 및 상태 설정 (추후 개인별 수정 가능)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">상태</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TripStatus)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
                >
                  <option value="준비중">준비중</option>
                  <option value="출장중">출장중</option>
                  <option value="완료">완료</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">계획 시작일</label>
                <input
                  type="date"
                  value={plannedStartDate}
                  onChange={(e) => setPlannedStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">계획 종료일</label>
                <input
                  type="date"
                  value={plannedEndDate}
                  min={plannedStartDate || undefined}
                  onChange={(e) => setPlannedEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-md"
                />
              </div>
              <div className="sm:col-start-2">
                <label className="block text-xs text-slate-600 mb-1">실적 시작일 (선택)</label>
                <input
                  type="date"
                  value={actualStartDate}
                  onChange={(e) => setActualStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">실적 종료일 (선택)</label>
                <input
                  type="date"
                  value={actualEndDate}
                  min={actualStartDate || undefined}
                  onChange={(e) => setActualEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-md"
                />
              </div>
            </div>
          </div>

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
              disabled={
                (mode === 'team' && selectedTeamIds.length === 0) ||
                (mode === 'vendor' && selectedVendorIds.length === 0) ||
                (mode === 'custom' && customType === 'vendor' && !customCompany.trim())
              }
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 rounded-md whitespace-nowrap"
            >
              프로젝트에 추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
