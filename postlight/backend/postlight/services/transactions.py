from datetime import datetime, date
from decimal import Decimal

VALID_TYPES = {"income", "expense"}

def validate_transaction_input(
    title: str,
    amount: float,
    txn_type: str,
    category: str,
    notes: str | None = None
) -> tuple[str, Decimal, str, str, str]:
    title_clean = title.strip()
    category_clean = category.strip()
    notes_clean = (notes or "").strip()
    type_clean = txn_type.strip().lower()

    if not (1 <= len(title_clean) <= 160):
        raise ValueError("Title must be between 1 and 160 characters.")
    if amount <= 0:
        raise ValueError("Amount must be greater than 0.")
    if type_clean not in VALID_TYPES:
        raise ValueError("Type must be either 'income' or 'expense'.")
    if not (1 <= len(category_clean) <= 50):
        raise ValueError("Category must be between 1 and 50 characters.")

    return title_clean, Decimal(str(amount)), type_clean, category_clean, notes_clean

def serialize_transaction(row: tuple | dict) -> dict:
    if isinstance(row, dict):
        return {
            "id": str(row["id"]),
            "user_id": str(row["user_id"]),
            "title": row["title"],
            "amount": float(row["amount"]),
            "type": row["type"],
            "category": row["category"],
            "notes": row.get("notes"),
            "receipt_url": row.get("receipt_url"),
            "transaction_date": str(row["transaction_date"]),
            "created_at": row["created_at"].isoformat() if isinstance(row["created_at"], datetime) else str(row["created_at"]),
        }

    # psycopg tuple: (id, user_id, title, amount, type, category, notes, receipt_url, transaction_date, created_at)
    return {
        "id": str(row[0]),
        "user_id": str(row[1]),
        "title": row[2],
        "amount": float(row[3]),
        "type": row[4],
        "category": row[5],
        "notes": row[6],
        "receipt_url": row[7],
        "transaction_date": str(row[8]),
        "created_at": row[9].isoformat() if isinstance(row[9], datetime) else str(row[9]),
    }