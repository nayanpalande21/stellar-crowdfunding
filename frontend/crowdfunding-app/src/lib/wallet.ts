import { requestAccess, getAddress } from "@stellar/freighter-api";

export async function connectFreighter() {
  try {
    await requestAccess();

    const result = await getAddress();

    // Handle all possible return types safely
    if (typeof result === "string") {
      return result;
    }

    if (result?.address) {
      return result.address;
    }

    if (result?.publicKey) {
      return result.publicKey;
    }

    throw new Error("Unable to retrieve public key");
  } catch (e) {
    throw new Error("Freighter connection rejected or not installed");
  }
}