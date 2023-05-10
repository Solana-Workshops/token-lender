module.exports = {
  validator: {
    killRunningValidators: true,
    programs: [],
    accounts: [
      {
        label: "Pyth SOL_USD",
        accountId: "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG",
        cluster: "https://api.mainnet-beta.solana.com",
        executable: false,
      },
      {
        label: "Pyth USDC_USD",
        accountId: "8GWTTbNiXdmyZREXbjsZBmCRuzdPrW55dnZGDkTRjWvb",
        cluster: "https://api.mainnet-beta.solana.com",
        executable: false,
      },
      {
        label: "Metadata Program",
        accountId: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
        cluster: "https://api.mainnet-beta.solana.com",
        executable: true,
      },
      {
        label: "Pyth Program",
        accountId: "FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH",
        cluster: "https://api.mainnet-beta.solana.com",
        executable: true,
      },
    ],
    jsonRpcUrl: "127.0.0.1",
    websocketUrl: "",
    commitment: "confirmed",
    ledgerDir: "./test-ledger",
    resetLedger: true,
    verifyFees: false,
    detached: false,
  },

  relay: {
    enabled: true,
    killlRunningRelay: true,
    accountProviders: true,
  },
  storage: {
    enabled: true,
    storageId: "mock-storage",
    clearOnStart: true,
  },
};
