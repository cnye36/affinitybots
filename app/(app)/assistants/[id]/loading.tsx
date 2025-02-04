export default function Loading() {
  return (
    <>
      <div className="mb-8 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-96 bg-gray-200 rounded"></div>
      </div>

      <div className="h-[600px] bg-gray-50 rounded-lg animate-pulse">
        <div className="h-full flex items-center justify-center">
          <div className="text-gray-400">Loading chat...</div>
        </div>
      </div>
    </>
  );
}
