export type TripStatus = '준비중' | '출장중' | '완료';

export type PersonType = 'internal' | 'vendor';

export interface TeamMember {
  id: string;
  name: string;
  position: string; // 직급/직책 (예: 책임연구원, 선임연구원, 매니저 등)
  defaultTask: string; // 주 담당업무
  phone: string;
  active: boolean;
  note: string;
}

export interface VendorPerson {
  id: string;
  company: string; // 업체명 (예: 누리ECS, 다올이엔지)
  name: string; // 성명 (미정 가능)
  defaultTask: string; // 담당업무
  specialty: string; // 설비/분야 (예: PLC/제어, 기구설비, 레이저/비전 등)
  phone: string;
  note: string;
}

export interface Project {
  id: string;
  year: number;
  vehicleModel: string; // 차종 (예: NX5e, SX3i, NI1i, QY2i)
  stage: string; // 구분/단계 (예: [FRM] M단계 지원, [FRM], [CCB], [통풍])
  destination: string; // 출장지 (예: 체코 [트지네츠], 인도 [만누르], 인도 [뱅갈로])
  order: number;
}

export interface TripCosts {
  meal: number; // 식대비
  lodging: number; // 숙박비
  rental: number; // 렌트비
}

export interface TripEquipment {
  co2: string; // CO2 설비
  spot: string; // SPOT 설비
  laser: string; // LASER 설비
  assemblyInspection: string; // 조립 & 검사
}

export interface TripAssignment {
  id: string;
  projectId: string;
  personType: PersonType;
  teamMemberId?: string;
  vendorPersonId?: string;
  company: string;
  name: string;
  task: string;
  plannedHeadcount: number;
  actualHeadcount: number;
  plannedStartDate: string; // YYYY-MM-DD or ''
  plannedEndDate: string; // YYYY-MM-DD or ''
  actualStartDate: string; // YYYY-MM-DD or ''
  actualEndDate: string; // YYYY-MM-DD or ''
  status: TripStatus;
  costs: TripCosts;
  jig: string;
  equipment: TripEquipment;
  note: string;
}

export interface AppDatabase {
  teamMembers: TeamMember[];
  vendors: VendorPerson[];
  projects: Project[];
  assignments: TripAssignment[];
  updatedAt: string;
}

export type WorkspaceTab = 'dashboard' | 'projects' | 'team' | 'vendors';
