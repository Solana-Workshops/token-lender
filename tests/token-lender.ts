import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { describe, it } from "mocha";
import { TokenLender } from "../target/types/token_lender";
import { PROGRAM_ADDRESS as METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import {
  assertLoanCreated,
  createKeypairFromFile,
  getLoanEscrowPublicKey,
  getLoanNoteMintPublicKey,
  getMetadataPublicKey,
  sleep,
  SOL_USD_PRICE_FEED_ID,
} from "./util";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
} from "@solana/spl-token";
import { PublicKey } from "@metaplex-foundation/js";
import { Amman } from "@metaplex-foundation/amman-client";

describe("[Unit Test]: Loan Returned", () => {
  const lender = createKeypairFromFile(
    require("os").homedir() + "/.config/solana/id.json"
  );
  const borrower = createKeypairFromFile(
    require("os").homedir() + "/.config/solana/id.json"
  );

  const amman = Amman.instance();

  amman.addr.addLabel("lender", lender.publicKey.toBase58());
  amman.addr.addLabel("borrower", borrower.publicKey.toBase58());

  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.TokenLender as Program<TokenLender>;

  const loanId = 2;
  const deposit = new anchor.BN(1000);
  const [loanEscrowPublicKey, _] = getLoanEscrowPublicKey(
    program.programId,
    loanId
  );
  const loanNoteMintPublicKey = getLoanNoteMintPublicKey(
    program.programId,
    loanEscrowPublicKey
  )[0];

  const mintKeypair = anchor.web3.Keypair.generate();

  before(async () => {
    // await amman.airdrop(program.provider.connection, lender.publicKey, 1);
    // await amman.airdrop(program.provider.connection, borrower.publicKey, 1);

    await amman.airdrop(program.provider.connection, borrower.publicKey, 1);

    const createMintTx = new anchor.web3.Transaction();

    console.log(mintKeypair.publicKey.toBase58());

    const createMintAccountInstruction =
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: lender.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        lamports:
          await program.provider.connection.getMinimumBalanceForRentExemption(
            MINT_SIZE
          ),
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
      });

    createMintTx.add(createMintAccountInstruction);

    // Initialize that account as a Mint
    const initializeMintInstruction = createInitializeMintInstruction(
      mintKeypair.publicKey,
      6,
      lender.publicKey,
      lender.publicKey
    );

    createMintTx.add(initializeMintInstruction);

    const ataLenderCreate = createAssociatedTokenAccountInstruction(
      lender.publicKey,
      await anchor.utils.token.associatedAddress({
        mint: mintKeypair.publicKey,
        owner: lender.publicKey,
      }),
      lender.publicKey,
      mintKeypair.publicKey
    );

    createMintTx.add(ataLenderCreate);

    console.log("Hi this worked");

    const createMintTo = createMintToInstruction(
      mintKeypair.publicKey,
      await anchor.utils.token.associatedAddress({
        mint: mintKeypair.publicKey,
        owner: lender.publicKey,
      }),
      lender.publicKey,
      10000
    );

    createMintTx.add(createMintTo);

    await anchor.web3.sendAndConfirmTransaction(
      program.provider.connection,
      createMintTx,
      [lender, mintKeypair],
      {
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      }
    );
  });

  it("Create a new loan", async () => {
    const expiryTimestamp = new anchor.BN(
      (await program.provider.connection.getSlot()) + 300
    );

    await program.methods
      .createLoan(loanId, deposit, expiryTimestamp)
      .accounts({
        usdcMint: mintKeypair.publicKey,
        loanEscrow: loanEscrowPublicKey,
        loanEscrowUsdcAta: await anchor.utils.token.associatedAddress({
          mint: mintKeypair.publicKey,
          owner: loanEscrowPublicKey,
        }),
        lender: lender.publicKey,
        lenderUsdcAta: await anchor.utils.token.associatedAddress({
          mint: mintKeypair.publicKey,
          owner: lender.publicKey,
        }),
      })
      .signers([lender])
      .rpc();
    // await assertLoanCreated(program, loanEscrowPublicKey);
  });

  it("Accept that loan", async () => {
    // airdrop 1 sol to borrower
    const airdrop = await program.provider.connection.requestAirdrop(
      borrower.publicKey,
      10000000000
    );

    await program.provider.connection.confirmTransaction(airdrop, "confirmed");

    await program.methods
      .acceptLoan(loanId)
      .accounts({
        usdcMint: mintKeypair.publicKey,
        loanNoteMint: loanNoteMintPublicKey,
        loanNoteMintMetadata: getMetadataPublicKey(loanNoteMintPublicKey)[0],
        loanEscrow: loanEscrowPublicKey,
        loanEscrowUsdcAta: await anchor.utils.token.associatedAddress({
          mint: mintKeypair.publicKey,
          owner: loanEscrowPublicKey,
        }),
        borrower: borrower.publicKey,
        borrowerUsdcAta: await anchor.utils.token.associatedAddress({
          mint: mintKeypair.publicKey,
          owner: borrower.publicKey,
        }),
        lender: lender.publicKey,
        lenderLoanNoteMintAta: await anchor.utils.token.associatedAddress({
          mint: loanNoteMintPublicKey,
          owner: lender.publicKey,
        }),
        pythAccount: SOL_USD_PRICE_FEED_ID,
        tokenMetadataProgram: new PublicKey(
          "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
        ),
      })
      .signers([borrower])
      .rpc({ skipPreflight: true });
    // await assertLoanAccepted(program, loanEscrowPublicKey);
  });

  it("Return that loan", async () => {
    await program.methods
      .returnFunds(loanId, deposit)
      .accounts({
        usdcMint: mintKeypair.publicKey,
        loanEscrow: loanEscrowPublicKey,
        loanEscrowUsdcAta: await anchor.utils.token.associatedAddress({
          mint: mintKeypair.publicKey,
          owner: loanEscrowPublicKey,
        }),
        borrower: borrower.publicKey,
        borrowerUsdcAta: await anchor.utils.token.associatedAddress({
          mint: mintKeypair.publicKey,
          owner: borrower.publicKey,
        }),
      })
      .signers([borrower])
      .rpc();
    // await assertPrincipleReturnedToLoan(program, loanEscrowPublicKey);
  });

  it("Close that loan as returned", async () => {
    await program.methods
      .closeReturned(loanId)
      .accounts({
        usdcMint: mintKeypair.publicKey,
        loanNoteMint: loanNoteMintPublicKey,
        loanEscrow: loanEscrowPublicKey,
        loanEscrowLoanNoteMintAta: await anchor.utils.token.associatedAddress({
          mint: loanNoteMintPublicKey,
          owner: loanEscrowPublicKey,
        }),
        loanEscrowUsdcAta: await anchor.utils.token.associatedAddress({
          mint: mintKeypair.publicKey,
          owner: loanEscrowPublicKey,
        }),
        lender: lender.publicKey,
        lenderLoanNoteMintAta: await anchor.utils.token.associatedAddress({
          mint: loanNoteMintPublicKey,
          owner: lender.publicKey,
        }),
        lenderUsdcAta: await anchor.utils.token.associatedAddress({
          mint: mintKeypair.publicKey,
          owner: lender.publicKey,
        }),
      })
      .signers([lender])
      .rpc();
    // await assertLoanClosed(program, loanEscrowPublicKey);
  });
});
