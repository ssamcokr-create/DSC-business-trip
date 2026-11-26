import { useMemo, useState } from 'react';
import {
  Plus,
  Copy,
  Pencil,
  Trash2,
  Search,
  UserPlus,
  CalendarClock,
} from 'lucide-react';
import { Project, TripAssignment, TripStatus } from '../types/trip';
import {
  calculateTripDays,
  formatCurrencyKRW,
  formatDateRangeCompact,
} from '../utils/dateUtils';
import { StatusCell } from './StatusCell';

interface ProjectScheduleViewProps {
  projects: Project[];
  assignments: TripAssignment[];
  selectedYear: number | 'all';
  focusedProjectId?: string | null;
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onOpenAddMember: (project: Project) => void;
  onEditAssignment: (assignment: TripAssignment) => void;
  onCopyAssignment: (assignment: TripAssignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onQuickStatusChange: (assignmentId: string, status: TripStatus) => void;
}

export function ProjectScheduleView({
  projects,
  assignments,
  selectedYear,
  focusedProjectId,
  onAddProject,
  onEditProject,
  onDeleteProject,
  onOpenAddMember,
  onEditAssignment,
  onCopyAssignment,
  onDeleteAssignment,
  onQuickStatusChange,
}: ProjectScheduleViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TripStatus>('all');
  const [onlyInternal, setOnlyInternal] = useState(false);

  const sortedProjects = useMemo(() => {
    return [...projects]
      .filter((p) => selectedYear === 'all' || p.year === selectedYear)
      .sort((a, b) => a.year - b.year || a.order - b.order);
  }, [projects, selectedYear]);

  // Group projects by year to render year separator bands (e.g. 2026, 2027)
  const groupedByYear = useMemo(() => {
    const groups: Array<{ year: number; items: Project[] }> = [];
    for (const p of sortedProjects) {
      let group = groups.find((g) => g.year === p.year);
      if (!group) {
        group = { year: p.year, items: [] };
        groups.push(group);
      }
      group.items.push(p);
    }
    return groups;
  }, [sortedProjects]);

  const filterAssignment = (a: TripAssignment, p: Project) => {
    if (onlyInternal && a.personType !== 'internal') return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      a.company.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.task.toLowerCase().includes(q) ||
      p.vehicleModel.toLowerCase().includes(q) ||
      p.destination.toLowerCase().includes(q) ||
      p.stage.toLowerCase().includes(q)
    );
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="차종, 출장지, 업체, 성명, 업무 검색"
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md w-60 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['all', '준비중', '출장중', '완료'] as Array<'all' | TripStatus>).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'all' ? '전체 상태' : st}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyInternal}
              onChange={(e) => setOnlyInternal(e.target.checked)}
              className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
            />
            <span>선행기술팀(디에스시)만 보기</span>
          </label>
        </div>

        <button
          type="button"
          onClick={onAddProject}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>새 프로젝트 추가</span>
        </button>
      </div>

      {/* Empty state if no projects */}
      {groupedByYear.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <div className="text-sm font-semibold text-slate-800">
            등록된 프로젝트가 없습니다
          </div>
          <p className="text-xs text-slate-500 mt-1">
            새 프로젝트를 생성하고 선행기술팀 및 협력업체 출장 인원을 추가하세요.
          </p>
          <button
            type="button"
            onClick={onAddProject}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>첫 프로젝트 추가</span>
          </button>
        </div>
      ) : (
        groupedByYear.map((group) => (
          <div key={group.year} className="space-y-4">
            {/* Year divider banner */}
            <div className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center justify-between">
              <span className="font-mono-num text-sm font-bold tracking-wide">
                {group.year}년 해외출장 프로젝트
              </span>
              <span className="text-xs text-slate-300 font-mono-num">
                {group.items.length}개 프로젝트
              </span>
            </div>

            {group.items.map((project) => {
              const allProjectRows = assignments.filter((a) => a.projectId === project.id);
              const rows = allProjectRows.filter((a) => filterAssignment(a, project));

              // If search/filter is active and 0 rows match (unless no filter active, show empty project so user can add)
              const hasActiveFilter =
                Boolean(searchQuery.trim()) || statusFilter !== 'all' || onlyInternal;
              if (hasActiveFilter && rows.length === 0) return null;

              // Calculate subtotals (소계)
              let subPlannedHeadcount = 0;
              let subActualHeadcount = 0;
              let subPlannedDays = 0;
              let subActualDays = 0;
              let subPreparing = 0;
              let subActive = 0;
              let subCompleted = 0;
              let subTotalCost = 0;

              for (const r of rows) {
                subPlannedHeadcount += r.plannedHeadcount;
                subActualHeadcount += r.actualHeadcount;
                subPlannedDays += calculateTripDays(r.plannedStartDate, r.plannedEndDate);
                subActualDays += calculateTripDays(r.actualStartDate, r.actualEndDate);
                if (r.status === '준비중') subPreparing += 1;
                else if (r.status === '출장중') subActive += 1;
                else if (r.status === '완료') subCompleted += 1;
                subTotalCost += r.costs.meal + r.costs.lodging + r.costs.rental;
              }
              const subDiff = subActualDays - subPlannedDays;
              const isFocused = focusedProjectId === project.id;

              return (
                <section
                  key={project.id}
                  id={`project-${project.id}`}
                  className={`bg-white border rounded-lg overflow-hidden ${
                    isFocused ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'
                  }`}
                >
                  {/* Project Header Bar */}
                  <div className="px-4 py-3 bg-slate-800 text-white flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 min-w-0">
                      <div className="text-sm font-bold text-amber-300 whitespace-nowrap">
                        {project.vehicleModel} {project.stage}
                      </div>
                      <span className="text-slate-400 text-xs">·</span>
                      <div className="text-sm font-medium text-slate-100 whitespace-nowrap">
                        {project.destination}
                      </div>
                      <span className="text-slate-400 text-xs">·</span>
                      <div className="text-xs text-slate-300 font-mono-num whitespace-nowrap">
                        총 {rows.length}명 (준비 {subPreparing} / 출장중 {subActive} / 완료 {subCompleted})
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenAddMember(project)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors whitespace-nowrap"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>인원 추가</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditProject(project)}
                        className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                        title="프로젝트 정보 수정"
                        aria-label="프로젝트 정보 수정"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProject(project.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-300 hover:bg-slate-700 rounded-md transition-colors"
                        title="프로젝트 삭제"
                        aria-label="프로젝트 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Spreadsheet Table */}
                  <div className="overflow-x-auto schedule-scroll">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                          <th className="py-2 px-3 whitespace-nowrap">소속 / 업체</th>
                          <th className="py-2 px-3 whitespace-nowrap">성명</th>
                          <th className="py-2 px-3 whitespace-nowrap min-w-[170px]">담당업무</th>
                          <th className="py-2 px-2 text-center whitespace-nowrap">인원(계획/실적)</th>
                          <th className="py-2 px-3 whitespace-nowrap">출장기간 (계획)</th>
                          <th className="py-2 px-2 text-right whitespace-nowrap">계획일</th>
                          <th className="py-2 px-3 whitespace-nowrap">출장기간 (실적)</th>
                          <th className="py-2 px-2 text-right whitespace-nowrap">실적일</th>
                          <th className="py-2 px-3 text-center whitespace-nowrap">상태</th>
                          <th className="py-2 px-3 text-right whitespace-nowrap">비용 합계</th>
                          <th className="py-2 px-3 whitespace-nowrap">지그 / 설비</th>
                          <th className="py-2 px-3 whitespace-nowrap min-w-[100px]">비고</th>
                          <th className="py-2 px-3 text-right whitespace-nowrap">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.length === 0 ? (
                          <tr>
                            <td colSpan={13} className="py-8 text-center text-slate-500">
                              배정된 인원이 없습니다. 우측 상단 <span className="font-semibold text-blue-700">인원 추가</span> 버튼을 눌러 팀원 또는 협력업체를 추가하세요.
                            </td>
                          </tr>
                        ) : (
                          rows.map((row) => {
                            const pDays = calculateTripDays(
                              row.plannedStartDate,
                              row.plannedEndDate
                            );
                            const aDays = calculateTripDays(
                              row.actualStartDate,
                              row.actualEndDate
                            );
                            const totalCost =
                              row.costs.meal + row.costs.lodging + row.costs.rental;
                            const equipList = [
                              row.jig ? `지그(${row.jig})` : '',
                              row.equipment.co2 ? `CO2` : '',
                              row.equipment.spot ? `SPOT` : '',
                              row.equipment.laser ? `LASER` : '',
                              row.equipment.assemblyInspection ? `조립&검사` : '',
                            ].filter(Boolean);

                            const nextStatusMap: Record<TripStatus, TripStatus> = {
                              준비중: '출장중',
                              출장중: '완료',
                              완료: '준비중',
                            };

                            return (
                              <tr
                                key={row.id}
                                className={`hover:bg-blue-50/40 transition-colors ${
                                  row.personType === 'internal' ? 'bg-slate-50/40' : 'bg-white'
                                }`}
                              >
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span
                                    className={
                                      row.personType === 'internal'
                                        ? 'font-bold text-slate-900'
                                        : 'font-medium text-slate-700'
                                    }
                                  >
                                    {row.company}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span
                                    className={
                                      row.name === '미정'
                                        ? 'text-slate-400 font-medium'
                                        : 'font-semibold text-slate-900'
                                    }
                                  >
                                    {row.name}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-700">{row.task || '-'}</td>
                                <td className="py-2.5 px-2 text-center font-mono-num whitespace-nowrap">
                                  <span className="text-slate-900 font-medium">
                                    {row.plannedHeadcount}
                                  </span>
                                  <span className="text-slate-400 mx-1">/</span>
                                  <span className="text-blue-700 font-medium">
                                    {row.actualHeadcount || '-'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono-num whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => onEditAssignment(row)}
                                    className="text-left text-slate-800 hover:text-blue-700 hover:underline"
                                    title="클릭하여 계획일정 수정"
                                  >
                                    {formatDateRangeCompact(
                                      row.plannedStartDate,
                                      row.plannedEndDate
                                    )}
                                  </button>
                                </td>
                                <td className="py-2.5 px-2 text-right font-mono-num font-semibold text-slate-900 whitespace-nowrap">
                                  {pDays > 0 ? pDays : 0}
                                </td>
                                <td className="py-2.5 px-3 font-mono-num whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => onEditAssignment(row)}
                                    className="text-left text-slate-700 hover:text-blue-700 hover:underline"
                                    title="클릭하여 실적일정 입력"
                                  >
                                    {formatDateRangeCompact(
                                      row.actualStartDate,
                                      row.actualEndDate
                                    )}
                                  </button>
                                </td>
                                <td className="py-2.5 px-2 text-right font-mono-num font-semibold text-blue-700 whitespace-nowrap">
                                  {aDays > 0 ? aDays : 0}
                                </td>
                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onQuickStatusChange(row.id, nextStatusMap[row.status])
                                    }
                                    title="클릭하여 상태 전환 (준비중 → 출장중 → 완료)"
                                    className="cursor-pointer hover:opacity-85 transition-opacity"
                                  >
                                    <StatusCell status={row.status} compact />
                                  </button>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono-num text-slate-700 whitespace-nowrap">
                                  {totalCost > 0 ? `${formatCurrencyKRW(totalCost)}원` : '-'}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                  {equipList.length > 0 ? equipList.join(', ') : '-'}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 max-w-[160px] truncate" title={row.note}>
                                  {row.note || '-'}
                                </td>
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => onEditAssignment(row)}
                                      className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                                      title="계획·실적 일정 및 상세 편집"
                                      aria-label="일정 편집"
                                    >
                                      <CalendarClock className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onCopyAssignment(row)}
                                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                                      title="이 행 내용 복사하여 추가"
                                      aria-label="행 복사"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onDeleteAssignment(row.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded"
                                      title="삭제"
                                      aria-label="행 삭제"
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
                      {rows.length > 0 && (
                        <tfoot>
                          <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-semibold text-slate-900">
                            <td colSpan={3} className="py-2.5 px-3 text-center tracking-wide">
                              소계 ({rows.length}명)
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono-num whitespace-nowrap">
                              {subPlannedHeadcount} / {subActualHeadcount || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">계획 합계</td>
                            <td className="py-2.5 px-2 text-right font-mono-num">
                              {subPlannedDays}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">실적 합계</td>
                            <td className="py-2.5 px-2 text-right font-mono-num text-blue-700">
                              {subActualDays}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono-num text-[11px] whitespace-nowrap">
                              {subPreparing}/{subActive}/{subCompleted}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono-num whitespace-nowrap">
                              {subTotalCost > 0 ? `${formatCurrencyKRW(subTotalCost)}원` : '-'}
                            </td>
                            <td colSpan={3} className="py-2.5 px-3 text-xs font-mono-num">
                              <span
                                className={
                                  subDiff > 0
                                    ? 'text-rose-700'
                                    : subDiff < 0
                                      ? 'text-sky-700'
                                      : 'text-slate-600'
                                }
                              >
                                {subDiff > 0 ? `+${subDiff}` : subDiff}일 (계획대비 출장일 증감)
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </section>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
