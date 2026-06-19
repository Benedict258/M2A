#[test_only]
module m2a::policy_tests;

use sui::clock;
use sui::test_scenario;
use std::unit_test;
use sui::transfer;
use sui::tx_context::TxContext;
use m2a::policy;

fun create_test_policy(owner: address, ctx: &mut TxContext): policy::AgentPolicy {
    policy::create_policy(
        owner,
        owner,
        owner,
        1000,
        vector["http", "https"],
        vector[],
        100,
        ctx,
    )
}

#[test]
fun test_create_policy() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let policy = {
        let ctx = scenario.ctx();
        create_test_policy(owner, ctx)
    };
    assert!(policy::owner(&policy) == owner, 0);
    assert!(policy::budget_cap(&policy) == 1000, 0);
    assert!(policy::budget_used(&policy) == 0, 0);
    assert!(policy::is_active(&policy), 0);
    assert!(policy::expiry_epoch(&policy) == 100, 0);
    assert!(policy::is_owner(&policy, owner), 0);
    assert!(policy::agent_id(&policy) == owner, 0);
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_check_budget_success() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let policy = {
        let ctx = scenario.ctx();
        create_test_policy(owner, ctx)
    };
    policy::check_budget(&policy, 500);
    policy::check_budget(&policy, 500);
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 3)]
fun test_check_budget_failure() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let policy = {
        let ctx = scenario.ctx();
        create_test_policy(owner, ctx)
    };
    policy::check_budget(&policy, 1500);
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_record_spend() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let mut policy = {
        let ctx = scenario.ctx();
        create_test_policy(owner, ctx)
    };
    assert!(policy::budget_used(&policy) == 0, 0);
    policy::record_spend(&mut policy, 300);
    assert!(policy::budget_used(&policy) == 300, 0);
    policy::record_spend(&mut policy, 200);
    assert!(policy::budget_used(&policy) == 500, 0);
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_check_protocol_success() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let policy = {
        let ctx = scenario.ctx();
        create_test_policy(owner, ctx)
    };
    let http = "http";
    let https = "https";
    policy::check_protocol(&policy, &http);
    policy::check_protocol(&policy, &https);
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 4)]
fun test_check_protocol_failure() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let policy = {
        let ctx = scenario.ctx();
        create_test_policy(owner, ctx)
    };
    let ftp = "ftp";
    policy::check_protocol(&policy, &ftp);
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_check_active_active() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let policy = {
        let ctx = scenario.ctx();
        create_test_policy(owner, ctx)
    };
    {
        let ctx = scenario.ctx();
        policy::check_active(&policy, ctx);
    };
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 1)]
fun test_check_active_expired() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let policy = {
        let ctx = scenario.ctx();
        policy::create_policy(owner, owner, owner, 1000, vector["http"], vector[], 0, ctx)
    };
    test_scenario::next_epoch(&mut scenario, owner);
    {
        let ctx = scenario.ctx();
        policy::check_active(&policy, ctx);
    };
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 2)]
fun test_check_active_inactive() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let mut policy = {
        let ctx = scenario.ctx();
        create_test_policy(owner, ctx)
    };
    policy::deactivate(&mut policy);
    {
        let ctx = scenario.ctx();
        policy::check_active(&policy, ctx);
    };
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_deactivate() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let mut policy = {
        let ctx = scenario.ctx();
        create_test_policy(owner, ctx)
    };
    assert!(policy::is_active(&policy), 0);
    policy::deactivate(&mut policy);
    assert!(!policy::is_active(&policy), 0);
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_top_up() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let mut policy = {
        let ctx = scenario.ctx();
        create_test_policy(owner, ctx)
    };
    assert!(policy::budget_cap(&policy) == 1000, 0);
    policy::top_up(&mut policy, 500);
    assert!(policy::budget_cap(&policy) == 1500, 0);
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_is_protocol_allowed() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let policy = {
        let ctx = scenario.ctx();
        create_test_policy(owner, ctx)
    };
    let http = "http";
    let https = "https";
    let ftp = "ftp";
    assert!(policy::is_protocol_allowed(&policy, &http), 0);
    assert!(policy::is_protocol_allowed(&policy, &https), 0);
    assert!(!policy::is_protocol_allowed(&policy, &ftp), 0);
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_is_owner() {
    let owner = @0xA;
    let other = @0xB;
    let mut scenario = test_scenario::begin(owner);
    let policy = {
        let ctx = scenario.ctx();
        create_test_policy(owner, ctx)
    };
    assert!(policy::is_owner(&policy, owner), 0);
    assert!(!policy::is_owner(&policy, other), 0);
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_activity_log() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let ctx = scenario.ctx();
    let clock = clock::create_for_testing(ctx);
    let mut log = policy::create_activity_log(owner, ctx);
    let policy_obj = create_test_policy(owner, ctx);

    policy::log_activity(
        &policy_obj,
        &mut log,
        "call",
        "http",
        50,
        "0x123",
        0,
        &clock,
    );

    unit_test::destroy(log);
    transfer::public_transfer(policy_obj, owner);
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_activity_log_multiple_entries() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let ctx = scenario.ctx();
    let clock = clock::create_for_testing(ctx);
    let mut log = policy::create_activity_log(owner, ctx);
    let policy_obj = create_test_policy(owner, ctx);

    policy::log_activity(
        &policy_obj, &mut log,
        "call", "http", 50, "0x1", 0, &clock,
    );
    policy::log_activity(
        &policy_obj, &mut log,
        "call", "https", 100, "0x2", 1, &clock,
    );
    policy::log_activity(
        &policy_obj, &mut log,
        "query", "http", 30, "0x3", 0, &clock,
    );

    unit_test::destroy(log);
    transfer::public_transfer(policy_obj, owner);
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_create_policy_zero_budget() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let policy = {
        let ctx = scenario.ctx();
        policy::create_policy(owner, owner, owner, 0, vector["http"], vector[], 100, ctx)
    };
    assert!(policy::budget_cap(&policy) == 0, 0);
    assert!(policy::budget_used(&policy) == 0, 0);
    assert!(policy::is_active(&policy), 0);
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}
