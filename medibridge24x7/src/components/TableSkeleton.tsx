interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
}

export const TableSkeleton = ({
  rows = 5,
  columns = 5,
  hasHeader = true,
}: TableSkeletonProps) => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          {hasHeader && (
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr>
                {Array.from({ length: columns }).map((_, index) => (
                  <th key={index} className="px-6 py-4 text-left">
                    <div className="animate-pulse">
                      <div className="h-3 bg-slate-700 rounded w-24"></div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-slate-700">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-750">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div className="animate-pulse">
                      {colIndex === 0 ? (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-slate-700 rounded-full"></div>
                          <div className="h-4 bg-slate-700 rounded w-32"></div>
                        </div>
                      ) : colIndex === columns - 1 ? (
                        <div className="flex items-center space-x-2 justify-end">
                          <div className="h-8 w-20 bg-slate-700 rounded"></div>
                          <div className="h-8 w-20 bg-slate-700 rounded"></div>
                        </div>
                      ) : (
                        <div
                          className="h-4 bg-slate-700 rounded"
                          style={{
                            width: `${Math.random() * 40 + 60}%`,
                          }}
                        ></div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
