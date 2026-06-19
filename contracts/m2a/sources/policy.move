module m2a::policy;

use sui::clock::Clock;
use sui::object::{Self, ID, UID};
use sui::table::{Self as table, Table};
use sui::tx_context::TxContext;
use std::string::String;
use std::vector;

public struct AgentPolicy has key, store {
    id: UID,
    agent_id: address,
    owner: address,
    agent_wallet: address,
    budget_cap: u64,
    budget_used: u64,
    protocol_whitelist: vector<String>,
    tool_whitelist: vector<String>,
    expiry_epoch: u64,
    is_active: bool,
}

public struct ActivityLog has key, store {
    id: UID,
    agent_id: address,
    entries: Table<u64, ActivityEntry>,
    next_id: u64,
}

public struct ActivityEntry has copy, drop, store {
    timestamp_ms: u64,
    action: String,
    protocol: String,
    amount_spent: u64,
    tx_digest: String,
    status: u8,
}

const EPolicyExpired: u64 = 1;
const EPolicyInactive: u64 = 2;
const EBudgetExceeded: u64 = 3;
const EProtocolNotAllowed: u64 = 4;

public fun create_policy(
    owner: address,
    agent_wallet: address,
    agent_id: address,
    budget_cap: u64,
    protocols: vector<String>,
    tools: vector<String>,
    expiry_epoch: u64,
    ctx: &mut TxContext,
): AgentPolicy {
    AgentPolicy {
        id: object::new(ctx),
        agent_id,
        owner,
        agent_wallet,
        budget_cap,
        budget_used: 0,
        protocol_whitelist: protocols,
        tool_whitelist: tools,
        expiry_epoch,
        is_active: true,
    }
}

public fun create_activity_log(agent_id: address, ctx: &mut TxContext): ActivityLog {
    ActivityLog {
        id: object::new(ctx),
        agent_id,
        entries: table::new(ctx),
        next_id: 0,
    }
}

public fun check_budget(policy: &AgentPolicy, amount: u64) {
    assert!(policy.budget_used + amount <= policy.budget_cap, EBudgetExceeded);
}

public fun record_spend(policy: &mut AgentPolicy, amount: u64) {
    policy.budget_used = policy.budget_used + amount;
}

public fun check_protocol(policy: &AgentPolicy, protocol: &String) {
    assert!(vector::contains(&policy.protocol_whitelist, protocol), EProtocolNotAllowed);
}

public fun check_active(policy: &AgentPolicy, ctx: &TxContext) {
    assert!(policy.is_active, EPolicyInactive);
    assert!(ctx.epoch() <= policy.expiry_epoch, EPolicyExpired);
}

public fun log_activity(
    _policy: &AgentPolicy,
    log: &mut ActivityLog,
    action: String,
    protocol: String,
    amount: u64,
    digest: String,
    status: u8,
    clock: &Clock,
) {
    let entry = ActivityEntry {
        timestamp_ms: clock.timestamp_ms(),
        action,
        protocol,
        amount_spent: amount,
        tx_digest: digest,
        status,
    };
    let id = log.next_id;
    log.entries.add(id, entry);
    log.next_id = id + 1;
}

public fun deactivate(policy: &mut AgentPolicy) {
    policy.is_active = false;
}

public fun top_up(policy: &mut AgentPolicy, amount: u64) {
    policy.budget_cap = policy.budget_cap + amount;
}

public fun is_protocol_allowed(policy: &AgentPolicy, protocol: &String): bool {
    vector::contains(&policy.protocol_whitelist, protocol)
}

// --- Setters for cross-module field writes ---

public fun set_budget_cap(policy: &mut AgentPolicy, cap: u64) {
    policy.budget_cap = cap;
}

public fun set_expiry_epoch(policy: &mut AgentPolicy, epoch: u64) {
    policy.expiry_epoch = epoch;
}

public fun set_protocol_whitelist(policy: &mut AgentPolicy, protocols: vector<String>) {
    policy.protocol_whitelist = protocols;
}

public fun set_tool_whitelist(policy: &mut AgentPolicy, tools: vector<String>) {
    policy.tool_whitelist = tools;
}

// --- Accessors for cross-module field reads ---

public fun owner(policy: &AgentPolicy): address {
    policy.owner
}

public fun is_active(policy: &AgentPolicy): bool {
    policy.is_active
}

public fun expiry_epoch(policy: &AgentPolicy): u64 {
    policy.expiry_epoch
}

public fun budget_used(policy: &AgentPolicy): u64 {
    policy.budget_used
}

public fun budget_cap(policy: &AgentPolicy): u64 {
    policy.budget_cap
}

public fun agent_id(policy: &AgentPolicy): address {
    policy.agent_id
}

public fun is_owner(policy: &AgentPolicy, addr: address): bool {
    policy.owner == addr
}
