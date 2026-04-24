# Score Center Tables

This file complements `data_dictionary.md` for the Score Center and algorithm
system. Keep it aligned with `prisma/schema.prisma`.

## task_cards

Each row is the smallest teaching action unit issued by Score Center.

Required scheduling fields:
- `card_id`
- `session_id`
- `task_type`
- `card_type`
- `title`
- `why_this_now`
- `estimated_minutes`
- `difficulty`
- `expected_impact`
- `target_skills`
- `destination_page`
- `success_signal`
- `priority_score`
- `status`
- `sequence`
- `origin_engine`

Full-card explainability fields:
- `prerequisite`
- `action_label`
- `fallback_action`
- `expiry`
- `confidence`
- `utility_score`
- `weight_breakdown`
- `relation`

## learning_events

All card lifecycle events, execution submissions, user constraint updates, and
replans must be recorded here. Replan events should include:
- `oldSequence`
- `newSequence`
- `inserted`
- `removed`
- `statusChanges`
- `trigger`
- `reason`

## policy_logs / ope_reports

`policy_logs` is the logged bandit dataset for offline policy evaluation.
`ope_reports` stores IPS, direct method, and doubly robust estimates.
