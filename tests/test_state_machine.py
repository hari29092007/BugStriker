"""
Unit tests for BugStriker state machine transitions and rules.
"""
import pytest
from app.agent.state_machine import RunState, StateMachine, InvalidTransitionError


def test_valid_state_transitions():
    sm = StateMachine(RunState.SUBMITTED)
    assert sm.current_state == RunState.SUBMITTED

    # SUBMITTED -> RUNNING_TESTS
    sm.transition(RunState.RUNNING_TESTS)
    assert sm.current_state == RunState.RUNNING_TESTS

    # RUNNING_TESTS -> ANALYZING
    sm.transition(RunState.ANALYZING)
    assert sm.current_state == RunState.ANALYZING

    # ANALYZING -> QUESTIONING
    sm.transition(RunState.QUESTIONING)
    assert sm.current_state == RunState.QUESTIONING

    # QUESTIONING -> WAITING_FOR_STUDENT
    sm.transition(RunState.WAITING_FOR_STUDENT)
    assert sm.current_state == RunState.WAITING_FOR_STUDENT
    assert sm.is_waiting_for_student is True

    # WAITING_FOR_STUDENT -> REVISION
    sm.transition(RunState.REVISION)
    assert sm.current_state == RunState.REVISION

    # REVISION -> RUNNING_TESTS
    sm.transition(RunState.RUNNING_TESTS)
    assert sm.current_state == RunState.RUNNING_TESTS

    # RUNNING_TESTS -> ANALYZING
    sm.transition(RunState.ANALYZING)
    assert sm.current_state == RunState.ANALYZING

    # ANALYZING -> FINISHED
    sm.transition(RunState.FINISHED)
    assert sm.current_state == RunState.FINISHED
    assert sm.is_terminal is True


def test_auto_pass_transition():
    # If initial submission passes all tests: ANALYZING -> FINISHED directly
    sm = StateMachine(RunState.ANALYZING)
    sm.transition(RunState.FINISHED)
    assert sm.current_state == RunState.FINISHED


def test_invalid_transitions():
    # Cannot jump from SUBMITTED directly to FINISHED
    sm = StateMachine(RunState.SUBMITTED)
    with pytest.raises(InvalidTransitionError):
        sm.transition(RunState.FINISHED)

    # Cannot jump from SUBMITTED to REVISION
    with pytest.raises(InvalidTransitionError):
        sm.transition(RunState.REVISION)

    # Cannot transition anywhere once FINISHED
    sm_fin = StateMachine(RunState.FINISHED)
    with pytest.raises(InvalidTransitionError):
        sm_fin.transition(RunState.SUBMITTED)
