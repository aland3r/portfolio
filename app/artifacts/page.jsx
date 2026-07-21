'use client'

import { useEffect, useState } from 'react'
import staticArtifacts from '../../content/artifacts.json'
import Link from 'next/link'
import { fetchPublicArtifacts, isSupabaseConfigured } from '@gestalt/auth'
import { useLocale } from '../components/LocaleProvider'

function mapStaticArtifact(item) {
  return {
    id: item.id,
    productCode: item.product,
    type: item.type ?? 'other',
    title: item.title,
    href: item.href ?? null,
  }
}

export default function ArtifactsPage() {
  const { t } = useLocale()
  const [artifacts, setArtifacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState('static')

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (isSupabaseConfigured()) {
        try {
          const rows = await fetchPublicArtifacts()
          if (!cancelled && rows && rows.length > 0) {
            setArtifacts(rows)
            setSource('db')
            setLoading(false)
            return
          }
        } catch {
          // fall through to static JSON
        }
      }

      if (!cancelled) {
        setArtifacts(staticArtifacts.map(mapStaticArtifact))
        setSource('static')
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="panel">
      <p className="eyebrow">{t('artifacts.eyebrow')}</p>
      <h1>{t('artifacts.title')}</h1>

      {loading ? (
        <p className="muted">{t('misc.loading')}</p>
      ) : artifacts.length === 0 ? (
        <p className="lead">{t('artifacts.empty')}</p>
      ) : (
        <ul className="artifact-list">
          {artifacts.map((item) => (
            <li key={item.id} className="artifact-card">
              <span className="artifact-card__product">
                {item.productCode}
                {item.type ? ` · ${t(`artifacts.types.${item.type}`, item.type)}` : ''}
              </span>
              <h2>{item.title}</h2>
              {item.summary ? <p className="muted">{item.summary}</p> : null}
              {item.href ? (
                <a href={item.href} className="button" target="_blank" rel="noreferrer">
                  {t('artifacts.open')}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <p className="muted artifact-foot">
        <Link href="/apps">{t('artifacts.apps')}</Link>
        {source === 'db' ? ` · ${t('artifacts.fromDb')}` : null}
      </p>
    </section>
  )
}
