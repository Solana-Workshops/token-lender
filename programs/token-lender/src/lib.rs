mod error;
mod instructions;
mod state;
mod util;

use anchor_lang::prelude::*;

use instructions::*;

declare_id!("32xQJkxLJNmWPtykFuBpdXrh7SxMpRwSkYUWY3Fa9cim");

#[program]
mod token_lender {
    use super::*;

    pub fn create_loan(
        ctx: Context<CreateLoan>,
        loan_id: u8,
        deposit_usdc: u64,
        expiry_timestamp: u64,
    ) -> Result<()> {
        instructions::create_loan(ctx, loan_id, deposit_usdc, expiry_timestamp)
    }

    pub fn accept_loan(ctx: Context<AcceptLoan>, loan_id: u8) -> Result<()> {
        instructions::accept_loan(ctx, loan_id)
    }

    pub fn return_funds(ctx: Context<ReturnFunds>, loan_id: u8, amount: u64) -> Result<()> {
        instructions::return_funds(ctx, loan_id, amount)
    }

    pub fn close_expired(ctx: Context<CloseExpired>, loan_id: u8) -> Result<()> {
        instructions::close_expired(ctx, loan_id)
    }

    pub fn close_returned(ctx: Context<CloseReturned>, loan_id: u8) -> Result<()> {
        instructions::close_returned(ctx, loan_id)
    }
}
