from supabase import create_client, Client
import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI
from postlight.config import settings

# 1. Supabase Admin client (must be named supabase_admin)
supabase_admin: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key
)

# 2. Configure Google Gemini
genai.configure(api_key=settings.gemini_api_key)

# 3. LangChain Chat Model
chat_model = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash",
    google_api_key=settings.gemini_api_key,
    temperature=0.2,
)