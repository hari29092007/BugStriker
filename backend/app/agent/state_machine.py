from enum import Enum
from typing import Set, Dict


class RunState(str, Enum):
    SUBMITTED = "SUBMITTED"
    RUNNING_TESTS = "RUNNING_TESTS"
    ANALYZING = "ANALYZING"
    QUESTIONING = "QUESTIONING"
    WAITING_FOR_STUDENT = "WAITING_FOR_STUDENT"
    REVISION = "REVISION"
    FINISHED = "FINISHED"


# Valid transitions map
VALID_TRANSITIONS: Dict[RunState, Set[RunState]] = {
    RunState.SUBMITTED: {RunState.RUNNING_TESTS},
    RunState.RUNNING_TESTS: {RunState.ANALYZING},
    RunState.ANALYZING: {RunState.QUESTIONING, RunState.FINISHED},
    RunState.QUESTIONING: {RunState.WAITING_FOR_STUDENT},
    RunState.WAITING_FOR_STUDENT: {RunState.REVISION},
    RunState.REVISION: {RunState.RUNNING_TESTS},
    RunState.FINISHED: set(),  # terminal
}


class InvalidTransitionError(Exception):
    pass


class StateMachine:
    def __init__(self, current_state: RunState):
        self.current_state = current_state

    def transition(self, new_state: RunState) -> RunState:
        allowed = VALID_TRANSITIONS.get(self.current_state, set())
        if new_state not in allowed:
            raise InvalidTransitionError(
                f"Invalid transition: {self.current_state} -> {new_state}. "
                f"Allowed: {[s.value for s in allowed]}"
            )
        self.current_state = new_state
        return self.current_state

    def can_transition_to(self, new_state: RunState) -> bool:
        return new_state in VALID_TRANSITIONS.get(self.current_state, set())

    @property
    def is_terminal(self) -> bool:
        return self.current_state == RunState.FINISHED

    @property
    def is_waiting_for_student(self) -> bool:
        return self.current_state == RunState.WAITING_FOR_STUDENT
