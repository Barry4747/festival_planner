import google.generativeai as genai
from app.core.config import settings

# Konfiguracja klienta autoryzacji
genai.configure(api_key=settings.GEMINI_API_KEY)

print("Dostępne modele dla generowania tekstu:")
# Pobranie listy modeli i odfiltrowanie tych odpowiednich dla czatu/tekstu
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(f"- {m.name}")