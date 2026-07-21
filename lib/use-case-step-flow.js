/** Classify vault step keys: main `1`, alternatives `1a`, exceptions `2.1`. */

export function classifyStepFlow(stepKey) {
  const key = String(stepKey ?? '').trim()
  if (/^\d+\.\d+/.test(key)) return 'exception'
  if (/^\d+[a-z]$/i.test(key)) return 'alternative'
  return 'main'
}

const FLOW_ORDER = ['main', 'alternative', 'exception']

export function groupStepsByFlow(steps = []) {
  const groups = {
    main: [],
    alternative: [],
    exception: [],
  }

  for (const step of steps) {
    groups[classifyStepFlow(step.stepKey)].push(step)
  }

  const hasBranches = groups.alternative.length > 0 || groups.exception.length > 0

  return FLOW_ORDER.map((kind) => ({
    kind,
    steps: groups[kind],
  })).filter((group) => group.steps.length > 0).map((group) => ({
    ...group,
    showBand: hasBranches,
  }))
}
