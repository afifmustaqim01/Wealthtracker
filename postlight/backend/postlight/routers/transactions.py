from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException, status, Response
from typing import Optional
from datetime import datetime, timezone
from postlight.dependencies import get_current_user_id
from postlight.database import get_db
from postlight.services.transactions import validate_transaction_input, serialize_transaction
from postlight.services.storage import upload_post_image, delete_post_image
from postlight.services.retrieval import index_transaction

router = APIRouter(prefix="/transactions", tags=["Transactions"])

# 1. READ ALL
@router.get("")
def list_transactions(user_id: str = Depends(get_current_user_id)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, user_id, title, amount, type, category, notes, receipt_url, transaction_date, created_at
                FROM public.transactions
                WHERE user_id = %s
                ORDER BY transaction_date DESC, created_at DESC;
            """, (user_id,))
            rows = cur.fetchall()
            return [serialize_transaction(r) for r in rows]

# 2. READ ONE
@router.get("/{txn_id}")
def get_transaction(txn_id: str, user_id: str = Depends(get_current_user_id)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, user_id, title, amount, type, category, notes, receipt_url, transaction_date, created_at
                FROM public.transactions
                WHERE id = %s AND user_id = %s;
            """, (txn_id, user_id))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Transaction not found")
            return serialize_transaction(row)

# 3. CREATE
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_transaction(
    title: str = Form(...),
    amount: float = Form(...),
    type: str = Form(...),
    category: str = Form(...),
    notes: Optional[str] = Form(None),
    transaction_date: Optional[str] = Form(None),
    date: Optional[str] = Form(None),
    receipt: Optional[UploadFile] = File(None),
    user_id: str = Depends(get_current_user_id)
):
    try:
        clean_title, clean_amount, clean_type, clean_cat, clean_notes = validate_transaction_input(
            title, amount, type, category, notes
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    receipt_url = None
    if receipt and receipt.filename:
        receipt_url = await upload_post_image(receipt, user_id)

    # Use whatever date field is sent, trimmed to YYYY-MM-DD
    raw_date = transaction_date or date
    final_date = raw_date.split('T')[0].split(' ')[0] if raw_date else datetime.now().strftime("%Y-%m-%d")

    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO public.transactions (user_id, title, amount, type, category, notes, receipt_url, transaction_date)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, user_id, title, amount, type, category, notes, receipt_url, transaction_date, created_at;
                """, (user_id, clean_title, clean_amount, clean_type, clean_cat, clean_notes, receipt_url, final_date))

                new_txn = cur.fetchone()
                txn_id = str(new_txn[0])
                txn_date_str = str(new_txn[8])

                # Index embedding for AI searching
                index_transaction(conn, txn_id, clean_title, float(clean_amount), clean_type, clean_cat, clean_notes, txn_date_str)

            conn.commit()
            return serialize_transaction(new_txn)
    except Exception as e:
        if receipt_url:
            delete_post_image(receipt_url)
        raise HTTPException(status_code=500, detail=f"Failed to record transaction: {str(e)}")

# 4. UPDATE (EDIT)
@router.put("/{txn_id}")
async def update_transaction(
    txn_id: str,
    title: str = Form(...),
    amount: float = Form(...),
    type: str = Form(...),
    category: str = Form(...),
    notes: Optional[str] = Form(None),
    transaction_date: Optional[str] = Form(None),
    date: Optional[str] = Form(None),
    receipt: Optional[UploadFile] = File(None),
    remove_existing_receipt: bool = Form(False),
    user_id: str = Depends(get_current_user_id)
):
    if receipt and receipt.filename and remove_existing_receipt:
        raise HTTPException(
            status_code=400,
            detail="Cannot simultaneously upload a new receipt and request receipt removal."
        )

    try:
        clean_title, clean_amount, clean_type, clean_cat, clean_notes = validate_transaction_input(
            title, amount, type, category, notes
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    old_receipt_to_delete = None
    new_uploaded_receipt = None

    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT receipt_url, transaction_date FROM public.transactions WHERE id = %s AND user_id = %s FOR UPDATE;",
                    (txn_id, user_id)
                )
                row = cur.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Transaction not found or not owned by you")

                current_receipt_url = row[0]
                
                # Check incoming date inputs first
                raw_date = transaction_date or date
                if raw_date and raw_date.strip():
                    effective_date = raw_date.strip().split('T')[0].split(' ')[0]
                else:
                    effective_date = str(row[1]).split('T')[0].split(' ')[0]

                updated_receipt_url = current_receipt_url

                if remove_existing_receipt:
                    old_receipt_to_delete = current_receipt_url
                    updated_receipt_url = None
                elif receipt and receipt.filename:
                    new_uploaded_receipt = await upload_post_image(receipt, user_id)
                    old_receipt_to_delete = current_receipt_url
                    updated_receipt_url = new_uploaded_receipt

                cur.execute("""
                    UPDATE public.transactions
                    SET title = %s,
                        amount = %s,
                        type = %s,
                        category = %s,
                        notes = %s,
                        receipt_url = %s,
                        transaction_date = %s,
                        updated_at = timezone('utc'::text, now())
                    WHERE id = %s AND user_id = %s
                    RETURNING id, user_id, title, amount, type, category, notes, receipt_url, transaction_date, created_at;
                """, (clean_title, clean_amount, clean_type, clean_cat, clean_notes, updated_receipt_url, effective_date, txn_id, user_id))

                updated_txn = cur.fetchone()

                # Refresh AI embedding
                index_transaction(conn, txn_id, clean_title, float(clean_amount), clean_type, clean_cat, clean_notes, effective_date)

            conn.commit()

        if old_receipt_to_delete:
            delete_post_image(old_receipt_to_delete)

        return serialize_transaction(updated_txn)
    except HTTPException:
        if new_uploaded_receipt:
            delete_post_image(new_uploaded_receipt)
        raise
    except Exception as e:
        if new_uploaded_receipt:
            delete_post_image(new_uploaded_receipt)
        raise HTTPException(status_code=500, detail=f"Failed to update transaction: {str(e)}")

# 5. DELETE
@router.delete("/{txn_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(txn_id: str, user_id: str = Depends(get_current_user_id)):
    receipt_to_clean = None
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT receipt_url FROM public.transactions WHERE id = %s AND user_id = %s FOR UPDATE;", (txn_id, user_id))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Transaction not found or not owned by you")

            receipt_to_clean = row[0]
            cur.execute("DELETE FROM public.transactions WHERE id = %s AND user_id = %s;", (txn_id, user_id))
        conn.commit()

    if receipt_to_clean:
        delete_post_image(receipt_to_clean)

    return Response(status_code=status.HTTP_204_NO_CONTENT)