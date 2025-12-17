"""
llm_openai.py

Calls openAI api to generate an output from prompt.
- Prompts are in prompt_templates subfolder.
- The prompts are usually requesting for output in JSON that gets parsed by planner.py.
"""

from pathlib import Path
from dotenv import load_dotenv
import os

try:  # pragma: no cover - just setup logic
    from openai import OpenAI  # type: ignore
except Exception:  # openai might not be installed
    OpenAI = None  # type: ignore

load_dotenv()

# Only create a client if openai is available and an API key is provided
_api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=_api_key) if OpenAI and _api_key else None

def generate_raw_json(task: str) -> str:
    if client is None:
        raise RuntimeError(
            "OpenAI client is not configured. Install the openai package and set OPENAI_API_KEY."
        )
    current_dir = Path(__file__).parent
    template_path = current_dir / "prompt_templates" / "devops_test.txt" 
    with open(template_path, "r") as f:
        template = f.read()

    prompt = template.replace("{{TASK}}", task)

    print("Prompt Sent to GPT")

    response = client.responses.create(
        model="gpt-4.1-nano-2025-04-14",  # or "gpt-4.1-mini-2025-04-14"
        input=prompt,
        temperature=0, # not usable with o3-mini or gpt 5 models
        # reasoning={"effort":"minimal"} 
    )

    return response.output_text
