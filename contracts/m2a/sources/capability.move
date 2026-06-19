module m2a::capability {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::TxContext;

    public struct Capability has key, store {
        id: UID,
        agent_id: address,
        scope: vector<u8>,
        expires_at: u64,
        revoked: bool,
    }

    const EScopeMismatch: u64 = 0;
    const ECapabilityInvalid: u64 = 1;

    public fun grant(
        agent_id: address,
        scope: vector<u8>,
        expires_at: u64,
        ctx: &mut TxContext,
    ) {
        transfer::share_object(Capability {
            id: object::new(ctx),
            agent_id,
            scope,
            expires_at,
            revoked: false,
        });
    }

    public fun revoke(cap: &mut Capability) {
        cap.revoked = true;
    }

    public fun is_valid(cap: &Capability, ctx: &TxContext): bool {
        !cap.revoked && ctx.epoch() <= cap.expires_at
    }

    public fun check_scope(cap: &Capability, required_scope: &vector<u8>): bool {
        cap.scope == *required_scope
    }

    public fun check_capability(cap: &Capability, required_scope: &vector<u8>, ctx: &TxContext) {
        assert!(check_scope(cap, required_scope), EScopeMismatch);
        assert!(is_valid(cap, ctx), ECapabilityInvalid);
    }
}
