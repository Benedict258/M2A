#[test_only]
module m2a::registry_tests;

use sui::object;
use sui::test_scenario;
use sui::transfer;
use sui::tx_context::TxContext;
use m2a::policy;
use m2a::registry;

fun create_test_policy(owner: address, ctx: &mut TxContext): policy::AgentPolicy {
    policy::create_policy(
        owner, owner, owner, 1000,
        vector["http"],
        vector[],
        100,
        ctx,
    )
}

#[test]
fun test_create_registry() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let reg = {
        let ctx = scenario.ctx();
        registry::create_registry(ctx)
    };
    assert!(!registry::contains_agent(&reg, owner), 0);
    transfer::public_transfer(reg, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_register_agent() {
    let owner = @0xA;
    let wallet = @0xB;
    let mut scenario = test_scenario::begin(owner);
    let (mut reg, policy) = {
        let ctx = scenario.ctx();
        (registry::create_registry(ctx), create_test_policy(owner, ctx))
    };
    let policy_id = object::id(&policy);

    registry::register_agent(&mut reg, wallet, policy_id, owner);

    assert!(registry::contains_agent(&reg, wallet), 0);
    let retrieved_id = registry::get_agent_policy(&reg, wallet);
    assert!(retrieved_id == policy_id, 0);

    transfer::public_transfer(reg, owner);
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_register_multiple_agents() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let (mut reg, p1, p2) = {
        let ctx = scenario.ctx();
        (registry::create_registry(ctx), create_test_policy(owner, ctx), create_test_policy(owner, ctx))
    };
    let wallet1 = @0xB;
    let wallet2 = @0xC;
    let id1 = object::id(&p1);
    let id2 = object::id(&p2);

    registry::register_agent(&mut reg, wallet1, id1, owner);
    registry::register_agent(&mut reg, wallet2, id2, owner);

    assert!(registry::contains_agent(&reg, wallet1), 0);
    assert!(registry::contains_agent(&reg, wallet2), 0);

    let owner_agents = registry::get_owner_agents(&reg, owner);
    assert!(vector::length(owner_agents) == 2, 0);

    transfer::public_transfer(reg, owner);
    transfer::public_transfer(p1, owner);
    transfer::public_transfer(p2, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_register_multiple_owners() {
    let owner1 = @0xA;
    let owner2 = @0xB;
    let mut scenario = test_scenario::begin(owner1);
    let (mut reg, p1, p2) = {
        let ctx = scenario.ctx();
        (registry::create_registry(ctx), create_test_policy(owner1, ctx), create_test_policy(owner2, ctx))
    };
    let wallet1 = @0xC;
    let wallet2 = @0xD;
    let id1 = object::id(&p1);
    let id2 = object::id(&p2);

    registry::register_agent(&mut reg, wallet1, id1, owner1);
    registry::register_agent(&mut reg, wallet2, id2, owner2);

    assert!(registry::contains_agent(&reg, wallet1), 0);
    assert!(registry::contains_agent(&reg, wallet2), 0);

    let owner1_agents = registry::get_owner_agents(&reg, owner1);
    assert!(vector::length(owner1_agents) == 1, 0);

    let owner2_agents = registry::get_owner_agents(&reg, owner2);
    assert!(vector::length(owner2_agents) == 1, 0);

    transfer::public_transfer(reg, owner1);
    transfer::public_transfer(p1, owner1);
    transfer::public_transfer(p2, owner1);
    test_scenario::end(scenario);
}

#[test]
fun test_get_agent_policy() {
    let owner = @0xA;
    let wallet = @0xB;
    let mut scenario = test_scenario::begin(owner);
    let (mut reg, policy_obj) = {
        let ctx = scenario.ctx();
        (registry::create_registry(ctx), create_test_policy(owner, ctx))
    };
    let policy_id = object::id(&policy_obj);

    registry::register_agent(&mut reg, wallet, policy_id, owner);

    let retrieved = registry::get_agent_policy(&reg, wallet);
    assert!(retrieved == policy_id, 0);

    transfer::public_transfer(reg, owner);
    transfer::public_transfer(policy_obj, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_contains_agent_true() {
    let owner = @0xA;
    let wallet = @0xB;
    let mut scenario = test_scenario::begin(owner);
    let (mut reg, policy_obj) = {
        let ctx = scenario.ctx();
        (registry::create_registry(ctx), create_test_policy(owner, ctx))
    };
    let policy_id = object::id(&policy_obj);

    registry::register_agent(&mut reg, wallet, policy_id, owner);
    assert!(registry::contains_agent(&reg, wallet), 0);

    transfer::public_transfer(reg, owner);
    transfer::public_transfer(policy_obj, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_contains_agent_false() {
    let owner = @0xA;
    let wallet = @0xB;
    let mut scenario = test_scenario::begin(owner);
    let reg = {
        let ctx = scenario.ctx();
        registry::create_registry(ctx)
    };
    assert!(!registry::contains_agent(&reg, wallet), 0);
    transfer::public_transfer(reg, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_get_owner_agents() {
    let owner = @0xA;
    let wallet = @0xB;
    let mut scenario = test_scenario::begin(owner);
    let (mut reg, policy_obj) = {
        let ctx = scenario.ctx();
        (registry::create_registry(ctx), create_test_policy(owner, ctx))
    };
    let policy_id = object::id(&policy_obj);

    registry::register_agent(&mut reg, wallet, policy_id, owner);

    let agents = registry::get_owner_agents(&reg, owner);
    assert!(vector::length(agents) == 1, 0);
    assert!(agents[0] == policy_id, 0);

    transfer::public_transfer(reg, owner);
    transfer::public_transfer(policy_obj, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_register_and_check() {
    let owner = @0xA;
    let wallet = @0xB;
    let mut scenario = test_scenario::begin(owner);
    let (mut reg, policy_obj) = {
        let ctx = scenario.ctx();
        (registry::create_registry(ctx), create_test_policy(owner, ctx))
    };
    let policy_id = object::id(&policy_obj);

    assert!(!registry::contains_agent(&reg, wallet), 0);
    registry::register_agent(&mut reg, wallet, policy_id, owner);
    assert!(registry::contains_agent(&reg, wallet), 0);

    let retrieved = registry::get_agent_policy(&reg, wallet);
    assert!(retrieved == policy_id, 0);

    let owner_agents = registry::get_owner_agents(&reg, owner);
    assert!(vector::length(owner_agents) == 1, 0);
    assert!(owner_agents[0] == policy_id, 0);

    transfer::public_transfer(reg, owner);
    transfer::public_transfer(policy_obj, owner);
    test_scenario::end(scenario);
}
