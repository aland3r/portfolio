import WireframeSlot from './WireframeSlot'

export default function ProjectHero({ coverUrl, label }) {
  return (
    <div className="publication-detail__hero">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          className="publication-detail__hero-media publication-detail__hero-image"
        />
      ) : (
        <WireframeSlot label={label} className="publication-detail__hero-media" />
      )}
    </div>
  )
}
