import React, { useMemo, useState } from 'react';
import { Plus, Copy, Pencil, Trash2, Search, X, UserPlus } from 'lucide-react';
import { Project, TripAssignment, VendorPerson } from '../types/trip';
import { generateId } from '../utils/dateUtils';

interface VendorsViewProps {
  vendors: VendorPerson[];
  projects: Project[];
  assignments: TripAssignment[];
  onSaveVendor: (vendor: VendorPerson, isNew: boolean) => void;
  onDeleteVendor: (vendorId: string) => void;
  onAssignVendorToProject: (vendor: VendorPerson, projectId: string) => void;
}

export function VendorsView({
  vendors,
  projects,
  assignments,
  onSaveVendor,
  onDeleteVendor,
  onAssignVendorToProject,
}: VendorsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('협력업체 인원 등록');
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);

  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [defaultTask, setDefaultTask] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  // Quick assign modal
  const [assigningVendor, setAssigningVendor] = useState<VendorPerson | null>(null);
  const [targetProjectId, setTargetProjectId] = useState('');

  const companies = useMemo(() => {
    const set = new Set(vendors.map((v) => v.company));
    return Array.from(set).sort();
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return vendors.filter((v) => {
      const matchCompany = companyFilter === 'all' || v.company === companyFilter;
      const matchQuery =
        !q ||
        v.company.toLowerCase().includes(q) ||
        v.name.toLowerCase().includes(q) ||
        v.defaultTask.toLowerCase().includes(q) ||
        v.specialty.toLowerCase().includes(q);
      return matchCompany && matchQuery;
    });
  }, [vendors, companyFilter, searchQuery]);

  const openAdd = () => {
    setEditingVendorId(null);
    setModalTitle('협력업체 인원 신규 등록');
    setCompany(companyFilter !== 'all' ? companyFilter : '');
    setName('');
    setDefaultTask('');
    setSpecialty('');
    setPhone('');
    setNote('');
    setModalOpen(true);
  };

  const openEdit = (v: VendorPerson) => {
    setEditingVendorId(v.id);
    setModalTitle('협력업체 인원 수정');
    setCompany(v.company);
    setName(v.name);
    setDefaultTask(v.defaultTask);
    setSpecialty(v.specialty);
    setPhone(v.phone);
    setNote(v.note);
    setModalOpen(true);
  };

  // Explicit "기존 내용 복사" handler (creates a new vendor record pre-filled with existing details)
  const openCopy = (v: VendorPerson) => {
    setEditingVendorId(null);
    setModalTitle(`기존 내용 복사 등록 (${v.company})`);
    setCompany(v.company);
    setName(v.name === '미정' ? '미정' : `${v.name} (복사)`);
    setDefaultTask(v.defaultTask);
    setSpecialty(v.specialty);
    setPhone(v.phone);
    setNote(v.note);
    setModalOpen(true);
  };

  const handleInstantDuplicate = (v: VendorPerson) => {
    const cloned: VendorPerson = {
      ...v,
      id: generateId('vp'),
      name: v.name === '미정' ? '미정' : `${v.name} (복사)`,
    };
    onSaveVendor(cloned, true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) return;
    const vendor: VendorPerson = {
      id: editingVendorId || generateId('vp'),
      company: company.trim(),
      name: name.trim() || '미정',
      defaultTask: defaultTask.trim(),
      specialty: specialty.trim(),
      phone: phone.trim(),
      note: note.trim(),
    };
    onSaveVendor(vendor, !editingVendorId);
    setModalOpen(false);
  };

  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningVendor || !targetProjectId) return;
    onAssignVendorToProject(assigningVendor, targetProjectId);
    setAssigningVendor(null);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">협력업체 인원 명단 관리</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            업체 인원 명단을 생성하고 기존 내용을 복사하여 빠르게 추가·수정·삭제할 수 있습니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="업체명, 성명, 업무 검색"
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md w-48 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">전체 업체 ({vendors.length}명)</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>업체 인원 추가</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 whitespace-nowrap">업체명</th>
                <th className="py-3 px-4 whitespace-nowrap">성명</th>
                <th className="py-3 px-4 whitespace-nowrap">담당업무</th>
                <th className="py-3 px-4 whitespace-nowrap">설비 / 분야</th>
                <th className="py-3 px-4 whitespace-nowrap">연락처</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">투입 횟수</th>
                <th className="py-3 px-4 whitespace-nowrap">비고</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">관리 (복사 / 수정 / 삭제)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-slate-500">
                    등록된 협력업체 인원이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => {
                  const assignedCount = assignments.filter(
                    (a) =>
                      a.personType === 'vendor' &&
                      (a.vendorPersonId === vendor.id ||
                        (a.company === vendor.company &&
                          a.name !== '미정' &&
                          a.name === vendor.name))
                  ).length;

                  return (
                    <tr key={vendor.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {vendor.company}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={
                            vendor.name === '미정'
                              ? 'text-slate-400 font-medium'
                              : 'font-medium text-slate-800'
                          }
                        >
                          {vendor.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">{vendor.defaultTask || '-'}</td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {vendor.specialty || '-'}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono-num text-slate-600 whitespace-nowrap">
                        {vendor.phone || '-'}
                      </td>
                      <td className="py-3 px-4 text-center text-xs font-mono-num text-slate-700 whitespace-nowrap">
                        {assignedCount}건
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 max-w-[160px] truncate">
                        {vendor.note || '-'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setAssigningVendor(vendor);
                              setTargetProjectId(projects[0]?.id || '');
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-50 rounded transition-colors whitespace-nowrap"
                            title="프로젝트에 즉시 배정"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>배정</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openCopy(vendor)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 rounded transition-colors whitespace-nowrap"
                            title="기존 내용을 복사하여 새 인원 입력"
                          >
                            <Copy className="w-3 h-3" />
                            <span>내용 복사</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInstantDuplicate(vendor)}
                            className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors whitespace-nowrap"
                            title="즉시 1명 복제"
                          >
                            즉시복제
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(vendor)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                            title="수정"
                            aria-label="업체 인원 수정"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteVendor(vendor.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded"
                            title="삭제"
                            aria-label="업체 인원 삭제"
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

      {/* Add / Edit / Copy Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="fixed inset-0" onClick={() => setModalOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vendor-modal-title"
            className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 id="vendor-modal-title" className="text-base font-bold text-slate-900">
                {modalTitle}
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">업체명</label>
                  <input
                    type="text"
                    required
                    list="vendor-company-suggestions"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="예: 누리ECS, 다올이엔지"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <datalist id="vendor-company-suggestions">
                    {companies.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    성명 (비워두면 미정)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="성명 또는 미정"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">담당업무</label>
                <input
                  type="text"
                  value={defaultTask}
                  onChange={(e) => setDefaultTask(e.target.value)}
                  placeholder="예: 부스 셋업, PLC 배선"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">설비 / 분야</label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="예: PLC/제어, LASER 설비"
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
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Vendor to Project Modal */}
      {assigningVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div
            className="fixed inset-0"
            onClick={() => setAssigningVendor(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">프로젝트에 인원 배정</h3>
              <button
                type="button"
                onClick={() => setAssigningVendor(null)}
                className="p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmAssign} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="font-semibold text-slate-900">
                  {assigningVendor.company} · {assigningVendor.name}
                </div>
                <div className="text-slate-600">{assigningVendor.defaultTask || '담당업무 미지정'}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  배정할 프로젝트 선택
                </label>
                <select
                  required
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.year} · {p.vehicleModel} {p.stage} ({p.destination})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAssigningVendor(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md"
                >
                  프로젝트에 배정
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
