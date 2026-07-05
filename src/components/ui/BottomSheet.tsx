import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { DialogOverlay } from './Dialog'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export default function BottomSheet({ open, onClose, title, children, className }: Props) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogPrimitive.Portal>
        <DialogOverlay />
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <DialogPrimitive.Content
            className={cn(
              'relative z-10 flex w-full max-h-[85dvh] flex-col overflow-hidden bg-card text-card-foreground shadow-(--shadow-popover)',
              'rounded-t-2xl border-t border-border sm:max-w-sm sm:rounded-2xl sm:border',
              'data-[state=open]:animate-slide-in-from-bottom sm:data-[state=open]:animate-scale-in',
              'focus-visible:outline-none',
              className
            )}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {title ? (
              <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
            ) : (
              <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
            )}

            {/* Drag handle (mobile only) */}
            <div className="flex shrink-0 justify-center pb-1 pt-2.5 sm:hidden">
              <div className="h-1.5 w-10 rounded-full bg-border" />
            </div>

            {title && (
              <div className="flex shrink-0 items-center justify-between border-b border-border px-5 pb-3 pt-2 sm:pt-5">
                <h2 className="text-base font-semibold text-foreground">{title}</h2>
                <DialogPrimitive.Close className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <X className="size-5" />
                </DialogPrimitive.Close>
              </div>
            )}

            <div className="overflow-y-auto scrollbar-thin">{children}</div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
