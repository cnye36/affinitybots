import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardHeaderProps {
  title: string
  backHref?: string
}

export default function DashboardHeader({ title, backHref }: DashboardHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-8">
      {backHref && (
        <Link href={backHref}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
      )}
      <h1 className="text-3xl font-bold">{title}</h1>
    </div>
  )
} 