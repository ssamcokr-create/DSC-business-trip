import PptxGenJS from 'pptxgenjs';
import { Project, TripAssignment, TripStatus } from '../types/trip';
import { calculateTripDays, formatDateRangeCompact } from './dateUtils';

const STATUS_STYLE: Record<TripStatus, { fill: string; color: string }> = {
  준비중: { fill: 'FEF3C7', color: '92400E' },
  출장중: { fill: '059669', color: 'FFFFFF' },
  완료: { fill: '0EA5E9', color: 'FFFFFF' },
};

const FONT_FAMILY = 'Malgun Gothic';

export async function exportSchedulesToPptx(
  projects: Project[],
  assignments: TripAssignment[],
  selectedYear: number | 'all'
) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'DSC 선행기술팀';
  pptx.subject = '해외출장 프로젝트별 인원 현황';
  pptx.title = 'DSC 선행기술팀 해외출장 인원 현황';

  const targetProjects = [...projects].sort((a, b) => a.year - b.year || a.order - b.order);

  const targetProjectIds = new Set(targetProjects.map((p) => p.id));
  const targetAssignments = assignments.filter((a) => targetProjectIds.has(a.projectId));

  const todayStr = new Date().toISOString().slice(0, 10);
  const yearLabel =
    targetProjects.length === 1
      ? `${targetProjects[0].year} · ${targetProjects[0].vehicleModel} ${targetProjects[0].stage}`.trim()
      : selectedYear === 'all'
        ? '전체 연도'
        : `${selectedYear}년`;

  // Slide 1: Cover & Project Summary
  const summarySlide = pptx.addSlide();
  summarySlide.background = { color: 'F8FAFC' };

  // Top Header Band
  summarySlide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 1.15,
    fill: { color: '0F172A' },
  });

  summarySlide.addText('DSC 선행기술팀 해외출장 인원 현황', {
    x: 0.6,
    y: 0.22,
    w: 9.0,
    h: 0.45,
    fontFace: FONT_FAMILY,
    fontSize: 22,
    bold: true,
    color: 'FFFFFF',
  });

  summarySlide.addText(`프로젝트별 출장인원 및 일정 요약  |  조회 기준: ${yearLabel}  |  작성일: ${todayStr}`, {
    x: 0.6,
    y: 0.7,
    w: 10.5,
    h: 0.3,
    fontFace: FONT_FAMILY,
    fontSize: 10.5,
    color: 'CBD5E1',
  });

  // KPI Boxes on Summary Slide
  const totalPeople = targetAssignments.length;
  const internalCount = targetAssignments.filter((a) => a.personType === 'internal').length;
  const vendorCount = targetAssignments.filter((a) => a.personType === 'vendor').length;
  const totalPlannedDays = targetAssignments.reduce(
    (s, a) => s + calculateTripDays(a.plannedStartDate, a.plannedEndDate),
    0
  );
  const totalActualDays = targetAssignments.reduce(
    (s, a) => s + calculateTripDays(a.actualStartDate, a.actualEndDate),
    0
  );
  const activeCount = targetAssignments.filter((a) => a.status === '출장중').length;
  const preparingCount = targetAssignments.filter((a) => a.status === '준비중').length;
  const completedCount = targetAssignments.filter((a) => a.status === '완료').length;

  const kpiCards = [
    { label: '대상 프로젝트', value: `${targetProjects.length}건`, sub: yearLabel },
    {
      label: '총 출장 인원',
      value: `${totalPeople}명`,
      sub: `선행기술팀 ${internalCount}명 · 협력업체 ${vendorCount}명`,
    },
    {
      label: '총 출장일수 (계획 / 실적)',
      value: `${totalPlannedDays.toLocaleString()}일 / ${totalActualDays.toLocaleString()}일`,
      sub: `계획대비 ${totalActualDays - totalPlannedDays >= 0 ? '+' : ''}${totalActualDays - totalPlannedDays}일`,
    },
    {
      label: '진행 상태 분포',
      value: `출장중 ${activeCount} · 준비 ${preparingCount}`,
      sub: `완료 ${completedCount}명`,
    },
  ];

  kpiCards.forEach((card, idx) => {
    const x = 0.6 + idx * 3.08;
    summarySlide.addShape(pptx.ShapeType.rect, {
      x,
      y: 1.4,
      w: 2.9,
      h: 1.05,
      fill: { color: 'FFFFFF' },
      line: { color: 'E2E8F0', pt: 1 },
    });
    summarySlide.addText(card.label, {
      x: x + 0.16,
      y: 1.5,
      w: 2.58,
      h: 0.22,
      fontFace: FONT_FAMILY,
      fontSize: 9.5,
      color: '64748B',
    });
    summarySlide.addText(card.value, {
      x: x + 0.16,
      y: 1.75,
      w: 2.58,
      h: 0.36,
      fontFace: FONT_FAMILY,
      fontSize: 15,
      bold: true,
      color: '0F172A',
    });
    summarySlide.addText(card.sub, {
      x: x + 0.16,
      y: 2.13,
      w: 2.58,
      h: 0.22,
      fontFace: FONT_FAMILY,
      fontSize: 9,
      color: '475569',
    });
  });

  // Project Overview Table
  summarySlide.addText('프로젝트별 출장인원 요약표', {
    x: 0.6,
    y: 2.65,
    w: 6,
    h: 0.3,
    fontFace: FONT_FAMILY,
    fontSize: 12,
    bold: true,
    color: '0F172A',
  });

  const overviewHeader: PptxGenJS.TableRow = [
    { text: '연도', options: { fill: { color: '1E293B' }, color: 'FFFFFF', bold: true, align: 'center' } },
    { text: '프로젝트 (차종/단계)', options: { fill: { color: '1E293B' }, color: 'FFFFFF', bold: true } },
    { text: '출장지', options: { fill: { color: '1E293B' }, color: 'FFFFFF', bold: true } },
    { text: '선행기술팀', options: { fill: { color: '1E293B' }, color: 'FFFFFF', bold: true, align: 'center' } },
    { text: '협력업체', options: { fill: { color: '1E293B' }, color: 'FFFFFF', bold: true, align: 'center' } },
    { text: '총 인원', options: { fill: { color: '1E293B' }, color: 'FFFFFF', bold: true, align: 'center' } },
    { text: '계획일수', options: { fill: { color: '1E293B' }, color: 'FFFFFF', bold: true, align: 'right' } },
    { text: '실적일수', options: { fill: { color: '1E293B' }, color: 'FFFFFF', bold: true, align: 'right' } },
    { text: '상태 (준비/출장/완료)', options: { fill: { color: '1E293B' }, color: 'FFFFFF', bold: true, align: 'center' } },
  ];

  const overviewRows: PptxGenJS.TableRow[] = targetProjects.map((p, i) => {
    const pRows = targetAssignments.filter((a) => a.projectId === p.id);
    const pInternal = pRows.filter((a) => a.personType === 'internal').length;
    const pVendor = pRows.filter((a) => a.personType === 'vendor').length;
    const pPlanDays = pRows.reduce(
      (s, a) => s + calculateTripDays(a.plannedStartDate, a.plannedEndDate),
      0
    );
    const pActDays = pRows.reduce(
      (s, a) => s + calculateTripDays(a.actualStartDate, a.actualEndDate),
      0
    );
    const prep = pRows.filter((a) => a.status === '준비중').length;
    const act = pRows.filter((a) => a.status === '출장중').length;
    const comp = pRows.filter((a) => a.status === '완료').length;
    const bg = i % 2 === 0 ? 'FFFFFF' : 'F8FAFC';

    return [
      { text: String(p.year), options: { fill: { color: bg }, align: 'center' } },
      { text: `${p.vehicleModel} ${p.stage}`.trim(), options: { fill: { color: bg }, bold: true } },
      { text: p.destination, options: { fill: { color: bg } } },
      { text: `${pInternal}명`, options: { fill: { color: bg }, align: 'center' } },
      { text: `${pVendor}명`, options: { fill: { color: bg }, align: 'center' } },
      { text: `${pRows.length}명`, options: { fill: { color: bg }, align: 'center', bold: true } },
      { text: `${pPlanDays}일`, options: { fill: { color: bg }, align: 'right' } },
      { text: `${pActDays}일`, options: { fill: { color: bg }, align: 'right', color: '1D4ED8' } },
      { text: `${prep} / ${act} / ${comp}`, options: { fill: { color: bg }, align: 'center' } },
    ];
  });

  if (overviewRows.length === 0) {
    overviewRows.push([
      {
        text: '표시할 프로젝트가 없습니다.',
        options: { colspan: 9, align: 'center', color: '64748B', fill: { color: 'FFFFFF' } },
      },
    ]);
  }

  summarySlide.addTable([overviewHeader, ...overviewRows], {
    x: 0.6,
    y: 3.0,
    w: 12.133,
    colW: [0.75, 2.35, 1.85, 1.0, 1.0, 0.95, 1.1, 1.1, 2.033],
    fontFace: FONT_FAMILY,
    fontSize: 9.5,
    color: '0F172A',
    border: { type: 'solid', color: 'CBD5E1', pt: 0.75 },
    rowH: 0.34,
    valign: 'middle',
  });

  // Per-Project Slides (paginated cleanly at 14 rows per slide)
  const ROWS_PER_SLIDE = 14;

  for (const project of targetProjects) {
    const pRows = targetAssignments.filter((a) => a.projectId === project.id);
    const totalPages = Math.max(1, Math.ceil(pRows.length / ROWS_PER_SLIDE));

    const pInternal = pRows.filter((a) => a.personType === 'internal').length;
    const pVendor = pRows.filter((a) => a.personType === 'vendor').length;
    const totalPlanHead = pRows.reduce((s, r) => s + r.plannedHeadcount, 0);
    const totalActHead = pRows.reduce((s, r) => s + r.actualHeadcount, 0);
    const totalPlanDays = pRows.reduce(
      (s, r) => s + calculateTripDays(r.plannedStartDate, r.plannedEndDate),
      0
    );
    const totalActDays = pRows.reduce(
      (s, r) => s + calculateTripDays(r.actualStartDate, r.actualEndDate),
      0
    );
    const diffDays = totalActDays - totalPlanDays;

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const slide = pptx.addSlide();
      slide.background = { color: 'FFFFFF' };

      // Header bar
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 13.333,
        h: 0.92,
        fill: { color: '1E293B' },
      });

      const pageSuffix = totalPages > 1 ? ` (${pageIdx + 1}/${totalPages})` : '';
      slide.addText(
        `[${project.year}] ${project.vehicleModel} ${project.stage} — ${project.destination}${pageSuffix}`,
        {
          x: 0.5,
          y: 0.16,
          w: 9.2,
          h: 0.38,
          fontFace: FONT_FAMILY,
          fontSize: 16,
          bold: true,
          color: 'FCD34D',
        }
      );

      slide.addText(
        `총 ${pRows.length}명 (선행기술팀 ${pInternal}명 · 협력업체 ${pVendor}명)  |  계획 ${totalPlanDays}일 / 실적 ${totalActDays}일 (${diffDays >= 0 ? '+' : ''}${diffDays}일)`,
        {
          x: 0.5,
          y: 0.54,
          w: 11.8,
          h: 0.25,
          fontFace: FONT_FAMILY,
          fontSize: 9.5,
          color: 'E2E8F0',
        }
      );

      const headerRow: PptxGenJS.TableRow = [
        { text: 'No', options: { fill: { color: '334155' }, color: 'FFFFFF', bold: true, align: 'center' } },
        { text: '구분', options: { fill: { color: '334155' }, color: 'FFFFFF', bold: true, align: 'center' } },
        { text: '소속 / 업체', options: { fill: { color: '334155' }, color: 'FFFFFF', bold: true } },
        { text: '성명', options: { fill: { color: '334155' }, color: 'FFFFFF', bold: true } },
        { text: '담당업무', options: { fill: { color: '334155' }, color: 'FFFFFF', bold: true } },
        { text: '계획일정', options: { fill: { color: '334155' }, color: 'FFFFFF', bold: true, align: 'center' } },
        { text: '계획일', options: { fill: { color: '334155' }, color: 'FFFFFF', bold: true, align: 'right' } },
        { text: '실적일정', options: { fill: { color: '334155' }, color: 'FFFFFF', bold: true, align: 'center' } },
        { text: '실적일', options: { fill: { color: '334155' }, color: 'FFFFFF', bold: true, align: 'right' } },
        { text: '상태', options: { fill: { color: '334155' }, color: 'FFFFFF', bold: true, align: 'center' } },
        { text: '비고', options: { fill: { color: '334155' }, color: 'FFFFFF', bold: true } },
      ];

      const chunk = pRows.slice(pageIdx * ROWS_PER_SLIDE, (pageIdx + 1) * ROWS_PER_SLIDE);

      const bodyRows: PptxGenJS.TableRow[] =
        chunk.length === 0
          ? [
              [
                {
                  text: '배정된 출장 인원이 없습니다.',
                  options: { colspan: 11, align: 'center', color: '64748B', fill: { color: 'F8FAFC' } },
                },
              ],
            ]
          : chunk.map((r, i) => {
              const rowNum = pageIdx * ROWS_PER_SLIDE + i + 1;
              const pDays = calculateTripDays(r.plannedStartDate, r.plannedEndDate);
              const aDays = calculateTripDays(r.actualStartDate, r.actualEndDate);
              const bg = r.personType === 'internal' ? 'EFF6FF' : i % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
              const statusStyle = STATUS_STYLE[r.status];

              return [
                { text: String(rowNum), options: { fill: { color: bg }, align: 'center', color: '64748B' } },
                {
                  text: r.personType === 'internal' ? '선행팀' : '협력사',
                  options: {
                    fill: { color: bg },
                    align: 'center',
                    bold: r.personType === 'internal',
                    color: r.personType === 'internal' ? '1D4ED8' : '475569',
                  },
                },
                {
                  text: r.company,
                  options: { fill: { color: bg }, bold: r.personType === 'internal' },
                },
                {
                  text: r.name,
                  options: {
                    fill: { color: bg },
                    bold: r.name !== '미정',
                    color: r.name === '미정' ? '94A3B8' : '0F172A',
                  },
                },
                { text: r.task || '-', options: { fill: { color: bg } } },
                {
                  text: formatDateRangeCompact(r.plannedStartDate, r.plannedEndDate),
                  options: { fill: { color: bg }, align: 'center' },
                },
                {
                  text: pDays > 0 ? `${pDays}` : '0',
                  options: { fill: { color: bg }, align: 'right', bold: true },
                },
                {
                  text: formatDateRangeCompact(r.actualStartDate, r.actualEndDate),
                  options: { fill: { color: bg }, align: 'center' },
                },
                {
                  text: aDays > 0 ? `${aDays}` : '0',
                  options: { fill: { color: bg }, align: 'right', bold: true, color: '1D4ED8' },
                },
                {
                  text: r.status,
                  options: {
                    fill: { color: statusStyle.fill },
                    color: statusStyle.color,
                    bold: true,
                    align: 'center',
                  },
                },
                { text: r.note || '-', options: { fill: { color: bg }, color: '475569' } },
              ];
            });

      const tableRows: PptxGenJS.TableRow[] = [headerRow, ...bodyRows];

      if (pageIdx === totalPages - 1 && pRows.length > 0) {
        tableRows.push([
          {
            text: `소계 (${pRows.length}명)`,
            options: { colspan: 3, fill: { color: 'E2E8F0' }, bold: true, align: 'center' },
          },
          {
            text: `계획 ${totalPlanHead} / 실적 ${totalActHead}`,
            options: { colspan: 2, fill: { color: 'E2E8F0' }, bold: true, align: 'center' },
          },
          { text: '계획 합계', options: { fill: { color: 'E2E8F0' }, align: 'center', color: '475569' } },
          { text: `${totalPlanDays}`, options: { fill: { color: 'E2E8F0' }, bold: true, align: 'right' } },
          { text: '실적 합계', options: { fill: { color: 'E2E8F0' }, align: 'center', color: '475569' } },
          {
            text: `${totalActDays}`,
            options: { fill: { color: 'E2E8F0' }, bold: true, align: 'right', color: '1D4ED8' },
          },
          {
            text: `${diffDays >= 0 ? '+' : ''}${diffDays}일`,
            options: { colspan: 2, fill: { color: 'E2E8F0' }, bold: true, align: 'center' },
          },
        ]);
      }

      slide.addTable(tableRows, {
        x: 0.4,
        y: 1.12,
        w: 12.533,
        colW: [0.45, 0.72, 1.15, 0.85, 2.55, 1.65, 0.65, 1.65, 0.65, 0.8, 1.413],
        fontFace: FONT_FAMILY,
        fontSize: 8.8,
        color: '0F172A',
        border: { type: 'solid', color: 'CBD5E1', pt: 0.6 },
        rowH: 0.34,
        valign: 'middle',
      });

      slide.addText(`DSC 선행기술팀 해외출장 관리  ·  ${todayStr}`, {
        x: 0.4,
        y: 7.12,
        w: 6,
        h: 0.24,
        fontFace: FONT_FAMILY,
        fontSize: 8.5,
        color: '94A3B8',
      });
    }
  }

  await pptx.writeFile({
    fileName: `DSC_선행기술팀_프로젝트별_출장인원_${todayStr}.pptx`,
  });
}
