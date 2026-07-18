# ADR-0010 — Design delivered as markdown specs + JSON tokens (Figma deferred)

- **Status:** Accepted
- **Date:** 2026-07-18

## Context

The playbook envisioned a Claude Designer / Figma round producing a design file and clickable
prototypes. In the current environment, Figma/Claude Designer cannot run (interactive auth
unavailable). The engineering work still needs an unambiguous, implementation-ready design
handoff.

## Decision

Deliver the design round as **markdown specifications + a machine-readable `tokens.json`**:
master handoff (visual directions + recommendation, design system, per-screen handoff tables),
user flows, component inventory, copy deck, accessibility notes, and assumptions. Clickable
prototypes and a Figma project are **deferred** and recorded as open items.

## Consequences

- Implementation can proceed without a Figma file; tokens feed Tailwind directly.
- Visual fidelity relies on written specs + tokens rather than pixel comps; a later Figma pass
  can be layered on without contradicting these docs.
- The design source of truth is versioned in-repo (reviewable via PR), which suits an
  AI-implementation workflow.
