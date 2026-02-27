import { useState } from "react";
import { nativeToScVal, Transaction, Networks, scValToNative } from "@stellar/stellar-sdk";
import { connectFreighter } from "./lib/wallet";
import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  rpc,
} from "@stellar/stellar-sdk";
import { signTransaction as freighterSign } from "@stellar/freighter-api";
import albedo from "@albedo-link/intent";

const CONTRACT_ID =
  "CAETW2QVHH2VQL2SYKCLXHSXKVSDNG4WLN74QOEI6G2EZXKUBAXWNP6T";
const server = new rpc.Server("https://soroban-testnet.stellar.org");

type WalletType = "freighter" | "albedo" | null;

function App() {
  const [address, setAddress] = useState<string>("");
  const [wallet, setWallet] = useState<WalletType>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [total, setTotal] = useState<string>("0");
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  // ── Connect Freighter ──────────────────────────────────────────────
  const connectFreighterWallet = async () => {
    try {
      setError("");
      const pubKey = await connectFreighter();
      setAddress(String(pubKey));
      setWallet("freighter");
      setShowPicker(false);
      setStatus("✅ Wallet connected successfully!");
      setTimeout(() => setStatus(""), 3000);
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    }
  };

  // ── Connect Albedo ─────────────────────────────────────────────────
  const connectAlbedo = async () => {
    try {
      setError("");
      const result = await albedo.publicKey({ require_existing: false });
      setAddress(result.pubkey);
      setWallet("albedo");
      setShowPicker(false);
      setStatus("✅ Wallet connected successfully!");
      setTimeout(() => setStatus(""), 3000);
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    }
  };

  const disconnect = () => {
    setAddress("");
    setWallet(null);
    setTotal("0");
    setStatus("");
    setError("");
  };

  // ── Sign with active wallet ────────────────────────────────────────
  const signWithWallet = async (xdrString: string): Promise<string> => {
    if (wallet === "freighter") {
      const signed = await freighterSign(xdrString, {
        networkPassphrase: Networks.TESTNET,
      });
      return typeof signed === "string" ? signed : signed.signedTxXdr;
    }
    if (wallet === "albedo") {
      const result = await albedo.tx({
        xdr: xdrString,
        network: "testnet",
        submit: false,
      });
      return result.signed_envelope_xdr;
    }
    throw new Error("No wallet connected");
  };

  // ── Get total donations ────────────────────────────────────────────
  const getTotal = async () => {
    try {
      if (!address) return;
      const contract = new Contract(CONTRACT_ID);
      const account = await server.getAccount(address);

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(contract.call("get_total"))
        .setTimeout(30)
        .build();

      const simulation = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(simulation)) {
        throw new Error("Simulation failed: " + simulation.error);
      }

      const retval = (simulation as rpc.Api.SimulateTransactionSuccessResponse)
        .result?.retval;

      if (!retval) {
        setTotal("0");
        return;
      }

      // scValToNative correctly converts i128 ScVal → JS bigint/number
      const native = scValToNative(retval);
      setTotal(native !== undefined && native !== null ? native.toString() : "0");
    } catch (e: unknown) {
      console.error(e);
      if (e instanceof Error) setError(e.message);
    }
  };

  // ── Donate ─────────────────────────────────────────────────────────
  const donate = async () => {
    try {
      setStatus("⏳ Processing donation...");
      setError("");

      if (!address) throw new Error("Wallet not connected");
      if (!amount || Number(amount) <= 0) throw new Error("Invalid amount");

      const contract = new Contract(CONTRACT_ID);
      const account = await server.getAccount(address);

      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          contract.call("donate", nativeToScVal(BigInt(amount), { type: "i128" }))
        )
        .setTimeout(30)
        .build();

      const preparedTx = await server.prepareTransaction(tx);
      const xdrString = preparedTx.toEnvelope().toXDR("base64");

      const signedXdr = await signWithWallet(xdrString);
      const signedTx = new Transaction(signedXdr, Networks.TESTNET);

      const sendResult = await server.sendTransaction(signedTx);
      console.log("Send result:", sendResult);

      if (sendResult.status === "ERROR" || sendResult.status === "FAILED") {
        throw new Error("Transaction failed: " + sendResult.status);
      }

      setStatus("🎉 Donation successful! Thank you for your contribution!");
      setAmount("");
      await getTotal();
    } catch (e: unknown) {
      console.error(e);
      setStatus("❌ Donation failed");
      if (e instanceof Error) setError(e.message);
    }
  };

  // ── Styles ─────────────────────────────────────────────────────────
  const btnStyle: React.CSSProperties = {
    width: "100%",
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: 11,
    borderRadius: 8,
    marginBottom: 10,
    boxSizing: "border-box",
    fontSize: 15,
    border: "1px solid #ccc",
  };

  const walletLabel = wallet === "freighter" ? "🔑 Freighter" : wallet === "albedo" ? "🌟 Albedo" : "";

  return (
    <div style={{ maxWidth: 480, margin: "60px auto", padding: 24, fontFamily: "sans-serif" }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>🚀 Stellar Crowdfunding</h2>

      {/* ── Wallet Section ── */}
      {!address ? (
        <div>
          <button style={btnStyle} onClick={() => setShowPicker(!showPicker)}>
            🔗 Connect Wallet
          </button>

          {showPicker && (
            <div style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 16,
              marginBottom: 12,
              background: "#f9fafb"
            }}>
              <p style={{ margin: "0 0 12px", fontWeight: "bold", textAlign: "center", color: "#333" }}>
                Select a Wallet
              </p>

              <button
                onClick={connectFreighterWallet}
                style={{
                  ...btnStyle,
                  background: "#4f46e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                🔑 Freighter
              </button>

              <button
                onClick={connectAlbedo}
                style={{
                  ...btnStyle,
                  background: "#f59e0b",
                  marginBottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                🌟 Albedo
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{
          marginBottom: 16,
          padding: 12,
          background: "#f0fdf4",
          borderRadius: 8,
          border: "1px solid #86efac"
        }}>
          <p style={{ margin: "0 0 2px", fontWeight: "bold", color: "#16a34a" }}>
            {walletLabel} Connected
          </p>
          <p style={{ margin: "0 0 8px", wordBreak: "break-all", fontSize: 12, color: "#555" }}>
            {address}
          </p>
          <button
            onClick={disconnect}
            style={{ ...btnStyle, background: "#ef4444", padding: 7, fontSize: 13, marginBottom: 0 }}
          >
            Disconnect
          </button>
        </div>
      )}

      {/* ── Total ── */}
      <div style={{
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        textAlign: "center"
      }}>
        <p style={{ margin: 0, fontSize: 18, fontWeight: "bold", color: "#1d4ed8" }}>
          💰 Total Donations: <span style={{ color: "#059669" }}>{total}</span>
        </p>
      </div>

      <button style={{ ...btnStyle, background: "#0891b2" }} onClick={getTotal} disabled={!address}>
        🔄 Refresh Total
      </button>

      {/* ── Donate ── */}
      <input
        style={inputStyle}
        type="number"
        placeholder="Enter amount to donate"
        value={amount}
        min="1"
        onChange={(e) => setAmount(e.target.value)}
      />

      <button style={btnStyle} onClick={donate} disabled={!address}>
        💸 Donate
      </button>

      {/* ── Status / Error ── */}
      {status && (
        <div style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 8,
          background: status.includes("❌") ? "#fef2f2" : "#f0fdf4",
          border: `1px solid ${status.includes("❌") ? "#fca5a5" : "#86efac"}`,
          color: status.includes("❌") ? "#dc2626" : "#16a34a",
          fontWeight: "bold",
          textAlign: "center"
        }}>
          {status}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: 10,
          padding: 10,
          borderRadius: 8,
          background: "#fef2f2",
          border: "1px solid #fca5a5",
          color: "#dc2626",
          wordBreak: "break-word",
          fontSize: 14
        }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

export default App;