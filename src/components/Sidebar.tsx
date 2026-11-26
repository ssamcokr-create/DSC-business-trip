import { LayoutDashboard, Table2, Users, Building2, Download, X } from 'lucide-react';
import { WorkspaceTab } from '../types/trip';

interface SidebarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  years: number[];
  selectedYear: number | 'all';
  onSelectYear: (year: number | 'all') => void;
  onExportCsv: () => void;
  counts: {
    projects: number;
    teamMembers: number;
    vendors: number;
    activeTrips: number;
  };
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  years,
  selectedYear,
  onSelectYear,
  onExportCsv,
  counts,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navItems: Array<{
    id: WorkspaceTab;
    label: string;
    icon: typeof LayoutDashboard;
    count?: number;
  }> = [
    { id: 'dashboard', label: '전체 현황 대시보드', icon: LayoutDashboard, count: counts.activeTrips },
    { id: 'projects', label: '프로젝트별 출장표', icon: Table2, count: counts.projects },
    { id: 'team', label: '선행기술팀 인원', icon: Users, count: counts.teamMembers },
    { id: 'vendors', label: '협력업체 인원', icon: Building2, count: counts.vendors },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-900 text-slate-200 select-none">
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
        <div>
          <div className="text-base font-bold tracking-tight text-white whitespace-nowrap">
            DSC 선행기술팀
          </div>
          <div className="text-xs text-slate-400 mt-0.5 whitespace-nowrap">
            해외출장 일정 관리
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="메뉴 닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="주 메뉴">
        <div className="px-2.5 pb-2 text-[11px] font-medium text-slate-400">
          업무 메뉴
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </span>
              {typeof item.count === 'number' && (
                <span
                  className={`font-mono-num text-xs ${
                    isActive ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-5 px-2.5 pb-2 text-[11px] font-medium text-slate-400">
          조회 연도
        </div>
        <div className="px-1 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onSelectYear('all')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              selectedYear === 'all'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            전체
          </button>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => onSelectYear(y)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md font-mono-num transition-colors whitespace-nowrap ${
                selectedYear === y
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <button
          type="button"
          onClick={onExportCsv}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>엑셀(CSV) 내보내기</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 border-r border-slate-200 bg-slate-900">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-64 max-w-[80vw] h-full z-10 shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
