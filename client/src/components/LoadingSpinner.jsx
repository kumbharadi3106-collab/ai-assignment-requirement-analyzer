export default function LoadingSpinner({ message = 'Loading…', size = 'md' }) {
  const spinnerSize = size === 'sm' ? 16 : size === 'lg' ? 32 : 20
  return (
    <div className="loading-overlay">
      <div
        className="loading-spinner"
        style={{ width: spinnerSize, height: spinnerSize }}
      />
      {message && <p className="loading-text">{message}</p>}
    </div>
  )
}

