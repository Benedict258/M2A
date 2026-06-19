module m2a::registry;

use sui::object::{Self, ID, UID};
use sui::table::{Self as table, Table};
use sui::transfer;
use sui::tx_context::TxContext;

public struct AgentRegistry has key, store {
    id: UID,
    agents: Table<address, ID>,
    owners: Table<address, vector<ID>>,
}

public fun create_registry(ctx: &mut TxContext): AgentRegistry {
    AgentRegistry {
        id: object::new(ctx),
        agents: table::new(ctx),
        owners: table::new(ctx),
    }
}

entry fun share_registry(ctx: &mut TxContext) {
    transfer::share_object(create_registry(ctx));
}

public fun register_agent(
    registry: &mut AgentRegistry,
    agent_wallet: address,
    policy_id: ID,
    owner: address,
) {
    registry.agents.add(agent_wallet, policy_id);

    if (registry.owners.contains(owner)) {
        let list = registry.owners.borrow_mut(owner);
        list.push_back(policy_id);
    } else {
        let mut list: vector<ID> = vector[];
        list.push_back(policy_id);
        registry.owners.add(owner, list);
    };
}

public fun get_agent_policy(registry: &AgentRegistry, agent_wallet: address): ID {
    *registry.agents.borrow(agent_wallet)
}

public fun get_owner_agents(registry: &AgentRegistry, owner: address): &vector<ID> {
    registry.owners.borrow(owner)
}

public fun contains_agent(registry: &AgentRegistry, agent_wallet: address): bool {
    registry.agents.contains(agent_wallet)
}
