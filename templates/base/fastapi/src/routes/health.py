import time

from fastapi import APIRouter

router = APIRouter()

_start_time = time.time()


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "uptime": round(time.time() - _start_time, 2),
        "timestamp": int(time.time()),
    }
