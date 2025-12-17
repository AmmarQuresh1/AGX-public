"""
planner.py

Generates a plan based on user input.
- Uses AI backend to generate raw JSON output.
- Extracts and validates the first JSON array from the output.
- Returns a list of steps (function and args from JSON) or an empty list if invalid.
"""

# To use Mistral planner move mistral_planner from agx/archive to agx/ and uncomment the import below:
# from .mistral_planner import generate_plan_from_mistral #mistral (currently archived)
from .llm_openai import generate_raw_json #openai
import json
import re

def generate_plan(prompt=None):
    # Interactively prompts user if no input is provided
    if not prompt:
        prompt = input("[AGX] What would you like to do? ")

    print("[AGX Planner] Generating plan...")
    raw_output = generate_raw_json(prompt)

    print("=== RAW AI OUTPUT ===")
    print(raw_output)
    print("========================")

    # Extract the first valid JSON array using regex
    match = re.search(r"\[\s*{.*?}\s*\]", raw_output, re.DOTALL)
    if not match:
        print("[AGX Planner] Failed to extract JSON.")
        return []
    try:
        plan = json.loads(match.group(0)) # Parses the first valid JSON array from the raw output into a Python list
        print("[AGX Planner] Plan parsed successfully.")
        return plan
    except json.JSONDecodeError as e:
        print("[AGX Planner] JSON parsing error:", e)
        return []
