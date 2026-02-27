import { useState, useCallback } from 'react'
import { TransactionStatus } from './TransactionStatus'
import {
  TxState, TxStatus,
  buildDonateTx, submitSignedTx, friendbotFund,
  xlmToStroops, parseError, WalletError,
} from '../lib/contract'

interface Props {
  publicKey: string | null
  sign: (xdr: string) => Promise<string>
  onConnect: () => void
  onDonated: () => void   // callback to refresh progress bar
}

const QUICK_AMOUNTS = [5, 10, 50, 100]

// Error type → user-facing config
const ERROR_CFG: Record<string, { icon: string; bg: string; border: string; color: string; fix: string }> = {
  WALLET_NOT_FOUND: {
    icon: '🔌',
    bg: '#fff7ed', border: '#fed7aa', color: '#7c2d12',
    fix: 'Install Freighter from freighter.app, then refresh.',
  },
  USER_REJECTED: {
    icon: '✋',
    bg: '#fefce8', border: '#fde047', color: '#713f12',
    fix: 'Open your wallet and click Approve.',
  },
  INSUFFICIENT_BALANCE: {
    icon: '💸',
    bg: '#fef2f2', border: '#fca5a5', color: '#7f1d1d',
    fix: 'Click "Get Test XLM" to fund your testnet account via Friendbot.',
  },
  NETWORK_ERROR: {
    icon: '📡',
    bg: '#eff6ff', border: '#93c5fd', color: '#1e3a5f',
    fix: 'Check your internet connection and try again.',
  },
  CONTRACT_ERROR: {
    icon: '📋',
    bg: '#fdf4ff', border: '#e9d5ff', color: '#581c87',
    fix: 'Contract returned an error. Check the parameters.',
  },
  UNKNOWN: {
    icon: '⚠️',
    bg: '#f9fafb', border: '#d1d5db', color: '#374151',
    fix: 'Please try again.',
  },
}

export function DonateCard({ publicKey, sign, onConnect, onDonated }: Props) {
  const [amount, setAmount] = useState('10')
  const [amountErr, setAmountErr] = useState('')
  const [tx, setTx] = useState<TxState>({ status: 'idle' })
  const [walletErr, setWalletErr] = useState<WalletError | null>(null)
  const [funding, setFunding] = useState(false)
  const [fundMsg, setFundMsg] = useState('')

  const setStatus = (status: TxStatus, extra?: Partial<TxState>) =>
    setTx({ status, ...extra })

  const handleDonate = useCallback(async () => {
    const val = parseFloat(amount)
    if (!amount || isNaN(val) || val <= 0) {
      setAmountErr('Enter a valid amount')
      return
    }
    if (val < 0.1) {
      setAmountErr('Minimum donation is 0.1 XLM')
      return
    }
    setAmountErr('')
    setWalletErr(null)

    try {
      setStatus('building', { message: 'Preparing your donation…' })
      const stroops = xlmToStroops(val)
      const xdr = await buildDonateTx(publicKey!, stroops)

      setStatus('signing', { message: 'Check your wallet — click Approve.' })
      const signed = await sign(xdr)

      setStatus('pending', { message: 'Submitting to Stellar testnet…' })
      const hash = await submitSignedTx(signed)

      setStatus('success', {
        hash,
        message: `Successfully donated ${val} XLM!`,
      })
      setTimeout(onDonated, 2500)
    } catch (err) {
      const e = parseError(err)
      setWalletErr(e)
      setStatus('error', { error: e.type, message: e.message })
    }
  }, [amount, publicKey, sign, onDonated])

  const handleFund = async () => {
    if (!publicKey) return
    setFunding(true)
    setFundMsg('Requesting from Friendbot…')
    try {
      await friendbotFund(publicKey)
      setFundMsg('✅ Account funded with 10,000 XLM!')
    } catch (e) {
      setFundMsg(`❌ ${parseError(e).message}`)
    } finally {
      setFunding(false)
      setTimeout(() => setFundMsg(''), 5000)
    }
  }

  const isLoading = ['building', 'signing', 'pending'].includes(tx.status)
  const errCfg = walletErr ? (ERROR_CFG[walletErr.type] ?? ERROR_CFG.UNKNOWN) : null

  return (
    <div style={s.card}>
      <h2 style={s.title}>Make a Donation</h2>

      {!publicKey ? (
        // ─── Not connected ──────────────────────────────────────────────
        <div style={s.connectBox}>
          <div style={s.connectIcon}>🔗</div>
          <p style={s.connectMsg}>
            Connect your Stellar wallet to donate XLM on-chain.
          </p>
          <button style={s.connectBtnLg} onClick={onConnect}>
            Connect Wallet
          </button>
          <p style={s.supportedNote}>
            Supports Freighter, xBull, Lobstr & more
          </p>
        </div>
      ) : (
        // ─── Connected — show form ────────────────────────────────────
        <div style={s.form}>
          {/* Friendbot helper */}
          <div style={s.fundRow}>
            <button style={s.friendbotBtn} onClick={handleFund} disabled={funding}>
              {funding ? <span style={miniSpinner} /> : '🚰'}
              {funding ? ' Funding…' : ' Get Test XLM'}
            </button>
            {fundMsg && <span style={s.fundMsg}>{fundMsg}</span>}
          </div>

          {/* Amount input */}
          <div style={s.field}>
            <label style={s.label}>Donation Amount</label>
            <div style={s.inputWrap}>
              <input
                type="number"
                value={amount}
                onChange={e => { setAmount(e.target.value); setAmountErr('') }}
                style={s.input(!!amountErr)}
                min="0.1"
                step="1"
                disabled={isLoading}
                placeholder="10"
              />
              <span style={s.xlmUnit}>XLM</span>
            </div>
            {amountErr && <span style={s.fieldErr}>{amountErr}</span>}
          </div>

          {/* Quick select */}
          <div style={s.quickRow}>
            {QUICK_AMOUNTS.map(n => (
              <button
                key={n}
                style={s.quickBtn(amount === String(n))}
                onClick={() => { setAmount(String(n)); setAmountErr('') }}
                disabled={isLoading}
              >
                {n} XLM
              </button>
            ))}
          </div>

          {/* Error banner */}
          {errCfg && walletErr && (
            <div style={{ background: errCfg.bg, border: `1px solid ${errCfg.border}`, borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{errCfg.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: errCfg.color }}>{walletErr.message}</div>
                <div style={{ fontSize: 12, color: errCfg.color, opacity: 0.8, marginTop: 2 }}>{errCfg.fix}</div>
              </div>
              <button
                onClick={() => setWalletErr(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: errCfg.color, fontSize: 14, alignSelf: 'flex-start', fontFamily: 'inherit' }}
              >✕</button>
            </div>
          )}

          {/* Transaction status */}
          <TransactionStatus tx={tx} onReset={() => { setTx({ status: 'idle' }); setWalletErr(null) }} />

          {/* Donate button */}
          <button
            style={s.donateBtn(isLoading)}
            onClick={handleDonate}
            disabled={isLoading}
          >
            {isLoading ? (
              <><span style={btnSpinner} /> Processing…</>
            ) : (
              `Donate ${parseFloat(amount) || 0} XLM`
            )}
          </button>

          {/* Summary */}
          <div style={s.summary}>
            <Row label="Network">Stellar Testnet</Row>
            <Row label="Contract">{`CB7YEL…JF22`}</Row>
            <Row label="Function"><code style={{ fontFamily: 'monospace', fontSize: 12 }}>donate(from, amount)</code></Row>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ color: '#9ca3af' }}>{label}</span>
      <span style={{ fontWeight: 500, color: '#374151' }}>{children}</span>
    </div>
  )
}

const miniSpinner: React.CSSProperties = {
  display: 'inline-block', width: 12, height: 12,
  border: '2px solid #059669', borderTopColor: 'transparent',
  borderRadius: '50%', animation: 'spin 0.7s linear infinite',
  verticalAlign: 'middle',
}

const btnSpinner: React.CSSProperties = {
  display: 'inline-block', width: 15, height: 15,
  border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
  borderRadius: '50%', animation: 'spin 0.7s linear infinite',
}

const s = {
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 28,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  } as React.CSSProperties,
  title: {
    fontWeight: 800,
    fontSize: 20,
    color: '#111827',
    letterSpacing: '-0.03em',
    marginBottom: 20,
  } as React.CSSProperties,

  // not connected
  connectBox: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 12, padding: '20px 0' },
  connectIcon: { fontSize: 40 } as React.CSSProperties,
  connectMsg: { fontSize: 14, color: '#6b7280', textAlign: 'center' as const, maxWidth: 260 },
  connectBtnLg: {
    background: '#111827', color: '#fff', border: 'none', borderRadius: 10,
    padding: '12px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  supportedNote: { fontSize: 12, color: '#9ca3af' } as React.CSSProperties,

  // form
  form: { display: 'flex', flexDirection: 'column' as const, gap: 14 },
  fundRow: { display: 'flex', alignItems: 'center', gap: 10 } as React.CSSProperties,
  friendbotBtn: {
    background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d',
    borderRadius: 8, padding: '7px 14px', fontWeight: 600, fontSize: 13,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
  } as React.CSSProperties,
  fundMsg: { fontSize: 13, color: '#374151' } as React.CSSProperties,

  field: { display: 'flex', flexDirection: 'column' as const, gap: 5 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' } as React.CSSProperties,
  inputWrap: { position: 'relative' as const },
  input: (err: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '11px 48px 11px 14px',
    border: `1.5px solid ${err ? '#f87171' : '#d1d5db'}`,
    borderRadius: 8,
    fontSize: 18,
    fontWeight: 700,
    color: '#111827',
    background: '#fafafa',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.15s',
  }),
  xlmUnit: {
    position: 'absolute' as const, right: 12, top: '50%',
    transform: 'translateY(-50%)', fontSize: 13, fontWeight: 700, color: '#6b7280',
  },
  fieldErr: { fontSize: 12, color: '#ef4444', fontWeight: 500 } as React.CSSProperties,

  quickRow: { display: 'flex', gap: 8 } as React.CSSProperties,
  quickBtn: (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '8px 4px',
    border: `1.5px solid ${active ? '#3b82f6' : '#e5e7eb'}`,
    borderRadius: 8,
    background: active ? '#eff6ff' : 'transparent',
    color: active ? '#1d4ed8' : '#6b7280',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
    fontFamily: 'inherit',
  }),

  donateBtn: (disabled: boolean): React.CSSProperties => ({
    width: '100%', padding: '14px',
    background: disabled ? '#d1d5db' : '#111827',
    color: disabled ? '#9ca3af' : '#fff',
    border: 'none', borderRadius: 10,
    fontWeight: 700, fontSize: 16, cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'background 0.2s', fontFamily: 'inherit',
  }),

  summary: { display: 'flex', flexDirection: 'column' as const, marginTop: 4 },
}