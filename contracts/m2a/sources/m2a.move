module m2a::m2a;

use sui::coin::{Self as coin, Coin};
use sui::event;
use sui::object::{Self, ID};
use sui::sui::SUI;
use sui::transfer;
use sui::tx_context::TxContext;
use std::string::String;

use m2a::policy::{Self as policy, AgentPolicy};
use m2a::registry::{Self as registry, AgentRegistry};

public struct PolicyUpdated has copy, drop {
    agent_id: address,
    policy_version: u64,
}

public struct AgentFrozen has copy, drop {
    agent_id: address,
}

public struct AgentCreated has copy, drop {
    agent_id: address,
    owner: address,
    agent_wallet: address,
}

public struct RegistryCreated has copy, drop {
    registry_id: ID,
}

const ENotOwner: u64 = 1;

fun init(ctx: &mut TxContext) {
    let reg = registry::create_registry(ctx);
    let reg_id = object::id(&reg);
    event::emit(RegistryCreated { registry_id: reg_id });
    transfer::public_share_object(reg);
}

public fun get_registry_id(registry: &AgentRegistry): ID {
    object::id(registry)
}

entry fun create_agent(
    registry: &mut AgentRegistry,
    agent_wallet: address,
    budget_cap: u64,
    protocols: vector<String>,
    tools: vector<String>,
    expiry_epoch: u64,
    ctx: &mut TxContext,
) {
    let owner = ctx.sender();

    let policy_obj = policy::create_policy(
        owner, agent_wallet, owner, budget_cap, protocols, tools, expiry_epoch, ctx,
    );

    let policy_id = object::id(&policy_obj);
    let agent_id = object::id_to_address(&policy_id);

    let activity_log = policy::create_activity_log(agent_id, ctx);

    registry.register_agent(agent_wallet, policy_id, owner);

    transfer::public_transfer(policy_obj, owner);
    transfer::public_share_object(activity_log);

    event::emit(AgentCreated { agent_id, owner, agent_wallet });
}

entry fun top_up_agent(
    policy: &mut AgentPolicy,
    coin: &mut Coin<SUI>,
    amount: u64,
    ctx: &mut TxContext,
) {
    let owner = ctx.sender();
    assert!(policy.is_owner(owner), ENotOwner);
    let split = coin.split(amount, ctx);
    policy.top_up(amount);
    transfer::public_transfer(split, owner);
}

entry fun deactivate_agent(
    policy: &mut AgentPolicy,
    ctx: &TxContext,
) {
    let caller = ctx.sender();
    assert!(policy.is_owner(caller), ENotOwner);
    policy.deactivate();
    let agent_addr = policy.agent_id();
    event::emit(AgentFrozen { agent_id: agent_addr });
}

entry fun delete_agent(
    registry: &mut AgentRegistry,
    policy: &mut AgentPolicy,
    ctx: &TxContext,
) {
    let caller = ctx.sender();
    assert!(policy.is_owner(caller), ENotOwner);

    let agent_wallet_addr = policy.agent_wallet();
    let owner = policy.owner();

    policy.deactivate();
    registry.remove_agent(agent_wallet_addr, owner);

    let agent_addr = policy.agent_id();
    event::emit(AgentFrozen { agent_id: agent_addr });
}

public fun emit_policy_updated(agent_id: address, policy_version: u64) {
    event::emit(PolicyUpdated { agent_id, policy_version });
}

public fun emit_agent_frozen(agent_id: address) {
    event::emit(AgentFrozen { agent_id });
}
