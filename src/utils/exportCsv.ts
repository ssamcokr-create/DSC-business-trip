import { Project, TripAssignment } from '../types/trip';
import { calculateTripDays } from './dateUtils';

function escapeCsv(value: string | number): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportSchedulesToCsv(projects: Project[], assignments: TripAssignment[]) {
  const headers = [
    '연도',
    '차종',
    '단계',
    '출장지',
    '구분',
    '소속/업체',
    '성명',
    '담당업무',
    '인원(계획)',
    '인원(실적)',
    '계획 시작일',
    '계획 종료일',
    '계획 일수',
    '실적 시작일',
    '실적 종료일',
    '실적 일수',
    '계획대비 증감',
    '상태',
    '식대비',
    '숙박비',
    '렌트비',
    '지그',
    'CO2 설비',
    'SPOT 설비',
    'LASER 설비',
    '조립&검사',
    '비고',
  ];

  const rows: string[] = [headers.map(escapeCsv).join(',')];

  const sortedProjects = [...projects].sort((a, b) => a.year - b.year || a.order - b.order);

  for (const project of sortedProjects) {
    const pRows = assignments.filter((a) => a.projectId === project.id);
    for (const item of pRows) {
      const pDays = calculateTripDays(item.plannedStartDate, item.plannedEndDate);
      const aDays = calculateTripDays(item.actualStartDate, item.actualEndDate);
      const diff = aDays - pDays;
      rows.push(
        [
          project.year,
          project.vehicleModel,
          project.stage,
          project.destination,
          item.personType === 'internal' ? '선행기술팀' : '협력업체',
          item.company,
          item.name,
          item.task,
          item.plannedHeadcount,
          item.actualHeadcount,
          item.plannedStartDate || '-',
          item.plannedEndDate || '-',
          pDays,
          item.actualStartDate || '-',
          item.actualEndDate || '-',
          aDays,
          diff,
          item.status,
          item.costs.meal,
          item.costs.lodging,
          item.costs.rental,
          item.jig,
          item.equipment.co2,
          item.equipment.spot,
          item.equipment.laser,
          item.equipment.assemblyInspection,
          item.note,
        ]
          .map(escapeCsv)
          .join(',')
      );
    }
  }

  const bom = '\uFEFF';
  const blob = new Blob([bom + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `DSC_선행기술팀_해외출장일정_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
