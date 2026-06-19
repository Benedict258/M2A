#[test_only]
module m2a::execution_tests;

use sui::clock;
use sui::test_scenario;
use std::unit_test;
use sui::transfer;
use sui::tx_context::TxContext;
use m2a::execution;
use m2a::policy;

fun create_test_policy(owner: address, ctx: &mut TxContext): policy::AgentPolicy {
    policy::create_policy(
        owner, owner, owner, 1000,
        vector["http", "https"],
        vector[],
        100,
        ctx,
    )
}

#[test]
fun test_pre_execution_check_success() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let (policy, protocol) = {
        let ctx = scenario.ctx();
        (create_test_policy(owner, ctx), "http")
    };
    {
        let ctx = scenario.ctx();
        execution::pre_execution_check(&policy, &protocol, 500, ctx);
    };
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 3)]
fun test_pre_execution_check_fails_budget() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let (policy, protocol) = {
        let ctx = scenario.ctx();
        (create_test_policy(owner, ctx), "http")
    };
    {
        let ctx = scenario.ctx();
        execution::pre_execution_check(&policy, &protocol, 1500, ctx);
    };
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 4)]
fun test_pre_execution_check_fails_protocol() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let (policy, ftp) = {
        let ctx = scenario.ctx();
        (create_test_policy(owner, ctx), "ftp")
    };
    {
        let ctx = scenario.ctx();
        execution::pre_execution_check(&policy, &ftp, 500, ctx);
    };
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_post_execution_record() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let ctx = scenario.ctx();
    let clock = clock::create_for_testing(ctx);
    let policy_obj = create_test_policy(owner, ctx);
    let mut log = policy::create_activity_log(owner, ctx);

    execution::post_execution_record(
        &policy_obj,
        &mut log,
        "call",
        "http",
        200,
        "0xabc",
        0,
        &clock,
    );

    unit_test::destroy(log);
    transfer::public_transfer(policy_obj, owner);
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_can_execute_true() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let (policy, http) = {
        let ctx = scenario.ctx();
        (create_test_policy(owner, ctx), "http")
    };
    {
        let ctx = scenario.ctx();
        assert!(execution::can_execute(&policy, &http, 500, ctx), 0);
    };
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_can_execute_false_expired() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let (policy, http) = {
        let ctx = scenario.ctx();
        (
            policy::create_policy(owner, owner, owner, 1000, vector["http"], vector[], 0, ctx),
            "http",
        )
    };
    {
        let ctx = scenario.ctx();
        assert!(execution::can_execute(&policy, &http, 500, ctx), 0);
    };
    test_scenario::next_epoch(&mut scenario, owner);
    {
        let ctx = scenario.ctx();
        assert!(!execution::can_execute(&policy, &http, 500, ctx), 0);
    };
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_can_execute_false_budget() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let (policy, http) = {
        let ctx = scenario.ctx();
        (create_test_policy(owner, ctx), "http")
    };
    {
        let ctx = scenario.ctx();
        assert!(!execution::can_execute(&policy, &http, 1500, ctx), 0);
    };
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_can_execute_false_protocol() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let (policy, ftp) = {
        let ctx = scenario.ctx();
        (create_test_policy(owner, ctx), "ftp")
    };
    {
        let ctx = scenario.ctx();
        assert!(!execution::can_execute(&policy, &ftp, 500, ctx), 0);
    };
    transfer::public_transfer(policy, owner);
    test_scenario::end(scenario);
}

#[test]
fun test_full_execution_flow() {
    let owner = @0xA;
    let mut scenario = test_scenario::begin(owner);
    let ctx = scenario.ctx();
    let clock = clock::create_for_testing(ctx);
    let mut policy = create_test_policy(owner, ctx);
    let mut log = policy::create_activity_log(owner, ctx);
    let protocol = "http";

    execution::pre_execution_check(&policy, &protocol, 200, ctx);

    policy::record_spend(&mut policy, 200);
    assert!(policy::budget_used(&policy) == 200, 0);

    execution::post_execution_record(
        &policy,
        &mut log,
        "call",
        "http",
        200,
        "0xabc",
        0,
        &clock,
    );

    assert!(policy::budget_cap(&policy) - policy::budget_used(&policy) == 800, 0);
    unit_test::destroy(log);
    transfer::public_transfer(policy, owner);
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}
