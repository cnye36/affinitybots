export default function Loading() {
  return (
    <div className="flex flex-col h-screen">
      <div className="border-b p-4 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-96 bg-gray-200 rounded"></div>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex items-center justify-center">
          <div className="text-gray-400">Loading agent...</div>
        </div>
      </div>
    </div>
  );
}
