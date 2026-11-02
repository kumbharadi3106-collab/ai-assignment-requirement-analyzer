import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react'

const icons = {
  error: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
}

export default function Alert({ type = 'info', children }) {
  const Icon = icons[type]
  return (
    <div className={`alert alert-${type}`}>
      <Icon size={16} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{children}</span>
    </div>
  )
}

