# Evaluation data

`benchmark_100.json` is reserved for reviewed evaluation scenarios. It is currently an empty array because target responses must come from Choco's own reviewed examples; synthetic targets must not be presented as authentic behavior.

Recommended record shape:

```json
{
  "id": "scenario-001",
  "category": "communication-style",
  "input": "Example situation or user message",
  "expected_behavior": "Reviewed criteria for a good response",
  "reference_response": "Optional response written or approved by Choco",
  "approved_for_evaluation": true
}
```

Keep the benchmark separate from training examples. Do not add private conversations, credentials, or sensitive personal information. Record baseline metrics before considering a fine-tuning experiment.
