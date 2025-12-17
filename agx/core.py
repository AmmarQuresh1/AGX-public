"""
core.py

Main backend orchestrator for AGX.
- Initializes the backend. 
- Loads and validates the plan.
- Executes the plan if valid.
- Prints final output messages.
"""
from pathlib import Path
from .compiler import compile_plan
from .planner import generate_plan
from .validate_plan import validate_plan
from typing import Optional

# Returns to backend, always return a dict
def agx_main(prompt: Optional[str] = None):
    if not prompt:
        print("[AGX] No prompt provided")
        return {"error": "no_prompt"}

    # Load plan using your planner
    plan = generate_plan(prompt=prompt)

    if validate_plan(plan):
        print("[AGX] Compiling plan...")
        code = compile_plan(plan)

        if code:
            return {"code": code}
        else:
            print("[AGX] Compilation failed.")
            return {"error": "compilation_failed"}
    else:
        print("[AGX] Plan validation failed - cannot compile.")
        return {"error": "validation_failed"}