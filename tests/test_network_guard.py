"""
Unit and integration tests for BugStriker Network Connectivity Guard.
Verifies that the agent strictly refuses to run if the network is disconnected.
"""
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.core.network import (
    NetworkDisconnectedError,
    ensure_network_connected,
    is_network_connected,
)

client = TestClient(app)
AUTH_HEADERS = {"Authorization": "Bearer dev-student-1"}
TWO_SUM_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"


def test_ensure_network_connected_raises_when_offline():
    """Verify ensure_network_connected raises NetworkDisconnectedError when offline."""
    with patch("app.core.network.is_network_connected", return_value=False):
        with pytest.raises(NetworkDisconnectedError) as exc_info:
            ensure_network_connected()
        assert "Network disconnected" in str(exc_info.value)


def test_ensure_network_connected_succeeds_when_online():
    """Verify ensure_network_connected completes cleanly when online."""
    with patch("app.core.network.is_network_connected", return_value=True):
        # Should not raise
        ensure_network_connected()


def test_create_run_blocked_when_network_disconnected():
    """Verify POST /api/runs/ returns HTTP 503 when network is disconnected."""
    with patch("app.api.runs.ensure_network_connected", side_effect=NetworkDisconnectedError("Network disconnected: An active internet connection is required to run the BugStriker agent.")):
        response = client.post(
            "/api/runs/",
            json={"problem_id": TWO_SUM_ID},
            headers=AUTH_HEADERS,
        )
        assert response.status_code == 503
        data = response.json()
        assert "Network disconnected" in data["detail"]


def test_submission_blocked_when_network_disconnected():
    """Verify POST /api/runs/{id}/submit returns HTTP 503 when network is disconnected."""
    # First create a run in online state
    with patch("app.core.network.is_network_connected", return_value=True):
        res = client.post(
            "/api/runs/",
            json={"problem_id": TWO_SUM_ID},
            headers=AUTH_HEADERS,
        )
        assert res.status_code == 201
        run_id = res.json()["run_id"]

    # Now attempt to submit code with network disconnected
    with patch("app.agent.orchestrator.ensure_network_connected", side_effect=NetworkDisconnectedError("Network disconnected: An active internet connection is required to run the BugStriker agent.")):
        response = client.post(
            f"/api/runs/{run_id}/submit",
            json={"code": "def two_sum(nums, target): return [0, 1]"},
            headers=AUTH_HEADERS,
        )
        assert response.status_code == 503
        data = response.json()
        assert "Network disconnected" in data["detail"]


def test_health_check_reports_network_status():
    """Verify /health endpoint reports network_connected and require_network flags."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "network_connected" in data
    assert "require_network" in data
    assert data["require_network"] is True
