import { useMemo, useState } from 'react';
import { Calendar, ArrowUpRight, Search } from 'lucide-react';
import { Project, TeamMember, TripAssignment, TripStatus } from '../types/trip';
import {
  calculateTripDays,
  formatDateRangeCompact,
  parseLocalDate,
} from '../utils/dateUtils';
import { StatusCell } from './StatusCell';

interface DashboardViewProps {
  projects: Project[];
  teamMembers: TeamMember[];
  assignments: TripAssignment[];
  selectedYear: number | 'all';
  onEditAssignment: (assignment: TripAssignment) => void;
  onNavigateToProjects: (projectId?: string) => void;
}

type MemberFilterStatus = 'all' | TripStatus | '대기';

export function DashboardView({
  projects,
  teamMembers,
  assignments,
  selectedYear,
  onEditAssignment,
  onNavigateToProjects,
}: DashboardViewProps) {
  const [memberFilter, setMemberFilter] = useState<MemberFilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [timelineRange, setTimelineRange] = useState<'2026-Q4' | '2027-Q1'>('2026-Q4');

  const visibleProjectIds = useMemo(() => {
    return new Set(
      projects
        .filter((p) => selectedYear === 'all' || p.year === selectedYear)
        .map((p) => p.id)
    );
  }, [projects, selectedYear]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => visibleProjectIds.has(a.projectId));
  }, [assignments, visibleProjectIds]);

  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  // Overall KPIs (all personnel + internal DSC breakdown)
  const kpi = useMemo(() => {
    let plannedHeadcount = 0;
    let actualHeadcount = 0;
    let plannedDays = 0;
    let actualDays = 0;
    let preparingCount = 0;
    let activeCount = 0;
    let completedCount = 0;
    let internalPlannedDays = 0;
    let internalActualDays = 0;

    for (const a of filteredAssignments) {
      plannedHeadcount += a.plannedHeadcount;
      actualHeadcount += a.actualHeadcount;
      const pDays = calculateTripDays(a.plannedStartDate, a.plannedEndDate);
      const aDays = calculateTripDays(a.actualStartDate, a.actualEndDate);
      plannedDays += pDays;
      actualDays += aDays;
      if (a.personType === 'internal') {
        internalPlannedDays += pDays;
        internalActualDays += aDays;
      }
      if (a.status === '준비중') preparingCount += 1;
      else if (a.status === '출장중') activeCount += 1;
      else if (a.status === '완료') completedCount += 1;
    }

    return {
      totalRows: filteredAssignments.length,
      plannedHeadcount,
      actualHeadcount,
      plannedDays,
      actualDays,
      diffDays: actualDays - plannedDays,
      preparingCount,
      activeCount,
      completedCount,
      internalPlannedDays,
      internalActualDays,
    };
  }, [filteredAssignments]);

  // Per-DSC-member summary
  const memberSummaries = useMemo(() => {
    return teamMembers.map((member) => {
      const memberTrips = filteredAssignments.filter(
        (a) =>
          a.personType === 'internal' &&
          (a.teamMemberId === member.id || a.name === member.name)
      );

      let plannedDays = 0;
      let actualDays = 0;
      let hasActive = false;
      let hasPreparing = false;
      let hasCompleted = false;

      for (const t of memberTrips) {
        plannedDays += calculateTripDays(t.plannedStartDate, t.plannedEndDate);
        actualDays += calculateTripDays(t.actualStartDate, t.actualEndDate);
        if (t.status === '출장중') hasActive = true;
        else if (t.status === '준비중') hasPreparing = true;
        else if (t.status === '완료') hasCompleted = true;
      }

      const currentStatus: TripStatus | '대기' = hasActive
        ? '출장중'
        : hasPreparing
          ? '준비중'
          : hasCompleted
            ? '완료'
            : '대기';

      // Primary focus trip: active first, then preparing, then latest completed
      const primaryTrip =
        memberTrips.find((t) => t.status === '출장중') ||
        memberTrips.find((t) => t.status === '준비중') ||
        memberTrips[memberTrips.length - 1] ||
        null;

      return {
        member,
        trips: memberTrips,
        primaryTrip,
        primaryProject: primaryTrip ? projectMap.get(primaryTrip.projectId) || null : null,
        plannedDays,
        actualDays,
        currentStatus,
      };
    });
  }, [teamMembers, filteredAssignments, projectMap]);

  const filteredMemberSummaries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return memberSummaries.filter((item) => {
      const matchStatus = memberFilter === 'all' || item.currentStatus === memberFilter;
      const matchQuery =
        !q ||
        item.member.name.toLowerCase().includes(q) ||
        item.member.defaultTask.toLowerCase().includes(q) ||
        (item.primaryProject &&
          `${item.primaryProject.vehicleModel} ${item.primaryProject.destination}`
            .toLowerCase()
            .includes(q));
      return matchStatus && matchQuery;
    });
  }, [memberSummaries, memberFilter, searchQuery]);

  // Destination & Project summary
  const destinationStats = useMemo(() => {
    const map = new Map<
      string,
      {
        destination: string;
        totalPeople: number;
        internalPeople: number;
        activeCount: number;
        preparingCount: number;
        completedCount: number;
        plannedDays: number;
      }
    >();

    for (const a of filteredAssignments) {
      const prj = projectMap.get(a.projectId);
      if (!prj) continue;
      const key = prj.destination;
      const entry = map.get(key) || {
        destination: key,
        totalPeople: 0,
        internalPeople: 0,
        activeCount: 0,
        preparingCount: 0,
        completedCount: 0,
        plannedDays: 0,
      };
      entry.totalPeople += 1;
      if (a.personType === 'internal') entry.internalPeople += 1;
      if (a.status === '출장중') entry.activeCount += 1;
      if (a.status === '준비중') entry.preparingCount += 1;
      if (a.status === '완료') entry.completedCount += 1;
      entry.plannedDays += calculateTripDays(a.plannedStartDate, a.plannedEndDate);
      map.set(key, entry);
    }

    return Array.from(map.values()).sort((a, b) => b.totalPeople - a.totalPeople);
  }, [filteredAssignments, projectMap]);

  // Timeline window calculation (Oct 1, 2026 - Jan 31, 2027 OR Dec 1, 2026 - Mar 31, 2027)
  const timelineWindow = useMemo(() => {
    const start =
      timelineRange === '2026-Q4' ? new Date(2026, 9, 1) : new Date(2026, 11, 1);
    const end =
      timelineRange === '2026-Q4' ? new Date(2027, 0, 31) : new Date(2027, 2, 31);
    const totalMs = end.getTime() - start.getTime();
    const months =
      timelineRange === '2026-Q4'
        ? [
            { label: '2026.10', start: new Date(2026, 9, 1), end: new Date(2026, 10, 1) },
            { label: '2026.11', start: new Date(2026, 10, 1), end: new Date(2026, 11, 1) },
            { label: '2026.12', start: new Date(2026, 11, 1), end: new Date(2027, 0, 1) },
            { label: '2027.01', start: new Date(2027, 0, 1), end: new Date(2027, 1, 1) },
          ]
        : [
            { label: '2026.12', start: new Date(2026, 11, 1), end: new Date(2027, 0, 1) },
            { label: '2027.01', start: new Date(2027, 0, 1), end: new Date(2027, 1, 1) },
            { label: '2027.02', start: new Date(2027, 1, 1), end: new Date(2027, 2, 1) },
            { label: '2027.03', start: new Date(2027, 2, 1), end: new Date(2027, 3, 1) },
          ];
    return { start, end, totalMs, months };
  }, [timelineRange]);

  const computeBarPercent = (sStr: string, eStr: string) => {
    const s = parseLocalDate(sStr);
    const e = parseLocalDate(eStr);
    if (!s || !e) return null;
    const wStart = timelineWindow.start.getTime();
    const wEnd = timelineWindow.end.getTime();
    const sTime = Math.max(wStart, s.getTime());
    const eTime = Math.min(wEnd, e.getTime() + 86400000);
    if (eTime <= wStart || sTime >= wEnd || eTime <= sTime) return null;
    const left = ((sTime - wStart) / timelineWindow.totalMs) * 100;
    const width = ((eTime - sTime) / timelineWindow.totalMs) * 100;
    return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
  };

  const todayMarkerLeft = useMemo(() => {
    const today = new Date(2026, 10, 25); // 2026-11-25
    const t = today.getTime();
    const wStart = timelineWindow.start.getTime();
    const wEnd = timelineWindow.end.getTime();
    if (t < wStart || t > wEnd) return null;
    return `${((t - wStart) / timelineWindow.totalMs) * 100}%`;
  }, [timelineWindow]);

  return (
    <div className="space-y-6">
      {/* Top 6-column KPI strip */}
      <section aria-label="핵심 요약 지표" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">출장 인원 (계획 / 실적)</div>
          <div className="mt-2 flex items-baseline gap-1.5 font-mono-num">
            <span className="text-2xl font-bold text-slate-900">{kpi.plannedHeadcount}</span>
            <span className="text-sm text-slate-400">/</span>
            <span className="text-lg font-semibold text-blue-700">{kpi.actualHeadcount}</span>
            <span className="text-xs text-slate-500 ml-0.5">명</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono-num">
            총 배정 행 {kpi.totalRows}건
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">총 출장일수 (계획)</div>
          <div className="mt-2 flex items-baseline gap-1 font-mono-num">
            <span className="text-2xl font-bold text-slate-900">
              {kpi.plannedDays.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">일</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono-num">
            선행기술팀 {kpi.internalPlannedDays.toLocaleString()}일
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">총 출장일수 (실적)</div>
          <div className="mt-2 flex items-baseline gap-1 font-mono-num">
            <span className="text-2xl font-bold text-slate-900">
              {kpi.actualDays.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">일</span>
          </div>
          <div className="mt-1 text-[11px] font-mono-num text-slate-500">
            계획대비{' '}
            <span className={kpi.diffDays >= 0 ? 'text-slate-700' : 'text-sky-700'}>
              {kpi.diffDays > 0 ? `+${kpi.diffDays}` : kpi.diffDays}일
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">출장중 (진행)</div>
          <div className="mt-2 flex items-baseline gap-1 font-mono-num">
            <span className="text-2xl font-bold text-emerald-700">{kpi.activeCount}</span>
            <span className="text-xs text-slate-500">명</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            선행기술팀 {memberSummaries.filter((m) => m.currentStatus === '출장중').length}명 파견중
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">준비중 (예정)</div>
          <div className="mt-2 flex items-baseline gap-1 font-mono-num">
            <span className="text-2xl font-bold text-amber-600">{kpi.preparingCount}</span>
            <span className="text-xs text-slate-500">명</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            선행기술팀 {memberSummaries.filter((m) => m.currentStatus === '준비중').length}명 예정
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500">완료 (복귀)</div>
          <div className="mt-2 flex items-baseline gap-1 font-mono-num">
            <span className="text-2xl font-bold text-sky-600">{kpi.completedCount}</span>
            <span className="text-xs text-slate-500">명</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            실적 정산 및 복귀 완료
          </div>
        </div>
      </section>

      {/* Main Team Member Overseas Trip Status Table */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              선행기술팀 인원 전체 해외출장 현황
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              소속 인원별 현재 출장 상태, 배정 프로젝트, 계획·실적 출장일수를 한눈에 확인하고 일정을 수정할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이름, 업무, 출장지 검색"
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md w-48 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['all', '출장중', '준비중', '완료', '대기'] as MemberFilterStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setMemberFilter(st)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    memberFilter === st
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'all' ? '전체' : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                <th className="py-2.5 px-4 whitespace-nowrap">성명 / 직급</th>
                <th className="py-2.5 px-4 whitespace-nowrap">주 담당업무</th>
                <th className="py-2.5 px-4 whitespace-nowrap">현재 상태</th>
                <th className="py-2.5 px-4 whitespace-nowrap">배정 프로젝트 및 출장지</th>
                <th className="py-2.5 px-4 whitespace-nowrap">계획일정</th>
                <th className="py-2.5 px-4 whitespace-nowrap">실적일정</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">계획 / 실적 일수</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredMemberSummaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-slate-500">
                    조건에 해당하는 선행기술팀 인원이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredMemberSummaries.map(
                  ({ member, trips, primaryTrip, primaryProject, plannedDays, actualDays, currentStatus }) => (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{member.name}</div>
                        <div className="text-xs text-slate-500">{member.position}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                        {primaryTrip?.task || member.defaultTask || '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {currentStatus === '대기' ? (
                          <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            일정없음
                          </span>
                        ) : (
                          <StatusCell status={currentStatus} />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {trips.length === 0 ? (
                          <span className="text-xs text-slate-400">배정된 해외출장 없음</span>
                        ) : (
                          <div className="space-y-1">
                            {trips.map((t) => {
                              const p = projectMap.get(t.projectId);
                              if (!p) return null;
                              return (
                                <div key={t.id} className="flex items-center gap-1.5 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => onNavigateToProjects(p.id)}
                                    className="font-medium text-slate-900 hover:text-blue-700 hover:underline whitespace-nowrap"
                                  >
                                    {p.vehicleModel} {p.stage}
                                  </button>
                                  <span className="text-slate-400">·</span>
                                  <span className="text-slate-600 whitespace-nowrap">{p.destination}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono-num text-xs text-slate-700 whitespace-nowrap">
                        {primaryTrip
                          ? formatDateRangeCompact(
                              primaryTrip.plannedStartDate,
                              primaryTrip.plannedEndDate
                            )
                          : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono-num text-xs text-slate-700 whitespace-nowrap">
                        {primaryTrip
                          ? formatDateRangeCompact(
                              primaryTrip.actualStartDate,
                              primaryTrip.actualEndDate
                            )
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-900">
                          {plannedDays}일 <span className="text-slate-400 font-normal">/</span>{' '}
                          <span className="text-blue-700">{actualDays}일</span>
                        </div>
                        <div className="mt-1 w-24 ml-auto h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{
                              width:
                                plannedDays > 0
                                  ? `${Math.min(100, Math.round((actualDays / plannedDays) * 100))}%`
                                  : '0%',
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {primaryTrip ? (
                          <button
                            type="button"
                            onClick={() => onEditAssignment(primaryTrip)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 rounded-md transition-colors whitespace-nowrap"
                          >
                            <span>일정 입력</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        ) : primaryProject === null ? (
                          <button
                            type="button"
                            onClick={() => onNavigateToProjects()}
                            className="text-xs text-slate-500 hover:text-slate-800 whitespace-nowrap"
                          >
                            프로젝트 배정
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom 2-column grid: Timeline Gantt & Destination/Project Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Gantt Timeline */}
        <section className="xl:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-700" />
                <span>선행기술팀 해외출장 월별 타임라인</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                계획 일정(연한 막대) 및 실적·진행 일정(진한 막대)의 기간 중첩을 확인합니다.
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setTimelineRange('2026-Q4')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  timelineRange === '2026-Q4'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2026.10 ~ 2027.01
              </button>
              <button
                type="button"
                onClick={() => setTimelineRange('2027-Q1')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  timelineRange === '2027-Q1'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2026.12 ~ 2027.03
              </button>
            </div>
          </div>

          <div className="p-5 overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Month Header */}
              <div className="grid grid-cols-[110px_1fr] items-center border-b border-slate-200 pb-2 mb-3">
                <div className="text-xs font-semibold text-slate-500">팀원</div>
                <div className="grid grid-cols-4 text-xs font-mono-num font-semibold text-slate-600">
                  {timelineWindow.months.map((m) => (
                    <div key={m.label} className="border-l border-slate-200 pl-2">
                      {m.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Member rows */}
              <div className="space-y-2.5">
                {memberSummaries.map(({ member, trips }) => (
                  <div key={member.id} className="grid grid-cols-[110px_1fr] items-center">
                    <div className="text-xs font-medium text-slate-800 truncate pr-2">
                      {member.name}
                    </div>
                    <div className="relative h-7 bg-slate-50 rounded border border-slate-100">
                      {/* Grid lines */}
                      <div className="absolute inset-0 grid grid-cols-4 pointer-events-none">
                        {timelineWindow.months.map((m) => (
                          <div key={m.label} className="border-l border-slate-200/70 h-full" />
                        ))}
                      </div>
                      {/* Today indicator */}
                      {todayMarkerLeft && (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-rose-500 z-10 pointer-events-none"
                          style={{ left: todayMarkerLeft }}
                          title="오늘 (2026-11-25)"
                        />
                      )}
                      {trips.map((t) => {
                        const prj = projectMap.get(t.projectId);
                        const pPos = computeBarPercent(t.plannedStartDate, t.plannedEndDate);
                        const aPos = computeBarPercent(t.actualStartDate, t.actualEndDate);
                        const colorClass =
                          t.status === '완료'
                            ? 'bg-sky-500/85 border-sky-600 text-white'
                            : t.status === '출장중'
                              ? 'bg-emerald-600/90 border-emerald-700 text-white'
                              : 'bg-amber-300/90 border-amber-400 text-amber-950';

                        return (
                          <div key={t.id}>
                            {pPos && (
                              <button
                                type="button"
                                onClick={() => onEditAssignment(t)}
                                title={`${prj?.vehicleModel || ''} (${t.plannedStartDate} ~ ${t.plannedEndDate})`}
                                className={`absolute top-1 h-5 rounded text-[10px] font-medium px-1.5 truncate border transition-opacity hover:opacity-90 ${colorClass}`}
                                style={pPos}
                              >
                                {prj?.vehicleModel} {prj?.destination.split(' ')[0]}
                              </button>
                            )}
                            {aPos && (
                              <div
                                className="absolute bottom-0.5 h-1 rounded-full bg-slate-900/70 pointer-events-none"
                                style={aPos}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-5 text-[11px] text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-300 border border-amber-400" />
                  준비중
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-600" />
                  출장중
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-sky-500" />
                  완료
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-4 h-1 rounded-full bg-slate-900/70" />
                  실적 기간
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-px h-3 bg-rose-500" />
                  기준일 (11/25)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Destination & Project Breakdown */}
        <section className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">출장지별 인원 현황</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              해외 거점별 투입 인원(선행기술팀 + 협력업체) 집계
            </p>
          </div>
          <div className="p-5 space-y-4 flex-1">
            {destinationStats.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-8">
                집계할 출장 데이터가 없습니다.
              </div>
            ) : (
              destinationStats.map((d) => (
                <div key={d.destination} className="pb-3 border-b border-slate-100 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">{d.destination}</span>
                    <span className="text-xs font-mono-num font-semibold text-slate-800">
                      총 {d.totalPeople}명 (팀 {d.internalPeople}명)
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500 font-mono-num">
                    <span>출장중 {d.activeCount}</span>
                    <span>·</span>
                    <span>준비중 {d.preparingCount}</span>
                    <span>·</span>
                    <span>완료 {d.completedCount}</span>
                    <span>·</span>
                    <span>계획 {d.plannedDays}일</span>
                  </div>
                  <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    {d.completedCount > 0 && (
                      <div
                        className="bg-sky-500 h-full"
                        style={{ width: `${(d.completedCount / d.totalPeople) * 100}%` }}
                      />
                    )}
                    {d.activeCount > 0 && (
                      <div
                        className="bg-emerald-600 h-full"
                        style={{ width: `${(d.activeCount / d.totalPeople) * 100}%` }}
                      />
                    )}
                    {d.preparingCount > 0 && (
                      <div
                        className="bg-amber-400 h-full"
                        style={{ width: `${(d.preparingCount / d.totalPeople) * 100}%` }}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
