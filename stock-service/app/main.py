import os

from fastapi import FastAPI

SERVICE_NAME = os.getenv("SERVICE_NAME", "gateway")

app = FastAPI(title=f"UCH-FyD {SERVICE_NAME}", version="1.0.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": SERVICE_NAME}