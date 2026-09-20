from pydantic import BaseModel


class StudentAnswer(BaseModel):
    run_id: str
    answer_text: str
