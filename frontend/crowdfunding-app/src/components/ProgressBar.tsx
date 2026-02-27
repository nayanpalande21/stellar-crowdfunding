import { useEffect, useState, useCallback } from 'react'
import { readContract, stroopsToXlm } from '../lib/contract'

interface Props {
  refreshTrigger?: number   // increment this to force a refresh
}

export function ProgressBar({ refreshTrigger = 0 }: Props) {
  const [goal, setGoal] = useState('0')
  const [total, setTotal] = useState('0')
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      const [g, t] = await Promise.all([
        readContract('get_goal'),
        readContract('get_total'),
      ])
      setGoal(g)
      setTotal(t)
    } catch {
      // keep last values on error
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load + after each donation
  useEffect(() => { fetch() }, [fetch, refreshTrigger])

  // Poll every 12 seconds for live updates
  useEffect(() => {
    const id = setInterval(fetch, 12_000)
    return () => clearInterval(id)
  }, [fetch])

  const goalNum = Number(goal)
  const totalNum = Number(total)
  const pct = goalNum === 0 ? 0 : Math.min(100, Math.round((totalNum / goalNum) * 100))
  const goalXlm = stroopsToXlm(goal)
  const totalXlm = stroopsToXlm(total)
  const remaining = Math.max(0, parseFloat(goalXlm) - parseFloat(totalXlm)).toFixed(2)

  const barColor =
    pct >= 100 ? '#10b981' :
    pct >= 60  ? '#f59e0b' :
    '#3b82f6'

  if (loading) return <div style={s.skeleton} />

  return (
    <div style={s.wrap}>
      {/* Numbers row */}
      <div style={s.row}>
        <div>
          <span style={s.big}>{totalXlm}</span>
          <span style={s.unit}> XLM raised</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={s.pct(barColor)}>{pct}%</span>
          <span style={s.unit}> funded</span>
        </div>
      </div>

      {/* Bar */}
      <div style={s.track}>
        <div
          style={{
            ...s.fill,
            width: `${pct}%`,
            background: barColor,
          }}
        />
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <span style={s.label}>Goal: {goalXlm} XLM</span>
        {pct < 100 && (
          <span style={s.label}>{remaining} XLM still needed</span>
        )}
        {pct >= 100 && (
          <span style={{ ...s.label, color: '#10b981', fontWeight: 700 }}>
            🎉 Goal reached!
          </span>
        )}
      </div>

      {/* Source indicator */}
      <div style={s.source}>
        <span style={s.sourceDot} />
        <span>Live from contract</span>
      </div>
    </div>
  )
}

const s = {
  skeleton: {
    height: 80,
    background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: 10,
  } as React.CSSProperties,
  wrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  } as React.CSSProperties,
  big: {
    fontWeight: 800,
    fontSize: 30,
    letterSpacing: '-0.04em',
    color: '#111827',
  } as React.CSSProperties,
  unit: {
    fontSize: 14,
    color: '#6b7280',
  } as React.CSSProperties,
  pct: (color: string): React.CSSProperties => ({
    fontWeight: 800,
    fontSize: 20,
    color,
    letterSpacing: '-0.02em',
  }),
  track: {
    height: 12,
    background: '#f3f4f6',
    borderRadius: 6,
    overflow: 'hidden',
  } as React.CSSProperties,
  fill: {
    height: '100%',
    borderRadius: 6,
    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
  } as React.CSSProperties,
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
  } as React.CSSProperties,
  label: {
    fontSize: 12,
    color: '#9ca3af',
  } as React.CSSProperties,
  source: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  } as React.CSSProperties,
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#10b981',
    animation: 'pulse 2s infinite',
  } as React.CSSProperties,
}