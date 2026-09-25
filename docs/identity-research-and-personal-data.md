# Identity Research & Personal Data Collection

## Purpose

This document defines how AIKEPRIBADIAN can build a verified identity profile of Choco before the application is packaged for Windows or Android.

The goal is not merely to store a name. The system should be able to distinguish:

- identity facts
- biographical facts
- public professional/project information
- self-provided private information
- personality observations
- historical information
- uncertain or conflicting information

## Source Priority

Information should be collected in this order of trust:

1. Choco-provided information
2. Choco-provided documents or exports
3. Public profiles or pages explicitly identified by Choco
4. Other public web sources that can be independently verified
5. Unverified search results only as leads, never as confirmed identity facts

AIKEPRIBADIAN must never silently convert an internet search result into a confirmed personal fact.

## Identity Record

A future local identity record may contain fields such as:

```json
{
  "identity": {
    "preferred_name": "",
    "legal_name": "",
    "date_of_birth": "",
    "place_of_birth": "",
    "nationality": "",
    "gender": "",
    "location": "",
    "occupation": "",
    "education": ""
  },
  "verification": {
    "status": "unverified",
    "sources": [],
    "last_verified": ""
  }
}
```

Fields containing sensitive or identifying information must remain local/private by default and must not be committed to a public GitHub repository unless Choco explicitly decides to publish them.

## Web Research

Web research may be used to locate publicly available information about Choco when Choco explicitly identifies the public identity/profile to investigate.

The research process should:

1. Search the supplied public identifier or profile.
2. Collect candidate sources.
3. Check whether multiple sources refer to the same person.
4. Record source URLs and retrieval dates locally.
5. Separate verified facts from claims or uncertain matches.
6. Present findings to Choco for confirmation.
7. Only after confirmation, add the information to the local identity dataset.

The system should avoid broad searches that could accidentally merge information belonging to another person with Choco's identity.

## No Automatic Public-Person Profiling

The project must not treat arbitrary search results as permission to build a personal profile. Public information is used only for the specific identity-reconstruction purpose authorized by Choco and should be limited to information relevant to the project.

## Local-First Storage

The intended architecture is:

```text
Public Sources / Choco Input
          ↓
     Research Layer
          ↓
   Verification Layer
          ↓
   Choco Approval
          ↓
 Local Identity Dataset
          ↓
 AIKEPRIBADIAN Memory / Context
```

The public GitHub repository should contain schemas, code, documentation, and sanitized examples rather than Choco's private identity database.

## Training Use

Identity facts do not automatically need to become model weights. They can remain structured local data and be injected into the model context when relevant.

```text
Identity Data
     ↓
Verification
     ↓
Local Memory
     ↓
Relevant Context
     ↓
Local LLM
```

This allows the identity dataset to be corrected without retraining the model every time a personal fact changes.

## Verification Statuses

Recommended statuses:

- `unverified`
- `candidate`
- `verified_by_choco`
- `verified_by_multiple_sources`
- `outdated`
- `conflicting`
- `rejected`

Only `verified_by_choco` or another explicitly approved state should be treated as authoritative identity information.

## Privacy Rule

Personal identity information is part of the AIKEPRIBADIAN private data layer, not ordinary source code. The repository may contain the structure and processing logic, while the actual personal dataset should remain local unless Choco explicitly chooses otherwise.
