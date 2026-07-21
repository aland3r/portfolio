'use client'

import { Fragment } from 'react'
import { groupStepsByFlow } from '../../lib/use-case-step-flow'
import { composeDescriptionParagraph, renderProseInline } from './use-case-prose'

function renderTableLabel(label) {
  if (typeof label !== 'string' || !label.includes('-')) return label

  return label.split('-').map((segment, index, segments) => (
    <Fragment key={`${segment}-${index}`}>
      {segment}
      {index < segments.length - 1 ? (
        <>
          -
          <wbr />
        </>
      ) : null}
    </Fragment>
  ))
}

function flowSectionLabel(kind, labels) {
  if (kind === 'alternative') return labels.stepsAlternatives ?? 'Alternatives'
  if (kind === 'exception') return labels.stepsExceptions ?? 'Exceptions'
  return labels.stepsMain ?? labels.steps ?? 'Main path'
}

function DescriptionBlock({ why, what, bounds, summary, labels, folio = false }) {
  const paragraph = composeDescriptionParagraph(why, what, bounds, summary)
  if (!paragraph) return null

  const className = folio ? 'uc-folio__description' : 'uc-vault__description'

  return (
    <aside className={className} aria-label={labels.description}>
      <p className={folio ? 'uc-folio__description-label' : 'uc-vault__description-label'}>
        {labels.description}
      </p>
      <p className={folio ? 'uc-folio__description-text uc-folio__prose' : 'uc-vault__description-line'}>
        {renderProseInline(paragraph)}
      </p>
    </aside>
  )
}

function FolioSpecTable({ useCase, labels, compact = false }) {
  const headerRows = (
    compact
      ? []
      : [
          [labels.useCaseId, useCase.abpId],
          [labels.useCaseName, useCase.title],
        ]
  ).filter(([, value]) => value)

  const actorObjectPair = [
    [labels.actor, useCase.actor],
    [labels.object, useCase.objectName],
  ].filter(([, value]) => value)

  const conditionRows = [
    [labels.preCondition, useCase.preCondition],
    [labels.postCondition, useCase.postCondition],
  ].filter(([, value]) => value)

  const steps = useCase.steps ?? []
  const stepGroups = groupStepsByFlow(steps)
  const hasMeta = headerRows.length > 0 || actorObjectPair.length > 0 || conditionRows.length > 0
  const metaIsQuad = actorObjectPair.length === 2
  const metaValueColSpan = metaIsQuad ? 3 : 1

  if (!hasMeta && !steps.length) {
    return null
  }

  function renderActorObjectRow() {
    if (!actorObjectPair.length) return null

    if (metaIsQuad) {
      const [[actorLabel, actorValue], [objectLabel, objectValue]] = actorObjectPair
      return (
        <tr className="uc-folio__table-meta-row uc-folio__table-meta-row--quad">
          <th scope="row" className="uc-folio__table-meta-label">{actorLabel}</th>
          <td className="uc-folio__prose">{renderProseInline(actorValue)}</td>
          <th scope="row" className="uc-folio__table-meta-label uc-folio__table-meta-label--inline">{objectLabel}</th>
          <td className="uc-folio__prose">{renderProseInline(objectValue)}</td>
        </tr>
      )
    }

    const [[label, value]] = actorObjectPair
    return (
      <tr className="uc-folio__table-meta-row">
        <th scope="row" className="uc-folio__table-meta-label">{label}</th>
        <td className="uc-folio__prose" colSpan={metaValueColSpan}>{renderProseInline(value)}</td>
      </tr>
    )
  }

  function renderStepColumnHead() {
    return (
      <tr className="uc-folio__table-step-head">
        <th scope="col" className="uc-folio__table-step-key">{renderTableLabel(labels.step)}</th>
        <th scope="col" className="uc-folio__table-step-head-label">{renderTableLabel(labels.actorAction)}</th>
        <th scope="col" className="uc-folio__table-step-head-label">{renderTableLabel(labels.systemResponse)}</th>
      </tr>
    )
  }

  function renderStepGroup(group) {
    const bandLabel = flowSectionLabel(group.kind, labels)
    return (
      <Fragment key={group.kind}>
        {group.showBand ? (
          <tr className={`uc-folio__table-flow-band uc-folio__table-flow-band--${group.kind}`}>
            <th scope="colgroup" colSpan={3}>
              {bandLabel}
              <span className="uc-folio__table-flow-count">{group.steps.length}</span>
            </th>
          </tr>
        ) : null}
        {renderStepColumnHead()}
        {group.steps.map((step) => (
          <tr
            key={step.id ?? step.stepKey}
            className={`uc-folio__table-step-row uc-folio__table-step-row--${group.kind}`}
          >
            <th scope="row" className="uc-folio__table-step-key">{step.stepKey}</th>
            <td className="uc-folio__prose">{renderProseInline(step.actorAction)}</td>
            <td className="uc-folio__prose">{renderProseInline(step.systemResponse)}</td>
          </tr>
        ))}
      </Fragment>
    )
  }

  return (
    <div className="uc-folio__table-wrap">
      {hasMeta ? (
        <table className={metaIsQuad ? 'uc-folio__table uc-folio__table--meta uc-folio__table--meta-quad' : 'uc-folio__table uc-folio__table--meta'}>
          <colgroup>
            <col className="uc-folio__table-col uc-folio__table-col--meta-key" />
            <col className="uc-folio__table-col uc-folio__table-col--meta-value" />
            {metaIsQuad ? (
              <>
                <col className="uc-folio__table-col uc-folio__table-col--meta-inline-key" />
                <col className="uc-folio__table-col uc-folio__table-col--meta-value" />
              </>
            ) : null}
          </colgroup>
          <tbody>
            {labels.metaContext ? (
              <tr className="uc-folio__table-flow-band uc-folio__table-flow-band--main">
                <th scope="colgroup" colSpan={metaIsQuad ? 4 : 2}>{labels.metaContext}</th>
              </tr>
            ) : null}
            {headerRows.map(([label, value]) => (
              <tr key={label} className="uc-folio__table-meta-row">
                <th scope="row" className="uc-folio__table-meta-label">{label}</th>
                <td className="uc-folio__prose" colSpan={metaValueColSpan}>{renderProseInline(value)}</td>
              </tr>
            ))}
            {renderActorObjectRow()}
            {conditionRows.map(([label, value], index) => (
              <tr
                key={label}
                className={
                  steps.length > 0 && index === conditionRows.length - 1
                    ? 'uc-folio__table-meta-row uc-folio__table-meta-row--before-steps'
                    : 'uc-folio__table-meta-row'
                }
              >
                <th scope="row" className="uc-folio__table-meta-label">{label}</th>
                <td className="uc-folio__prose" colSpan={metaValueColSpan}>{renderProseInline(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {steps.length > 0 ? (
        <table className="uc-folio__table uc-folio__table--steps">
          <colgroup>
            <col className="uc-folio__table-col uc-folio__table-col--key" />
            <col className="uc-folio__table-col uc-folio__table-col--prose" />
            <col className="uc-folio__table-col uc-folio__table-col--prose" />
          </colgroup>
          <tbody>
            {stepGroups.map((group) => renderStepGroup(group))}
          </tbody>
        </table>
      ) : null}
    </div>
  )
}

function MetadataTable({ useCase, labels }) {
  const rows = [
    [labels.useCaseId, useCase.abpId],
    [labels.useCaseName, useCase.title],
    [labels.actor, useCase.actor],
    [labels.object, useCase.objectName],
    [labels.preCondition, useCase.preCondition],
    [labels.postCondition, useCase.postCondition],
  ].filter(([, value]) => value)

  if (!rows.length) return null

  return (
    <table className="uc-vault__meta-table">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>{renderProseInline(value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function StepsTable({ steps, labels }) {
  if (!steps.length) return null

  const stepGroups = groupStepsByFlow(steps)

  return (
    <div className="uc-vault__steps">
      {stepGroups.map((group) => (
        <table
          key={group.kind}
          className={`uc-vault__steps-table uc-vault__steps-table--${group.kind}`}
        >
          {group.showBand ? (
            <caption className={`uc-vault__steps-caption uc-vault__steps-caption--${group.kind}`}>
              {flowSectionLabel(group.kind, labels)}
              <span className="uc-vault__steps-count">{group.steps.length}</span>
            </caption>
          ) : null}
          <thead>
            <tr>
              <th scope="col">{labels.step}</th>
              <th scope="col">{labels.actorAction}</th>
              <th scope="col">{labels.systemResponse}</th>
            </tr>
          </thead>
          <tbody>
            {group.steps.map((step) => (
              <tr key={step.id ?? step.stepKey}>
                <th scope="row">{step.stepKey}</th>
                <td>{renderProseInline(step.actorAction)}</td>
                <td>{renderProseInline(step.systemResponse)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  )
}

function BodySections({ bodyMd, skipTitles = [] }) {
  if (!bodyMd?.trim()) return null

  const sections = bodyMd
    .split(/^### /m)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .filter((section) => {
      const title = section.split('\n')[0]?.trim() ?? ''
      return !skipTitles.some((skip) => title.toLowerCase().startsWith(skip.toLowerCase()))
    })

  if (!sections.length) return null

  return (
    <div className="uc-vault__sections">
      {sections.map((section) => {
        const [titleLine, ...rest] = section.split('\n')
        const body = rest.join('\n').trim()
        return (
          <section key={titleLine} className="uc-vault__section">
            <h2>{titleLine}</h2>
            {body ? (
              <div className="publication-prose publication-prose--body">
                {body.split(/\n{2,}/).map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{renderProseInline(paragraph.replace(/^\*\s+/, ''))}</p>
                ))}
              </div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}

export default function UseCaseVaultView({ useCase, labels, layout = 'default', compact = false }) {
  if (layout === 'folio') {
    return (
      <article className={compact ? 'uc-folio uc-folio--compact' : 'uc-folio'}>
        <DescriptionBlock
          why={useCase.descriptionWhy}
          what={useCase.descriptionWhat}
          bounds={useCase.descriptionBounds}
          summary={useCase.summary}
          labels={labels}
          folio
        />
        <FolioSpecTable useCase={useCase} labels={labels} compact={compact} />
      </article>
    )
  }

  const skipBody = [
    'Acceptance Criteria',
    'Critérios de aceite',
    'Akzeptanzkriterien',
    'Extension Points',
  ]

  return (
    <article className="uc-vault">
      <DescriptionBlock
        why={useCase.descriptionWhy}
        what={useCase.descriptionWhat}
        bounds={useCase.descriptionBounds}
        summary={useCase.summary}
        labels={labels}
      />
      <MetadataTable useCase={useCase} labels={labels} />
      <StepsTable steps={useCase.steps ?? []} labels={labels} />
      <BodySections bodyMd={useCase.bodyMd} skipTitles={skipBody} />
    </article>
  )
}
