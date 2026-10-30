from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from postlight.config import settings
from postlight.routers import health, transactions, chat

app = FastAPI(title="Wealth & Expense Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(health.router)
app.include_router(transactions.router)
app.include_router(chat.router)