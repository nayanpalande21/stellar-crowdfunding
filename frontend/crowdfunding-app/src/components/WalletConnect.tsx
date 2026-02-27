import { WalletState } from '../lib/wallet'

interface Props {
  wallet: WalletState & {
    connect: () => void
    disconnect: () => void
  }
}

export function WalletConnect({ wallet }: Props) {
  const short = wallet.publicKey
    ? `${wallet.publicKey.slice(0, 5)}…${wallet.publicKey.slice(-4)}`
    : null

  if (wallet.connected && short) {
    return (
      <div style={s.pill}>
        <span style={s.dot} />
        <span style={s.key}>{short}</span>
        <button style={s.disconnectBtn} onClick={wallet.disconnect}>
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      style={s.connectBtn(wallet.connecting)}
      onClick={wallet.connect}
      disabled={wallet.connecting}
    >
      {wallet.connecting ? (
        <>
          <span style={spinner} />
          Connecting…
        </>
      ) : (
        'Connect Wallet'
      )}
    </button>
  )
}

const spinner: React.CSSProperties = {
  display: 'inline-block',
  width: 13,
  height: 13,
  border: '2px solid rgba(255,255,255,0.5)',
  borderTopColor: '#fff',
  borderRadius: '50%',
  animation: 'spin 0.7s linear infinite',
  marginRight: 6,
  verticalAlign: 'middle',
}

const s = {
  connectBtn: (loading: boolean): React.CSSProperties => ({
    background: loading ? '#4b5563' : '#111827',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 18px',
    fontWeight: 700,
    fontSize: 14,
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'background 0.2s',
    fontFamily: 'inherit',
  }),
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: '6px 14px',
  } as React.CSSProperties,
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 0 2px rgba(16,185,129,0.2)',
    flexShrink: 0,
  } as React.CSSProperties,
  key: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: 700,
    color: '#111827',
  } as React.CSSProperties,
  disconnectBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    color: '#6b7280',
    borderLeft: '1px solid #e5e7eb',
    paddingLeft: 10,
    marginLeft: 2,
    fontFamily: 'inherit',
  } as React.CSSProperties,
}