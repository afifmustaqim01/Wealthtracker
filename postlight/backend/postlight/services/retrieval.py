import google.generativeai as genai
from langchain_core.messages import SystemMessage, HumanMessage
from postlight.clients import chat_model

EMBEDDING_MODEL = "models/embedding-001"

def embed(text: str, task_type: str = "RETRIEVAL_DOCUMENT") -> list[float]:
    try:
        response = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text,
            task_type=task_type,
        )
        return response["embedding"]
    except Exception as e:
        print(f"Warning: embedding skipped due to: {e}")
        return [0.0] * 768

def vector_literal(embedding: list[float]) -> str:
    return "[" + ",".join(str(x) for x in embedding) + "]"

def index_transaction(conn, txn_id: str, title: str, amount: float, txn_type: str, category: str, notes: str, txn_date: str):
    # Compile transaction metadata into natural text for semantic analysis
    log_text = f"Date: {txn_date} | Type: {txn_type.upper()} | Category: {category} | Title: {title} | Amount: ${amount:.2f} | Notes: {notes}".strip()
    
    with conn.cursor() as cur:
        cur.execute("DELETE FROM public.transaction_chunks WHERE transaction_id = %s;", (txn_id,))
        embedding = embed(log_text, task_type="RETRIEVAL_DOCUMENT")
        emb_vector = vector_literal(embedding)
        
        cur.execute(
            """
            INSERT INTO public.transaction_chunks (transaction_id, chunk_text, embedding)
            VALUES (%s, %s, %s::vector);
            """,
            (txn_id, log_text, emb_vector)
        )

def answer_financial_question(conn, user_id: str, question: str) -> dict:
    q_embedding = embed(question, task_type="RETRIEVAL_QUERY")
    emb_vector = vector_literal(q_embedding)

    with conn.cursor() as cur:
        # Retrieve nearest transactions belonging ONLY to this user
        cur.execute(
            """
            SELECT t.id, t.title, tc.chunk_text, (tc.embedding <=> %s::vector) AS distance
            FROM public.transaction_chunks tc
            JOIN public.transactions t ON tc.transaction_id = t.id
            WHERE t.user_id = %s
            ORDER BY tc.embedding <=> %s::vector
            LIMIT 10;
            """,
            (emb_vector, user_id, emb_vector)
        )
        rows = cur.fetchall()

    if not rows:
        return {
            "answer": "You do not have any recorded transactions yet. Add some expenses or income entries first!",
            "sources": []
        }

    sources_dict = {}
    context_blocks = []
    for row in rows:
        txn_id = str(row[0])
        txn_title = row[1]
        chunk_text = row[2]
        sources_dict[txn_id] = txn_title
        context_blocks.append(chunk_text)

    context_str = "\n".join(context_blocks)

    system_prompt = (
        "You are an expert AI Wealth & Personal Finance Advisor. "
        "Analyze the user's spending habits, expenses, and income using ONLY the verified transaction logs provided below. "
        "Be direct, accurate with numbers, provide constructive budget tips, and highlight patterns. "
        "If the logs don't provide sufficient data to answer a question, state so honestly."
    )
    user_prompt = f"User Transaction Logs:\n{context_str}\n\nQuestion: {question}"

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]
    response = chat_model.invoke(messages)

    return {
        "answer": response.content,
        "sources": [{"id": tid, "title": title} for tid, title in sources_dict.items()]
    }