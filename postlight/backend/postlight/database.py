import psycopg
from contextlib import contextmanager
from postlight.config import settings

@contextmanager
def get_db():
    conn = psycopg.connect(settings.supabase_db_url)
    try:
        yield conn
    finally:
        conn.close()