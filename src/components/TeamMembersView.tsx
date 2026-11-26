import React, { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { Project, TeamMember, TripAssignment } from '../types/trip';
import { calculateTripDays, generateId } from '../utils/dateUtils';

interface TeamMembersViewProps {
  teamMembers: TeamMember[];
  projects: Project[];
  assignments: TripAssignment[];
  onSaveMember: (member: TeamMember, isNew: boolean) => void;
  onDeleteMember: (memberId: string) => void;
  onNavigateToProject: (projectId: string) => void;
}

export function TeamMembersView({
  teamMembers,
  projects,
  assignments,
  onSaveMember,
  onDeleteMember,
  onNavigateToProject,
}: TeamMembersViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [defaultTask, setDefaultTask] = useState('');
  const [phone, setPhone] = useState('');
  const [active, setActive] = useState(true);
  const [note, setNote] = useState('');

  const projectMap = useMemo(() => {
    const m = new Map<string, Project>();
    projects.forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  const openAdd = () => {
    setEditingMember(null);
    setName('');
    setPosition('선임연구원');
    setDefaultTask('');
    setPhone('');
    setActive(true);
    setNote('');
    setModalOpen(true);
  };

  const openEdit = (m: TeamMember) => {
    setEditingMember(m);
    setName(m.name);
    setPosition(m.position);
    setDefaultTask(m.defaultTask);
    setPhone(m.phone);
    setActive(m.active);
    setNote(m.note);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const member: TeamMember = {
      id: editingMember ? editingMember.id : generateId('tm'),
      name: name.trim(),
      position: position.trim() || '연구원',
      defaultTask: defaultTask.trim(),
      phone: phone.trim(),
      active,
      note: note.trim(),
    };
    onSaveMember(member, !editingMember);
    setModalOpen(false);
  };

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return teamMembers.filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.position.toLowerCase().includes(q) ||
        m.defaultTask.toLowerCase().includes(q)
    );
  }, [teamMembers, searchQuery]);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            DSC 선행기술팀 인원 관리
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            선행기술팀(디에스시) 소속 인원을 추가·수정·삭제하고 개인별 누적 출장 현황을 확인합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="성명, 직급, 담당업무 검색"
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md w-52 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>팀원 추가</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 whitespace-nowrap">성명</th>
                <th className="py-3 px-4 whitespace-nowrap">직급 / 직책</th>
                <th className="py-3 px-4 whitespace-nowrap">주 담당업무</th>
                <th className="py-3 px-4 whitespace-nowrap">연락처</th>
                <th className="py-3 px-4 whitespace-nowrap">배정 프로젝트</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">누적 계획 / 실적</th>
                <th className="py-3 px-4 whitespace-nowrap">비고</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-slate-500">
                    등록된 선행기술팀 인원이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const trips = assignments.filter(
                    (a) =>
                      a.personType === 'internal' &&
                      (a.teamMemberId === member.id || a.name === member.name)
                  );
                  const plannedDays = trips.reduce(
                    (sum, t) => sum + calculateTripDays(t.plannedStartDate, t.plannedEndDate),
                    0
                  );
                  const actualDays = trips.reduce(
                    (sum, t) => sum + calculateTripDays(t.actualStartDate, t.actualEndDate),
                    0
                  );

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{member.name}</div>
                        {!member.active && (
                          <span className="text-[11px] text-slate-400">비활성</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                        {member.position}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                        {member.defaultTask || '-'}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono-num text-slate-600 whitespace-nowrap">
                        {member.phone || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {trips.length === 0 ? (
                          <span className="text-xs text-slate-400">-</span>
                        ) : (
                          <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
                            {trips.map((t) => {
                              const p = projectMap.get(t.projectId);
                              if (!p) return null;
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => onNavigateToProject(p.id)}
                                  className="text-blue-700 hover:underline whitespace-nowrap"
                                >
                                  {p.vehicleModel} {p.stage}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-mono-num whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{plannedDays}일</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="font-semibold text-blue-700">{actualDays}일</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 max-w-[180px] truncate">
                        {member.note || '-'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(member)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                            title="수정"
                            aria-label="팀원 수정"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteMember(member.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded"
                            title="삭제"
                            aria-label="팀원 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="fixed inset-0" onClick={() => setModalOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-modal-title"
            className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 id="team-modal-title" className="text-base font-bold text-slate-900">
                {editingMember ? '선행기술팀 인원 수정' : '선행기술팀 인원 추가'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">성명</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">직급 / 직책</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="예: 책임연구원, 선임연구원"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">주 담당업무</label>
                <input
                  type="text"
                  value={defaultTask}
                  onChange={(e) => setDefaultTask(e.target.value)}
                  placeholder="예: 셋업총괄, ROBOT 티칭 및 시운전"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">연락처</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">비고</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                />
                <span>활성 인원 (프로젝트 배정 목록에 표시)</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md"
                >
                  {editingMember ? '수정 저장' : '인원 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
