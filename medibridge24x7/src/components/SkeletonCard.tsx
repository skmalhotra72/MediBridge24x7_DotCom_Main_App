interface SkeletonCardProps {
  count?: number;
  className?: string;
}

export const SkeletonCard = ({ count = 1, className = '' }: SkeletonCardProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`bg-slate-800 border border-slate-700 rounded-lg p-6 ${className}`}
        >
          <div className="animate-pulse space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                <div className="h-8 bg-slate-700 rounded w-1/2"></div>
                <div className="h-3 bg-slate-700 rounded w-2/3"></div>
              </div>
              <div className="w-12 h-12 bg-slate-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export const SkeletonMetricCard = ({ count = 4 }: { count?: number }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-slate-800 border border-slate-700 rounded-lg p-6"
        >
          <div className="animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-3 bg-slate-700 rounded w-24 mb-3"></div>
                <div className="h-8 bg-slate-700 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-slate-700 rounded-lg"></div>
            </div>
            <div className="h-3 bg-slate-700 rounded w-20"></div>
          </div>
        </div>
      ))}
    </>
  );
};

export const SkeletonList = ({ count = 5 }: { count?: number }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-slate-800 border border-slate-700 rounded-lg p-4"
        >
          <div className="animate-pulse flex items-center space-x-4">
            <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-700 rounded w-1/3"></div>
              <div className="h-3 bg-slate-700 rounded w-1/2"></div>
            </div>
            <div className="w-20 h-8 bg-slate-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonChart = () => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-48 mb-4"></div>
        <div className="h-64 bg-slate-700 rounded"></div>
      </div>
    </div>
  );
};
