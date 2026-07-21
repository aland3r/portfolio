'use client'

import { getActiveGestaltProducts } from '../../lib/roadmap'
import { useLocale } from './LocaleProvider'

export default function UseCaseProductFilter({ value, onChange }) {
  const { t } = useLocale()
  const products = getActiveGestaltProducts()

  return (
    <div className="uc-product-filter" role="tablist" aria-label={t('cases.filterLabel')}>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'all'}
        className={
          value === 'all'
            ? 'uc-product-filter__btn uc-product-filter__btn--all uc-product-filter__btn--active'
            : 'uc-product-filter__btn uc-product-filter__btn--all'
        }
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
          className={
            value === product.code
              ? 'uc-product-filter__btn uc-product-filter__btn--code uc-product-filter__btn--active'
              : 'uc-product-filter__btn uc-product-filter__btn--code'
          }
          onClick={() => onChange(product.code)}
          title={product.name}
        >
          <span className="uc-product-filter__code">{product.code}</span>
          <span className="uc-product-filter__name">{product.name}</span>
        </button>
      ))}
    </div>
  )
}
