'use client'

import { useCallback, useEffect, useRef } from 'react'

function syncTextareaHeight(element) {
  if (!element) return
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}

export default function AutoGrowTextarea({ value, onChange, ...props }) {
  const ref = useRef(null)

  const resize = useCallback(() => {
    syncTextareaHeight(ref.current)
  }, [])

  useEffect(() => {
    resize()
  }, [value, resize])

  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      onChange={(event) => {
        onChange(event)
        syncTextareaHeight(event.currentTarget)
      }}
      {...props}
      spellCheck={false}
    />
  )
}
