# Security Specification - RODER Indica V2

## Data Invariants
1. **Lead Governance**: A lead (`indication`) must always belong to an authenticated `external_seller`. Only admins/managers/triagem or the assigned `internal_seller` can modify negotiation fields.
2. **Identity Integrity**: No user can change their own `role` or `is_commissionable` status. These are "System-Admin" fields.
3. **Financial Safety**: Commissions can only be marked as `paid` by users with `financial`, `admin`, or `manager` roles.
4. **Relational Consistency**: Reservations must reference a valid `stock_item`.
5. **Terminal Locks**: Once an indication is `sold` or `cancelled`, certain fields (like `client_cnpj`) become immutable except for admins.

## The Dirty Dozen (Attack Vectors)
1. **Identity Theft**: Authenticated user `A` tries to update `users/B` to change their role to `admin`.
2. **Permission Escalation**: User `peças@roderbrasil.com.br` tries to set their own `permissions.sidebar.admin` to `true`.
3. **Phantom Indication**: User tries to create an `indication` with `status: 'sold'` skiping triagem/negotiation.
4. **Owner Spoofing**: User `A` creates an `indication` setting `external_seller_uid` to User `B`.
5. **PII Scraping**: A partner tries to `list` all users to get their emails/phones.
6. **Stock Poisoning**: User tries to set `stock_items/X/quantity` to `-1000` or `1000000`.
7. **Reservation Hijacking**: Seller `A` tries to `delete` a reservation made by Seller `B`.
8. **Commission Forge**: Partner tries to `create` a `commission` document for themselves.
9. **Negotiation Interference**: Partner `A` tries to add a `negotiation_history` note to Partner `B`'s indication.
10. **Resource Exhaustion**: Attacker tries to create a document with a 1.5KB string as an ID.
11. **Bypassing Verification**: User with `email_verified: false` tries to submit a new indication.
12. **Status Jumping**: User tries to change an indication status from `pending` directly to `paid` (invalid transition/status).

## Test Runner Plan
We will implement `firestore.rules.test.ts` (conceptual for this turn) to verify that these 12 vectors return `PERMISSION_DENIED`.
