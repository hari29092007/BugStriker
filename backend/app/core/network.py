"""
Network Connectivity Guard for BugStriker.
Ensures the agent does not execute if the network/internet is disconnected.
"""
from __future__ import annotations

import socket
import time
from typing import Optional


class NetworkDisconnectedError(RuntimeError):
    """Raised when an operation requires an active internet connection but network is down."""
    pass


_LAST_CHECK_TIME: float = 0.0
_LAST_CHECK_RESULT: bool = True
_CACHE_TTL_SECONDS: float = 2.0


def is_network_connected(
    timeout: float = 1.5,
    use_cache: bool = True,
    override_status: Optional[bool] = None,
) -> bool:
    """
    Check if the external network/internet is reachable.
    Attempts TCP socket connection to known reliable public endpoints.
    Caches the result briefly (2s) to prevent request latency overhead.
    """
    if override_status is not None:
        return override_status

    global _LAST_CHECK_TIME, _LAST_CHECK_RESULT
    now = time.time()
    if use_cache and (now - _LAST_CHECK_TIME) < _CACHE_TTL_SECONDS:
        return _LAST_CHECK_RESULT

    # Check reliable endpoints (Google DNS, Cloudflare DNS)
    endpoints = [
        ("8.8.8.8", 53),
        ("1.1.1.1", 53),
    ]

    for host, port in endpoints:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(timeout)
                s.connect((host, port))
                _LAST_CHECK_TIME = now
                _LAST_CHECK_RESULT = True
                return True
        except (OSError, Exception):
            continue

    _LAST_CHECK_TIME = now
    _LAST_CHECK_RESULT = False
    return False


def ensure_network_connected(timeout: float = 1.5) -> None:
    """
    Enforces active network connectivity.
    Raises NetworkDisconnectedError if offline.
    """
    if not is_network_connected(timeout=timeout, use_cache=True):
        raise NetworkDisconnectedError(
            "Network disconnected: An active internet connection is required to run the BugStriker agent."
        )
