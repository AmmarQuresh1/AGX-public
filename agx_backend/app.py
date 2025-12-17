import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from pydantic import BaseModel
from agx.core import agx_main
from fastapi.middleware.cors import CORSMiddleware
# Slowapi for rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from redis import Redis

app = FastAPI()

# Plan downloading
class Script(BaseModel):
    prompt: str

# Rate limiting
def get_real_ip(request: Request):
    # Prefer x-forwarded-for if present, else fallback
    xff = request.headers.get("x-forwarded-for")
    if xff:
        # x-forwarded-for can be a comma-separated list; take the first
        return xff.split(",")[0].strip()
    return request.client.host

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://192.168.1.148:3000", "http://localhost:3000", "https://agx.run"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_url = os.getenv("REDIS_URL")

limiter = Limiter(key_func=get_real_ip,
                  storage_uri=redis_url) 
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/", response_class=PlainTextResponse)
@limiter.limit("5/day") # Set limits here
def generate_script(script: Script, request: Request):
    result = agx_main(script.prompt)
    if "error" in result:
        if result["error"] == "validation_failed":
            raise HTTPException(status_code=500, detail="Plan validation failed.")
        elif result["error"] == "compilation_failed":
            raise HTTPException(status_code=500, detail="Plan compilation failed.")
        elif result["error"] == "no_prompt":
            raise HTTPException(status_code=400, detail="No prompt given.")
        else:
            raise HTTPException(status_code=500, detail="Unknown error.")
    return result["code"]