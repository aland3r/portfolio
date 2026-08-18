export default function WireframeSlot({ label, className = '' }) {
  return (
    <div className={`wireframe-slot ${className}`.trim()} aria-hidden="true">
      {label ? <span className="wireframe-slot__label">{label}</span> : null}
    </div>
  )
}
