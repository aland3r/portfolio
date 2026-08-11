'use client'

import { getActiveGestaltProducts } from '../../lib/roadmap'
import { useLocale } from './LocaleProvider'

export default function UseCaseProductFilter({ value, onChange }) {
  const { t } = useLocale()
  const products = getActiveGestaltProducts()

  // Same visual language as the Projects filter (.article-filter) — identical
  // height and typography — wrapped so the /cases toolbar layout still applies.
  return (
    <div className="uc-product-filter article-filter" role="tablist" aria-label={t('cases.filterLabel')}>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'all'}
        className={value === 'all' ? 'article-filter__btn article-filter__btn--active' : 'article-filter__btn'}
        onClick={() => onChange('all')}
      >
        {t('progress.filterAll')}
      </button>
      {products.map((product) => (
        <button
          key={product.code}
          type="button"
          role="tab"
          aria-selected={value === product.code}
          className={value === product.code ? 'article-filter__btn article-filter__btn--active' : 'article-filter__btn'}
          onClick={() => onChange(product.code)}
          title={product.name}
        >
          {product.name}
        </button>
      ))}
    </div>
  )
}
