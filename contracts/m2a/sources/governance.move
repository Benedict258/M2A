module m2a::governance {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::TxContext;
    use std::string::String;

    use m2a::m2a;
    use m2a::policy::{Self as policy, AgentPolicy};

    /// Governance capability shared object for access control.
    public struct GovernanceCap has key, store {
        id: UID,
    }

    fun init(ctx: &mut TxContext) {
        transfer::share_object(GovernanceCap {
            id: object::new(ctx),
        });
    }

    public fun freeze_agent(
        _cap: &GovernanceCap,
        policy: &mut AgentPolicy,
        _ctx: &mut TxContext,
    ) {
        let agent_id = policy::agent_id(policy);
        policy::deactivate(policy);
        m2a::emit_agent_frozen(agent_id);
    }

    public fun update_policy(
        _cap: &GovernanceCap,
        policy: &mut AgentPolicy,
        policy_version: u64,
        new_budget_cap: u64,
        new_expiry_epoch: u64,
        new_protocols: vector<String>,
        new_tools: vector<String>,
    ) {
        let agent_id = policy::agent_id(policy);
        policy::set_budget_cap(policy, new_budget_cap);
        policy::set_expiry_epoch(policy, new_expiry_epoch);
        policy::set_protocol_whitelist(policy, new_protocols);
        policy::set_tool_whitelist(policy, new_tools);
        m2a::emit_policy_updated(agent_id, policy_version);
    }
}
