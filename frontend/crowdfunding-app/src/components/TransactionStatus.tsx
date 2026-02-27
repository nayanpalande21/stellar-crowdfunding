import { TxState, EXPLORER_BASE } from '../lib/contract'

interface Props {
  tx: TxState
  onReset?: () => void
}

const CONFIG = {
  idle: null,
  building: {
    icon: '⚙️',
    label: 'Building Transaction',
    sub: 'Preparing your donation on-chain…',
    bg: '#eff6ff',
    border: '#bfdbfe',
    color: '#1e40af',
    showSpinner: true,
  },
  signing: {
    icon: '✍️',
    label: 'Waiting for Approval',
    sub: 'Open your wallet and click Approve.',
    bg: '#faf5ff',
    border: '#e9d5ff',
    color: '#6b21a8',
    showSpinner: true,
  },
  pending: {
    icon: '🚀',
    label: 'Broadcasting',
    sub: 'Submitting transaction to Stellar testnet…',
    bg: '#f0f9ff',
    border: '#7dd3fc',
    color: '#0369a1',
    showSpinner: true,
  },
  success: {
    icon: '✅',
    label: 'Donation Confirmed!',
    sub: 'Your XLM is recorded on-chain.',
    bg: '#f0fdf4',
    border: '#86efac',
    color: '#166534',
    showSpinner: false,
  },
  error: {
    icon: '❌',
    label: 'Transaction Failed',
    sub: '',
    bg: '#fef2f2',
    border: '#fca5a5',
    color: '#991b1b',
    showSpinner: false,
  },
} as const

// Error type helpers — map WalletErrorType to a fix message
const ERROR_FIXES: Record<string, string> = {
  WALLET_NOT_FOUND: '→ Install Freighter at freighter.app',
  USER_REJECTED: '→ Reopen the modal and click Approve.',
  INSUFFICIENT_BALANCE: '→ Click "Get Test XLM" to fund your account.',
  NETWORK_ERROR: '→ Check your internet and try again.',
  CONTRACT_ERROR: '→ Check contract function parameters.',
  UNKNOWN: '→ Please try again.',
}

export function TransactionStatus({ tx, onReset }: Props) {
  if (tx.status === 'idle') return null

  const cfg = CONFIG[tx.status]
  if (!cfg) return null

  // Try to extract error type from error message prefix
  const errorType = tx.error
    ? Object.keys(ERROR_FIXES).find(k => tx.error?.includes(k)) ?? 'UNKNOWN'
    : 'UNKNOWN'
  const fixHint = ERROR_FIXES[errorType]

  return (
    <div
      style={{
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {cfg.showSpinner ? (
            <span
              style={{
                display: 'inline-block',
                width: 18,
                height: 18,
                border: `2.5px solid ${cfg.color}`,
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.75s linear infinite',
                flexShrink: 0,
              }}
            />
          ) : (
            <span style={{ fontSize: 18 }}>{cfg.icon}</span>
          )}
          <span style={{ fontWeight: 700, fontSize: 14, color: cfg.color }}>{cfg.label}</span>
        </div>

        {/* Close button on terminal states */}
        {(tx.status === 'success' || tx.status === 'error') && onReset && (
          <button
            onClick={onReset}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              color: cfg.color,
              opacity: 0.6,
              fontFamily: 'inherit',
              padding: '0 2px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Subtitle / message */}
      {(tx.message || cfg.sub) && (
        <div style={{ fontSize: 13, color: cfg.color, opacity: 0.85, paddingLeft: 28 }}>
          {tx.message || cfg.sub}
        </div>
      )}

      {/* Error detail + fix */}
      {tx.status === 'error' && tx.error && (
        <div style={{ paddingLeft: 28 }}>
          <div style={{ fontSize: 13, color: '#991b1b', fontWeight: 500 }}>{tx.error}</div>
          <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 3, opacity: 0.8 }}>{fixHint}</div>
        </div>
      )}

      {/* Explorer link on success */}
      {tx.status === 'success' && tx.hash && (
        <div style={{ paddingLeft: 28, display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <a
            href={`${EXPLORER_BASE}/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#166534',
              textDecoration: 'none',
              borderBottom: '1px solid #86efac',
            }}
          >
            View on Stellar Expert ↗
          </a>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>
            {tx.hash.slice(0, 10)}…{tx.hash.slice(-6)}
          </span>
        </div>
      )}

      {/* Step indicator */}
      <div style={{ paddingLeft: 28, display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
        {(['building', 'signing', 'pending', 'success'] as const).map((step, i) => {
          const statuses = ['building', 'signing', 'pending', 'success'] as const
          const currentIdx = statuses.indexOf(tx.status as typeof statuses[number])
          const stepIdx = i
          const done = currentIdx > stepIdx || tx.status === 'success'
          const active = currentIdx === stepIdx
          const isError = tx.status === 'error'
          return (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: isError && active ? '#fca5a5' : done ? cfg.color : active ? cfg.color : '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: done || active ? '#fff' : '#9ca3af',
                  fontWeight: 700,
                  transition: 'all 0.3s',
                  flexShrink: 0,
                }}
              >
                {done ? '✓' : String(i + 1)}
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: active ? cfg.color : done ? '#6b7280' : '#d1d5db',
                  fontWeight: active ? 700 : 400,
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                }}
              >
                {step}
              </span>
              {i < 3 && <div style={{ width: 12, height: 1, background: done ? cfg.color : '#e5e7eb', margin: '0 2px' }} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}