module m2a::execution;

use sui::clock::Clock;
use sui::tx_context::TxContext;
use std::string::String;

use m2a::policy::{Self, AgentPolicy, ActivityLog};

public fun pre_execution_check(
    policy: &AgentPolicy,
    protocol: &String,
    amount: u64,
    ctx: &TxContext,
) {
    policy.check_active(ctx);
    policy.check_protocol(protocol);
    policy.check_budget(amount);
}

public fun post_execution_record(
    policy: &AgentPolicy,
    log: &mut ActivityLog,
    action: String,
    protocol: String,
    amount: u64,
    digest: String,
    status: u8,
    clock: &Clock,
) {
    policy.log_activity(log, action, protocol, amount, digest, status, clock);
}

public fun can_execute(
    policy: &AgentPolicy,
    protocol: &String,
    amount: u64,
    ctx: &TxContext,
): bool {
    if (!policy.is_active()) return false;
    if (ctx.epoch() > policy.expiry_epoch()) return false;
    if (policy.budget_used() + amount > policy.budget_cap()) return false;
    policy.is_protocol_allowed(protocol)
}
