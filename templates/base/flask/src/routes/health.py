import time

from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)

_start_time = time.time()


@health_bp.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "uptime": round(time.time() - _start_time, 2),
        "timestamp": int(time.time()),
    })
