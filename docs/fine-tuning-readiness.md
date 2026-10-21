# Fine-tuning readiness gate

Fine-tuning is a later-stage experiment, not a prerequisite for a useful personal AI. The production chat path must remain independent from training jobs.

## Required before training

- [ ] Examples are explicitly approved for training use.
- [ ] Each example contains a clear situation/input and a reviewed target response.
- [ ] Duplicate, contradictory, malformed, private, or sensitive examples are removed.
- [ ] A held-out evaluation set exists and is not copied into training data.
- [ ] A baseline evaluation is recorded for the current model and retrieval system.
- [ ] The dataset has enough diverse examples to justify an experiment. Start reviewing at 100+ examples; this is a screening threshold, not a guarantee of quality.
- [ ] The base model and adapter licenses permit the intended use.
- [ ] Training runs in a cloud notebook/runtime; no model weights are committed to this repository.

## Acceptance rule

A candidate adapter must beat the recorded baseline on the held-out evaluation set without regressing identity accuracy, factual grounding, refusal behavior, or memory accuracy. If it does not, keep the previous model. Never replace the production model automatically just because training completed.

## Current strategy

1. Improve authentication, persistent data and access isolation.
2. Add retrieval over curated knowledge before generation.
3. Run deterministic retrieval/data checks in GitHub Actions.
4. Collect reviewed examples and establish a baseline.
5. Only then decide whether fine-tuning is worth the compute and maintenance cost.

GitHub Actions should validate and evaluate artifacts. It should not start paid or quota-consuming training jobs on every push.
