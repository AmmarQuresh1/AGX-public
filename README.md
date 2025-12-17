# AGX

![Status](https://img.shields.io/badge/status-alpha-yellow)
![License](https://img.shields.io/badge/license-GPL_v2.0-blue)
![Python](https://img.shields.io/badge/python-3.10+-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue)

> **Live Demo:** [agx.run](https://agx.run)

**AGX** is a deterministic compiler that translates natural language into verifiable Terraform. It constrains LLM output to a strict registry of predefined templates, eliminating the syntax errors and hallucinations common in generative approaches.

## The Concept

Standard AI agents write code probabilistically. AGX generates code deterministically by validating the plan structure before a single line of HCL is synthesized.

| Standard LLM Approach | AGX Compiler Approach |
| :--- | :--- |
| **Probabilistic:** "Hopefully this syntax is right." | **Deterministic:** Syntax is guaranteed by a static registry. |
| **Hallucinations:** Invents non-existent arguments. | **Type Safety:** Validates args against Python signatures. |
| **Black Box:** Hard to debug or audit. | **Auditable:** Compiles to an intermediate Python artifact. |

## Architecture

AGX treats the LLM as an untrusted planner, sandwiching it between a strict validator and a deterministic compiler.

```mermaid
graph LR
    A[User Prompt] -->|Natural Language| B(Planner / LLM);
    B -->|JSON IR| C{Static Validator};
    C -- Invalid --> F[Reject Plan];
    C -- Valid --> D[Compiler];
    D -->|Synthesize| E[Verified Python Script];
```

## Repository Structure

* `agx/`: Core engine.
  * `core.py`: Main orchestrator connecting the pipeline stages.
  * `llm_openai.py`: Generate JSON using `gpt-4.1-nano`.
  * `planner.py`: Converts JSON object to list.
  * `compiler.py`: Synthesizes a valid Python script using `inspect.getsource`.
  * `validate_plan.py`: Enforces strict type safety and parameter existence against the registry.
  * `registries/devops_test.py`: A demo registry focused on basic AWS infrastructure.
* `agx_backend/`: FastAPI service exposing engine.
* `agx_frontend/`: Next.js (React) interface.

## Quick Start

### 1. Install dependencies
```
pip install -r requirements.txt
```

### 2. Run the test suite 
```
python -m pytest agx/tests/
```

### 3. Launch app
**Frontend:**
```
cd agx_frontend
npm run dev
```
**Backend:**
```
cd agx_backend
fastapi dev app.py
```

## Roadmap
- Current: Alpha demo
- Q1 2026: Open-source CLI 

Built by [Ammar Qureshi](https://www.linkedin.com/in/ammar-qureshi-083831274)