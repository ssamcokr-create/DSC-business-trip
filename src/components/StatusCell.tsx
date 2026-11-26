import { TripStatus } from '../types/trip';

interface StatusCellProps {
  status: TripStatus;
  compact?: boolean;
}

export function StatusCell({ status, compact = false }: StatusCellProps) {
  const styles: Record<TripStatus, string> = {
    준비중: 'bg-amber-100/90 text-amber-900 border-amber-300',
    출장중: 'bg-emerald-600 text-white border-emerald-700',
    완료: 'bg-sky-500 text-white border-sky-600',
  };

  return (
    <span
      className={`inline-flex items-center justify-center border font-medium whitespace-nowrap shrink-0 ${
        compact ? 'px-2 py-0.5 text-[11px] rounded' : 'px-2.5 py-1 text-xs rounded-md'
      } ${styles[status]}`}
    >
      {status}
    </span>
  );
}
