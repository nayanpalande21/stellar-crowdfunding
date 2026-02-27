#![no_std]

use soroban_sdk::{contract, contractimpl, symbol_short, Env, Symbol};

#[contract]
pub struct Crowdfunding;

const TOTAL: Symbol = symbol_short!("TOTAL");

#[contractimpl]
impl Crowdfunding {

    pub fn donate(env: Env, amount: i128) {
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        let current: i128 = env
            .storage()
            .instance()
            .get(&TOTAL)
            .unwrap_or(0);

        let new_total = current + amount;

        env.storage().instance().set(&TOTAL, &new_total);
    }

    pub fn get_total(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&TOTAL)
            .unwrap_or(0)
    }
}