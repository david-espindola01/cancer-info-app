-- A call may start when its prompt fits in the minute (as Groq admits them): the line
-- needs the prompt tokens of each waiting request.
alter table ai_queue rename column tokens to prompt_tokens;
