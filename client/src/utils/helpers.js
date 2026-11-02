export function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export function timeAgo(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now - d
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return formatDate(dateStr)
  } catch {
    return dateStr
  }
}

export function deadlineStatus(deadlineStr) {
  if (!deadlineStr) return { label: 'No deadline', color: 'neutral', daysLeft: null }
  try {
    const deadline = new Date(deadlineStr)
    const now = new Date()
    const diff = deadline - now
    const days = Math.ceil(diff / 86400000)
    if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: 'danger', daysLeft: days }
    if (days === 0) return { label: 'Due today', color: 'warning', daysLeft: 0 }
    if (days <= 3) return { label: `${days}d left`, color: 'warning', daysLeft: days }
    if (days <= 7) return { label: `${days}d left`, color: 'info', daysLeft: days }
    return { label: `${days}d left`, color: 'success', daysLeft: days }
  } catch {
    return { label: deadlineStr, color: 'neutral', daysLeft: null }
  }
}

export function priorityColor(priority) {
  const map = { high: 'high', medium: 'medium', low: 'low' }
  return map[priority?.toLowerCase()] || 'medium'
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function truncate(str, len = 80) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '…' : str
}

