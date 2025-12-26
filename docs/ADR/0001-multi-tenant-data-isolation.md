# ADR 0001: Multi-tenant Data Isolation Strategy

Status: Proposed
Date: 2025-11-14

Context

- The platform is multi-tenant. We must ensure strict tenant data isolation.
- PostgreSQL is the primary DB. Two common approaches:
  1. Schema-per-tenant (one schema each tenant)
  2. Row-Level Security (RLS) with a shared schema and tenant_id columns
- Constraints: MVP timeline, operational simplicity, cost, scale (hundreds → thousands tenants), analytics needs, and developer productivity.

Options

- Schema-per-tenant
  - Pros: Strong isolation boundary, simpler data dumps per tenant, easier noisy-neighbor isolation
  - Cons: Operational overhead (migrations per schema), connection pool bloat, harder to query cross-tenant analytics
- RLS-per-tenant (single schema)
  - Pros: Operationally simpler (single migration), efficient pooling, simpler analytics; proven pattern
  - Cons: Requires strict RLS policy correctness; mistakes can leak data if misconfigured

Decision (Proposed)

- Use RLS-per-tenant on a single shared schema for MVP and foreseeable scale.
- Enforce tenant scoping via:
  - Mandatory `tenant_id` on all tenant-owned tables
  - PostgreSQL RLS policies per table (USING with current_setting('app.tenant_id'))
  - Application sets `app.tenant_id` at session start; verified by JWT claims
  - Add defense-in-depth at application layer (scoped queries)

Consequences

- Pros: Single migration path, better resource use, easier analytics, faster developer experience
- Cons: Requires rigorous policy testing; must include RLS in preflight checks and migrations reviews

Security Controls

- Unit/E2E tests asserting cross-tenant access is impossible
- Disallow superuser bypass in app roles; use least-privilege DB roles
- Log and alert on any query without tenant_id predicate (via PG audit or app checks)

Migration Path

- If eventually needed, selected large tenants can be split to dedicated schema or DB using logical replication (future ADR)

References

- PostgreSQL RLS docs
- OWASP Multi-tenancy Cheat Sheet
