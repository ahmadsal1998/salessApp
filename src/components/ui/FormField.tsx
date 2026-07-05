import type { ReactNode } from 'react'
import { Label } from './Label'
import { cn } from '@/utils/cn'

interface FormFieldProps {
  label?: ReactNode
  htmlFor?: string
  error?: string
  required?: boolean
  hint?: string
  className?: string
  children: ReactNode
}

export function FormField({ label, htmlFor, error, required, hint, className, children }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="text-destructive ms-0.5">*</span>}
        </Label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
