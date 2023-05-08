use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token;
use std::str::FromStr;

use crate::state::LoanEscrow;

pub const SOL_USD_PRICE_FEED_ID: &str = "ALP8SdU9oARYVLgLR7LrqMNCYBnhtnQz1cj6bwgwQmgj";

pub fn to_pubkey(string: &str) -> Pubkey {
    Pubkey::from_str(string).expect("Error parsing public key from string.")
}

pub fn burn_signed<'a>(
    token_program: AccountInfo<'a>,
    mint: AccountInfo<'a>,
    from: AccountInfo<'a>,
    authority: AccountInfo<'a>,
    loan_id: u8,
    loan_escrow_bump: u8,
    amount: u64,
) -> Result<()> {
    token::burn(
        CpiContext::new_with_signer(
            token_program,
            token::Burn {
                mint,
                from,
                authority,
            },
            &[&[
                LoanEscrow::SEED_PREFIX.as_bytes().as_ref(),
                loan_id.to_le_bytes().as_ref(),
                &[loan_escrow_bump],
            ]],
        ),
        amount,
    )
}

pub fn transfer_sol<'a>(
    system_program: AccountInfo<'a>,
    from: AccountInfo<'a>,
    to: AccountInfo<'a>,
    amount: u64,
) -> Result<()> {
    system_program::transfer(
        CpiContext::new(system_program, system_program::Transfer { from, to }),
        amount,
    )
}

pub fn transfer_token<'a>(
    token_program: AccountInfo<'a>,
    authority: AccountInfo<'a>,
    from: AccountInfo<'a>,
    to: AccountInfo<'a>,
    amount: u64,
) -> Result<()> {
    token::transfer(
        CpiContext::new(
            token_program,
            token::Transfer {
                from,
                to,
                authority,
            },
        ),
        amount,
    )
}

pub fn transfer_token_signed<'a>(
    token_program: AccountInfo<'a>,
    loan_escrow: AccountInfo<'a>,
    from: AccountInfo<'a>,
    to: AccountInfo<'a>,
    loan_id: u8,
    loan_escrow_bump: u8,
    loan_amount: u64,
) -> Result<()> {
    token::transfer(
        CpiContext::new_with_signer(
            token_program,
            token::Transfer {
                from,
                to,
                authority: loan_escrow,
            },
            &[&[
                LoanEscrow::SEED_PREFIX.as_bytes().as_ref(),
                loan_id.to_le_bytes().as_ref(),
                &[loan_escrow_bump],
            ]],
        ),
        loan_amount,
    )
}
