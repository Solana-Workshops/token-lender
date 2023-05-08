import * as anchor from "@project-serum/anchor";
import {
  getPythProgramKeyForCluster,
  PriceStatus,
  PythHttpClient,
} from "@pythnetwork/client";

describe("Testing Pyth", () => {
  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  it("Test", async () => {
    const pythClient = new PythHttpClient(
      connection,
      getPythProgramKeyForCluster("devnet")
    );

    const data = await pythClient.getData();

    for (let symbol of data.symbols) {
      const price = data.productPrice.get(symbol)!;
      // Sample output:
      // Crypto.SRM/USD: $8.68725 ±$0.0131 Status: Trading
      console.log(
        `${symbol}: $${price.price} \xB1$${price.confidence} Status: ${
          PriceStatus[price.status]
        }`
      );
    }
  });
});
