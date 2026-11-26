import { useEffect, useMemo, useState } from 'react';
import { Menu, Plus, RotateCcw, AlertTriangle } from 'lucide-react';
import {
  AppDatabase,
  Project,
  TeamMember,
  TripAssignment,
  TripStatus,
  VendorPerson,
  WorkspaceTab,
} from './types/trip';
import { INITIAL_SEED_DATA } from './data/seedData';
import { generateId } from './utils/dateUtils';
import { exportSchedulesToCsv } from './utils/exportCsv';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ProjectScheduleView } from './components/ProjectScheduleView';
import { TeamMembersView } from './components/TeamMembersView';
import { VendorsView } from './components/VendorsView';
import { TripAssignmentModal } from './components/TripAssignmentModal';
import { AddMemberToProjectModal } from './components/AddMemberToProjectModal';
import { ProjectModal } from './components/ProjectModal';

interface ConfirmState {
  title: string;
  message: string;
  onConfirm: () => void;
}

export default function App() {
  const [db, setDb] = useState<AppDatabase>(INITIAL_SEED_DATA);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('dashboard');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals & Drawers
  const [editingAssignment, setEditingAssignment] = useState<TripAssignment | null>(null);
  const [addMemberProject, setAddMemberProject] = useState<Project | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  useEffect(() => {
    let mounted = true;
    fetch('/api/data')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then((data: AppDatabase) => {
        if (mounted && data && Array.isArray(data.projects)) {
          setDb(data);
        }
      })
      .catch(() => {
        // Keep initial seed data on error
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const persistDb = (updater: (prev: AppDatabase) => AppDatabase) => {
    setDb((prev) => {
      const next = updater(prev);
      fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      }).catch(() => {
        // Silent retry/fallback
      });
      return next;
    });
  };

  const years = useMemo(() => {
    const set = new Set(db.projects.map((p) => p.year));
    return Array.from(set).sort((a, b) => a - b);
  }, [db.projects]);

  const counts = useMemo(
    () => ({
      projects: db.projects.length,
      teamMembers: db.teamMembers.length,
      vendors: db.vendors.length,
      activeTrips: db.assignments.filter((a) => a.status === '출장중').length,
    }),
    [db]
  );

  const tabTitles: Record<WorkspaceTab, string> = {
    dashboard: '선행기술팀 전체 해외출장 현황',
    projects: '프로젝트별 출장 일정표',
    team: '선행기술팀 인원 관리',
    vendors: '협력업체 인원 명단 관리',
  };

  // Assignment handlers
  const handleSaveAssignment = (updated: TripAssignment) => {
    persistDb((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) => (a.id === updated.id ? updated : a)),
    }));
    setEditingAssignment(null);
    showToast(`${updated.name}님의 출장 일정이 저장되었습니다.`);
  };

  const handleCopyAssignment = (row: TripAssignment) => {
    const cloned: TripAssignment = {
      ...row,
      id: generateId('as'),
      name: row.name === '미정' ? '미정' : `${row.name} (복사)`,
    };
    persistDb((prev) => {
      const idx = prev.assignments.findIndex((a) => a.id === row.id);
      const next = [...prev.assignments];
      next.splice(idx + 1, 0, cloned);
      return { ...prev, assignments: next };
    });
    showToast(`${row.company} 인원 행이 복사되었습니다.`);
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    const target = db.assignments.find((a) => a.id === assignmentId);
    setConfirmState({
      title: '출장 인원 삭제',
      message: `${target?.company || ''} ${target?.name || ''} 항목을 이 프로젝트에서 삭제하시겠습니까?`,
      onConfirm: () => {
        persistDb((prev) => ({
          ...prev,
          assignments: prev.assignments.filter((a) => a.id !== assignmentId),
        }));
        setConfirmState(null);
        showToast('출장 항목이 삭제되었습니다.');
      },
    });
  };

  const handleQuickStatusChange = (assignmentId: string, status: TripStatus) => {
    persistDb((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) => (a.id === assignmentId ? { ...a, status } : a)),
    }));
  };

  const handleAddAssignmentsToProject = (
    newAssignments: TripAssignment[],
    newTeamMember?: TeamMember,
    newVendor?: VendorPerson
  ) => {
    persistDb((prev) => ({
      ...prev,
      teamMembers: newTeamMember ? [...prev.teamMembers, newTeamMember] : prev.teamMembers,
      vendors: newVendor ? [...prev.vendors, newVendor] : prev.vendors,
      assignments: [...prev.assignments, ...newAssignments],
    }));
    setAddMemberProject(null);
    showToast(`${newAssignments.length}명의 인원이 프로젝트에 추가되었습니다.`);
  };

  // Project handlers
  const handleSaveProject = (
    data: Omit<Project, 'id' | 'order'>,
    copyFromProjectId?: string
  ) => {
    if (editingProject) {
      persistDb((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === editingProject.id ? { ...p, ...data } : p
        ),
      }));
      showToast('프로젝트 정보가 수정되었습니다.');
    } else {
      const newProjectId = generateId('prj');
      const maxOrder = db.projects.reduce((m, p) => Math.max(m, p.order), 0);
      const newProject: Project = {
        id: newProjectId,
        order: maxOrder + 1,
        ...data,
      };

      const copiedAssignments: TripAssignment[] = copyFromProjectId
        ? db.assignments
            .filter((a) => a.projectId === copyFromProjectId)
            .map((a) => ({
              ...a,
              id: generateId('as'),
              projectId: newProjectId,
              plannedStartDate: '',
              plannedEndDate: '',
              actualStartDate: '',
              actualEndDate: '',
              actualHeadcount: 0,
              status: '준비중' as TripStatus,
              costs: { meal: 0, lodging: 0, rental: 0 },
            }))
        : [];

      persistDb((prev) => ({
        ...prev,
        projects: [...prev.projects, newProject],
        assignments: [...prev.assignments, ...copiedAssignments],
      }));
      setFocusedProjectId(newProjectId);
      setActiveTab('projects');
      showToast(
        copiedAssignments.length > 0
          ? `프로젝트 및 인원 ${copiedAssignments.length}명이 생성되었습니다.`
          : '새 프로젝트가 생성되었습니다.'
      );
    }
    setProjectModalOpen(false);
    setEditingProject(null);
  };

  const handleDeleteProject = (projectId: string) => {
    const prj = db.projects.find((p) => p.id === projectId);
    setConfirmState({
      title: '프로젝트 삭제',
      message: `"${prj?.vehicleModel} ${prj?.stage}" 프로젝트와 소속 출장 일정을 모두 삭제하시겠습니까?`,
      onConfirm: () => {
        persistDb((prev) => ({
          ...prev,
          projects: prev.projects.filter((p) => p.id !== projectId),
          assignments: prev.assignments.filter((a) => a.projectId !== projectId),
        }));
        setConfirmState(null);
        showToast('프로젝트가 삭제되었습니다.');
      },
    });
  };

  // Team Member handlers
  const handleSaveTeamMember = (member: TeamMember, isNew: boolean) => {
    persistDb((prev) => ({
      ...prev,
      teamMembers: isNew
        ? [...prev.teamMembers, member]
        : prev.teamMembers.map((m) => (m.id === member.id ? member : m)),
      // Also sync name in linked assignments if edited
      assignments: !isNew
        ? prev.assignments.map((a) =>
            a.teamMemberId === member.id ? { ...a, name: member.name } : a
          )
        : prev.assignments,
    }));
    showToast(isNew ? `${member.name}님이 팀 명단에 추가되었습니다.` : `${member.name}님 정보가 수정되었습니다.`);
  };

  const handleDeleteTeamMember = (memberId: string) => {
    const member = db.teamMembers.find((m) => m.id === memberId);
    setConfirmState({
      title: '선행기술팀 인원 삭제',
      message: `${member?.name || ''}님을 선행기술팀 인원 명단에서 삭제하시겠습니까? (기존 프로젝트 기록의 이름은 유지됩니다.)`,
      onConfirm: () => {
        persistDb((prev) => ({
          ...prev,
          teamMembers: prev.teamMembers.filter((m) => m.id !== memberId),
        }));
        setConfirmState(null);
        showToast('팀원이 삭제되었습니다.');
      },
    });
  };

  // Vendor handlers
  const handleSaveVendor = (vendor: VendorPerson, isNew: boolean) => {
    persistDb((prev) => ({
      ...prev,
      vendors: isNew
        ? [...prev.vendors, vendor]
        : prev.vendors.map((v) => (v.id === vendor.id ? vendor : v)),
    }));
    showToast(
      isNew
        ? `${vendor.company} · ${vendor.name}님이 등록되었습니다.`
        : `${vendor.company} · ${vendor.name}님 정보가 수정되었습니다.`
    );
  };

  const handleDeleteVendor = (vendorId: string) => {
    const v = db.vendors.find((item) => item.id === vendorId);
    setConfirmState({
      title: '협력업체 인원 삭제',
      message: `${v?.company || ''} ${v?.name || ''} 인원을 명단에서 삭제하시겠습니까?`,
      onConfirm: () => {
        persistDb((prev) => ({
          ...prev,
          vendors: prev.vendors.filter((item) => item.id !== vendorId),
        }));
        setConfirmState(null);
        showToast('협력업체 인원이 삭제되었습니다.');
      },
    });
  };

  const handleAssignVendorToProject = (vendor: VendorPerson, projectId: string) => {
    const newAssignment: TripAssignment = {
      id: generateId('as'),
      projectId,
      personType: 'vendor',
      vendorPersonId: vendor.id,
      company: vendor.company,
      name: vendor.name,
      task: vendor.defaultTask,
      plannedHeadcount: 1,
      actualHeadcount: 0,
      plannedStartDate: '',
      plannedEndDate: '',
      actualStartDate: '',
      actualEndDate: '',
      status: '준비중',
      costs: { meal: 0, lodging: 0, rental: 0 },
      jig: '',
      equipment: { co2: '', spot: '', laser: '', assemblyInspection: '' },
      note: '',
    };
    persistDb((prev) => ({
      ...prev,
      assignments: [...prev.assignments, newAssignment],
    }));
    setFocusedProjectId(projectId);
    setActiveTab('projects');
    showToast(`${vendor.company} ${vendor.name}님이 프로젝트에 배정되었습니다.`);
  };

  const handleResetToSample = () => {
    setConfirmState({
      title: '기본 데이터 초기화',
      message: '현재 저장된 모든 변경사항을 초기 DSC 선행기술팀 기준 데이터로 되돌리시겠습니까?',
      onConfirm: () => {
        fetch('/api/reset', { method: 'POST' })
          .then((r) => r.json())
          .then((data: AppDatabase) => setDb(data))
          .catch(() => setDb(INITIAL_SEED_DATA))
          .finally(() => {
            setConfirmState(null);
            showToast('초기 데이터로 복원되었습니다.');
          });
      },
    });
  };

  const navigateToProject = (projectId?: string) => {
    setFocusedProjectId(projectId || null);
    setActiveTab('projects');
  };

  const editingProjectObj = editingAssignment
    ? db.projects.find((p) => p.id === editingAssignment.projectId) || null
    : null;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'projects') setFocusedProjectId(null);
        }}
        years={years}
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        onExportCsv={() => exportSchedulesToCsv(db.projects, db.assignments)}
        counts={counts}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Clean 3-zone Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-5 lg:px-8 h-14 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
              aria-label="메뉴 열기"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-slate-900 truncate whitespace-nowrap">
              {tabTitles[activeTab]}
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs text-slate-500 whitespace-nowrap shrink-0">
            <span>조회 기준: {selectedYear === 'all' ? '전체 연도' : `${selectedYear}년`}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">선행기술팀 {db.teamMembers.length}명</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">협력업체 {db.vendors.length}명</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetToSample}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors whitespace-nowrap"
              title="초기 데이터 복원"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>초기화</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingProject(null);
                setProjectModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>프로젝트 추가</span>
            </button>
          </div>
        </header>

        {/* Main Workspace Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-24 bg-white border border-slate-200 rounded-lg animate-pulse"
                  />
                ))}
              </div>
              <div className="h-80 bg-white border border-slate-200 rounded-lg animate-pulse" />
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  projects={db.projects}
                  teamMembers={db.teamMembers}
                  assignments={db.assignments}
                  selectedYear={selectedYear}
                  onEditAssignment={setEditingAssignment}
                  onNavigateToProjects={navigateToProject}
                />
              )}

              {activeTab === 'projects' && (
                <ProjectScheduleView
                  projects={db.projects}
                  assignments={db.assignments}
                  selectedYear={selectedYear}
                  focusedProjectId={focusedProjectId}
                  onAddProject={() => {
                    setEditingProject(null);
                    setProjectModalOpen(true);
                  }}
                  onEditProject={(prj) => {
                    setEditingProject(prj);
                    setProjectModalOpen(true);
                  }}
                  onDeleteProject={handleDeleteProject}
                  onOpenAddMember={setAddMemberProject}
                  onEditAssignment={setEditingAssignment}
                  onCopyAssignment={handleCopyAssignment}
                  onDeleteAssignment={handleDeleteAssignment}
                  onQuickStatusChange={handleQuickStatusChange}
                />
              )}

              {activeTab === 'team' && (
                <TeamMembersView
                  teamMembers={db.teamMembers}
                  projects={db.projects}
                  assignments={db.assignments}
                  onSaveMember={handleSaveTeamMember}
                  onDeleteMember={handleDeleteTeamMember}
                  onNavigateToProject={navigateToProject}
                />
              )}

              {activeTab === 'vendors' && (
                <VendorsView
                  vendors={db.vendors}
                  projects={db.projects}
                  assignments={db.assignments}
                  onSaveVendor={handleSaveVendor}
                  onDeleteVendor={handleDeleteVendor}
                  onAssignVendorToProject={handleAssignVendorToProject}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Drawers & Modals */}
      <TripAssignmentModal
        assignment={editingAssignment}
        project={editingProjectObj}
        onClose={() => setEditingAssignment(null)}
        onSave={handleSaveAssignment}
      />

      <AddMemberToProjectModal
        project={addMemberProject}
        teamMembers={db.teamMembers}
        vendors={db.vendors}
        onClose={() => setAddMemberProject(null)}
        onAddAssignments={handleAddAssignmentsToProject}
      />

      <ProjectModal
        open={projectModalOpen}
        editingProject={editingProject}
        existingProjects={db.projects}
        onClose={() => {
          setProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
      />

      {/* Delete Confirmation Dialog */}
      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div
            className="fixed inset-0"
            onClick={() => setConfirmState(null)}
            aria-hidden="true"
          />
          <div
            role="alertdialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 p-6 space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{confirmState.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {confirmState.message}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmState.onConfirm}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subtle Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg border border-slate-700">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
