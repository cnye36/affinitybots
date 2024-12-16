import { ChevronLeft } from 'lucide-react'

interface SidebarTriggerProps {
  onHover: () => void
}

export function SidebarTrigger({ onHover }: SidebarTriggerProps) {
  return (
    <div
      className="fixed top-1/2 right-0 transform -translate-y-1/2 cursor-pointer"
      onMouseEnter={onHover}
    >
      <div className="bg-primary text-primary-foreground p-2 rounded-l-md">
        <ChevronLeft size={24} />
      </div>
    </div>
  )
}

