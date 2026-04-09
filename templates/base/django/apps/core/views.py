import time

from django.http import JsonResponse

_start_time = time.time()


def health(request):
    return JsonResponse({
        "status": "ok",
        "uptime": round(time.time() - _start_time, 2),
        "timestamp": int(time.time()),
    })
