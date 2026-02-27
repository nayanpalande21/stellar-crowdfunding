import {
  Contract,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  xdr,
  Horizon,
} from '@stellar/stellar-sdk'

// ─── Your deployed contract ──────────────────────────────────────────────────
export const CONTRACT_ID = 'CB7YEL2KI53QJ5V7HH5VKFZ3WOKLZN2GT24KD3535TCDAWRX3VM7JF22'
export const NETWORK_PASSPHRASE = Networks.TESTNET
export const HORIZON_URL = 'https://horizon-testnet.stellar.org'
export const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org'
export const EXPLORER_BASE = 'https://stellar.expert/explorer/testnet'

export const horizonServer = new Horizon.Server(HORIZON_URL)

// ─── Error types ─────────────────────────────────────────────────────────────
export type WalletErrorType =
  | 'WALLET_NOT_FOUND'
  | 'USER_REJECTED'
  | 'INSUFFICIENT_BALANCE'
  | 'NETWORK_ERROR'
  | 'CONTRACT_ERROR'
  | 'UNKNOWN'

export class WalletError extends Error {
  constructor(
    public readonly type: WalletErrorType,
    message: string
  ) {
    super(message)
    this.name = 'WalletError'
  }
}

export function parseError(err: unknown): WalletError {
  const msg = err instanceof Error ? err.message : String(err)
  const low = msg.toLowerCase()

  if (low.includes('not found') || low.includes('not installed') || low.includes('freighter'))
    return new WalletError('WALLET_NOT_FOUND', 'Wallet not found. Install Freighter at freighter.app')

  if (low.includes('reject') || low.includes('declined') || low.includes('cancel') || low.includes('denied'))
    return new WalletError('USER_REJECTED', 'Transaction rejected. Please approve in your wallet.')

  if (low.includes('insufficient') || low.includes('underfunded') || low.includes('balance'))
    return new WalletError('INSUFFICIENT_BALANCE', 'Not enough XLM. Click "Get Test XLM" to fund your account.')

  if (low.includes('network') || low.includes('fetch') || low.includes('timeout'))
    return new WalletError('NETWORK_ERROR', 'Network error. Check your connection and try again.')

  if (low.includes('contract') || low.includes('soroban') || low.includes('wasm'))
    return new WalletError('CONTRACT_ERROR', `Smart contract error: ${msg}`)

  return new WalletError('UNKNOWN', msg)
}

// ─── Transaction status ───────────────────────────────────────────────────────
export type TxStatus = 'idle' | 'building' | 'signing' | 'pending' | 'success' | 'error'

export interface TxState {
  status: TxStatus
  message?: string
  hash?: string
  error?: string
}

// ─── Unit helpers ─────────────────────────────────────────────────────────────
export const STROOP = 10_000_000

export function stroopsToXlm(raw: string | number): string {
  return (Number(raw) / STROOP).toFixed(2)
}

export function xlmToStroops(xlm: number): number {
  return Math.floor(xlm * STROOP)
}

// ─── Build donate transaction ─────────────────────────────────────────────────
export async function buildDonateTx(publicKey: string, amountStroops: number): Promise<string> {
  const account = await horizonServer.loadAccount(publicKey)
  const contract = new Contract(CONTRACT_ID)

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'donate',
        nativeToScVal(publicKey, { type: 'address' }),
        nativeToScVal(amountStroops, { type: 'i128' })
      )
    )
    .setTimeout(30)
    .build()

  return tx.toXDR()
}

// ─── Submit signed transaction ────────────────────────────────────────────────
export async function submitSignedTx(signedXdr: string): Promise<string> {
  const { TransactionBuilder: TB } = await import('@stellar/stellar-sdk')
  const envelope = TB.fromXDR(signedXdr, NETWORK_PASSPHRASE)
  const result = await horizonServer.submitTransaction(envelope)
  return (result as { hash: string }).hash
}

// ─── Read contract state ──────────────────────────────────────────────────────
export async function readContract(method: 'get_goal' | 'get_total'): Promise<string> {
  try {
    const DUMMY = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN'
    const account = await horizonServer.loadAccount(DUMMY).catch(() => null)
    if (!account) return '0'

    const contract = new Contract(CONTRACT_ID)
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(method))
      .setTimeout(30)
      .build()

    const res = await fetch(SOROBAN_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'simulateTransaction',
        params: { transaction: tx.toXDR() },
      }),
    })

    const json = (await res.json()) as { result?: { results?: Array<{ xdr: string }> } }
    const xdrStr = json.result?.results?.[0]?.xdr
    if (!xdrStr) return '0'

    const scVal = xdr.ScVal.fromXDR(xdrStr, 'base64')
    if (scVal.switch().name === 'scvI128') {
      const i128 = scVal.i128()
      const hi = BigInt(i128.hi().toString())
      const lo = BigInt(i128.lo().toString())
      return String((hi << 64n) | lo)
    }
    return '0'
  } catch {
    return '0'
  }
}

// ─── Friendbot ────────────────────────────────────────────────────────────────
export async function friendbotFund(publicKey: string): Promise<void> {
  const res = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`)
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    const detail = (json as { detail?: string }).detail ?? ''
    if (!detail.toLowerCase().includes('already')) {
      throw new WalletError('NETWORK_ERROR', 'Friendbot failed. Try again.')
    }
  }
}