export default function WireframeSlot({ label = 'Image', className = '' }) {
  return (
    <div className={`wireframe-slot ${className}`.trim()} aria-hidden="true">
      <span className="wireframe-slot__label">{label}</span>
    </div>
  )
}
