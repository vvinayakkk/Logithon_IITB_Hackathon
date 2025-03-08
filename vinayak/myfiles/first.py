import re
import json
import PyPDF2
import numpy as np
import faiss
from pathlib import Path
from sentence_transformers import SentenceTransformer
import pickle
import os
import time
import asyncio
import spacy
import google.generativeai as genai
from PIL import Image
import pandas as pd
import io

_model = None
_index = None
_all_items = None
_country_map = None
_country_data = None
_nlp = None

# Gemini API Configuration
GEMINI_API_KEY = "AIzaSyDqMg4cv_n04wbxo16Bpovc01LXAa96h_I"
genai.configure(api_key=GEMINI_API_KEY)

def get_embedding_model():
    """Load the embedding model only once and reuse it."""
    global _model
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF file."""
    text = ""
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        for page_num in range(len(reader.pages)):
            page = reader.pages[page_num]
            text += page.extract_text() + "\n"
    return text

def get_nlp_model():
    """Load the spaCy NLP model for natural language processing."""
    global _nlp
    if _nlp is None:
        try:
            _nlp = spacy.load("en_core_web_sm")
        except:
            os.system("python -m spacy download en_core_web_sm")
            _nlp = spacy.load("en_core_web_sm")
    return _nlp

def parse_country_data(text):
    """Parse the text to extract country data."""
    lines = text.split('\n')
    countries_data = {}
    current_country = None
    current_items = []
    
    country_pattern = re.compile(r'^([A-Za-z\s]+)\s*Import\s*Prohibitions$')
    item_pattern = re.compile(r'^\s*[•\-*]\s*(.+)$')
    
    for line in lines:
        line = line.strip()
        country_match = country_pattern.match(line)
        if country_match:
            if current_country and current_items:
                countries_data[current_country] = current_items
            current_country = country_match.group(1).strip()
            current_items = []
            continue
        
        item_match = item_pattern.match(line)
        if item_match and current_country:
            item_text = item_match.group(1).strip()
            if item_text and not item_text.startswith('See') and not item_text.startswith('Current as of'):
                current_items.append(item_text)
    
    if current_country and current_items:
        countries_data[current_country] = current_items
    
    return countries_data

def process_fedex_pdf(pdf_path, output_path):
    """Process the PDF and save country restrictions as JSON."""
    text = extract_text_from_pdf(pdf_path)
    countries_data = parse_country_data(text)
    cleaned_data = {}
    for country, items in countries_data.items():
        country_clean = re.sub(r'\s+', ' ', country).strip()
        if '\n' in country_clean:
            parts = country_clean.split('\n')
            country_clean = next((part.strip() for part in reversed(parts) if part.strip()), country_clean)
        if country_clean not in cleaned_data:
            cleaned_data[country_clean] = items
        else:
            cleaned_data[country_clean].extend(items)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(cleaned_data, f, indent=2, ensure_ascii=False)
    
    return cleaned_data

def fix_malformed_countries(json_file):
    """Fix any malformed country names in the JSON file."""
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    fixed_data = {}
    for country, items in data.items():
        if '\\n' in country:
            parts = country.split('\\n')
            country_name = next((part.strip() for part in reversed(parts) if part.strip()), country)
            if parts[0].strip() and len(parts) > 1:
                prev_countries = list(fixed_data.keys())
                if prev_countries:
                    fixed_data[prev_countries[-1]].append(parts[0].strip())
            if country_name in fixed_data:
                fixed_data[country_name].extend(items)
            else:
                fixed_data[country_name] = items
        else:
            if country in fixed_data:
                fixed_data[country].extend(items)
            else:
                fixed_data[country] = items
    
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(fixed_data, f, indent=2, ensure_ascii=False)
    
    return fixed_data

def create_vector_database(data, output_dir="vector_db"):
    """Create a vector database from the country items data."""
    os.makedirs(output_dir, exist_ok=True)
    model = get_embedding_model()
    all_items = []
    country_map = []
    
    for country, items in data.items():
        for item in items:
            all_items.append(item)
            country_map.append(country)
    
    batch_size = 32
    embeddings_list = []
    for i in range(0, len(all_items), batch_size):
        batch = all_items[i:i + batch_size]
        batch_embeddings = model.encode(batch)
        embeddings_list.append(batch_embeddings)
    
    embeddings = np.vstack(embeddings_list)
    faiss.normalize_L2(embeddings)
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings.astype(np.float32))
    
    faiss.write_index(index, os.path.join(output_dir, "items_index.faiss"))
    with open(os.path.join(output_dir, "items.pkl"), "wb") as f:
        pickle.dump(all_items, f)
    with open(os.path.join(output_dir, "country_map.pkl"), "wb") as f:
        pickle.dump(country_map, f)
    with open(os.path.join(output_dir, "country_data.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    return {
        "status": "success",
        "items_count": len(all_items),
        "countries_count": len(data)
    }

def initialize_system(db_dir="vector_db", force_reload=False):
    """Initialize the system by loading all required components once."""
    global _model, _index, _all_items, _country_map, _country_data, _nlp
    
    try:
        if _model is None or force_reload:
            _model = get_embedding_model()
        
        if _nlp is None or force_reload:
            _nlp = get_nlp_model()
        
        index_path = os.path.join(db_dir, "items_index.faiss")
        items_path = os.path.join(db_dir, "items.pkl")
        country_map_path = os.path.join(db_dir, "country_map.pkl")
        country_data_path = os.path.join(db_dir, "country_data.json")
        
        if not all(os.path.exists(path) for path in [index_path, items_path, country_map_path, country_data_path]):
            return False
        
        if _index is None or _all_items is None or _country_map is None or _country_data is None or force_reload:
            _index = faiss.read_index(index_path)
            with open(items_path, "rb") as f:
                _all_items = pickle.load(f)
            with open(country_map_path, "rb") as f:
                _country_map = pickle.load(f)
            with open(country_data_path, "r", encoding="utf-8") as f:
                _country_data = json.load(f)
            return True
    except Exception as e:
        print(f"Error initializing system: {e}")
        return False
    return True

def query_vector_database(query, top_k=10):
    """Query the vector database for similar items."""
    global _model, _index, _all_items, _country_map
    
    if not initialize_system():
        return {"error": "Failed to initialize the system"}
    
    if _model is None:
        _model = get_embedding_model()
    
    if _index is None:
        return {"error": "FAISS index is not loaded"}
    
    query_embedding = _model.encode([query])
    faiss.normalize_L2(query_embedding)
    distances, indices = _index.search(query_embedding.astype(np.float32), top_k)
    
    results = []
    for i, idx in enumerate(indices[0]):
        if idx < len(_all_items):
            item = _all_items[idx]
            country = _country_map[idx]
            score = distances[0][i]
            results.append({"country": country, "item": item, "score": float(score)})
    
    return results

def get_prohibited_items_for_country(country):
    """Get all prohibited items for a specific country."""
    global _country_data
    
    if not initialize_system():
        return {"error": "Failed to initialize the system"}
    
    for name, items in _country_data.items():
        if name.lower() == country.lower():
            return {"country": name, "items": items, "count": len(items)}
    
    partial_matches = [name for name in _country_data.keys() if country.lower() in name.lower()]
    if partial_matches:
        best_match = partial_matches[0]
        return {"country": best_match, "items": _country_data[best_match], "count": len(_country_data[best_match])}
    
    return {"error": f"Country '{country}' not found in the database."}

def search_prohibited_items(query, top_k=20):
    """Search for prohibited items based on a query."""
    query = query.strip()
    results = query_vector_database(query, top_k)
    
    if isinstance(results, dict) and "error" in results:
        return results
    
    countries = {}
    for result in results:
        country = result["country"]
        if country not in countries:
            countries[country] = []
        countries[country].append({"item": result["item"], "score": result["score"]})
    
    response = []
    for country, items in countries.items():
        items.sort(key=lambda x: x["score"], reverse=True)
        response.append({
            "country": country,
            "items": [item["item"] for item in items],
            "scores": [item["score"] for item in items],
            "count": len(items)
        })
    
    response.sort(key=lambda x: max(x["scores"]) if x["scores"] else 0, reverse=True)
    
    return response

def extract_entities(text):
    """Extract entities from the query text."""
    global _nlp
    
    if _nlp is None:
        _nlp = get_nlp_model()
    
    doc = _nlp(text)
    countries = [ent.text for ent in doc.ents if ent.label_ == "GPE"]
    items = [token.text for token in doc if token.pos_ in ["NOUN", "PROPN"] and token.text.lower() not in ["country", "countries"]]
    
    return {"countries": countries, "items": items}

def format_country_items_response(country_data):
    """Format an official response for country-specific restrictions."""
    country = country_data['country']
    items = country_data['items']
    
    response = [
        f"OFFICIAL IMPORT RESTRICTIONS - {country.upper()}",
        f"Number of Restricted Items: {len(items)}",
        "\nPROHIBITED ITEMS AND MATERIALS:",
    ]
    
    for item in items:
        response.append(f"• {item}")
    
    response.extend([
        "\nIMPORTANT NOTICE:",
        "• This list represents current import prohibitions",
        "• Additional restrictions may apply",
        "• Verify requirements with customs authorities"
    ])
    
    return "\n".join(response)

def chatbot_response(query, chat_history):
    """Generate a human-like response using Gemini API and RAG with memory of previous chat."""
    entities = extract_entities(query)
    countries = entities["countries"]
    items = entities["items"]
    
    if not initialize_system():
        return "Hmm, it looks like I can't access the database right now. Could you try again later?"
    
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    country_data = None
    if countries:
        country = countries[0]
        result = get_prohibited_items_for_country(country)
        if "error" not in result:
            country_data = result

    history_context = ""
    if chat_history and len(chat_history) > 0:
        history_context = "Previous conversation:\n"
        for msg in chat_history[-3:]:
            role = "User" if msg["role"] == "user" else "Assistant"
            history_context += f"{role}: {msg['content']}\n"
        history_context += "\n"

    if countries and items:
        if not country_data:
            return ("• The specified country is not found in our database.\n"
                   "• Please verify the country name and try again.\n"
                   "• For assistance, you may provide the country's full name.")
        
        item = " ".join(items)
        all_prohibited = country_data["items"]
        matched_items = [i for i in all_prohibited if any(word.lower() in i.lower() for word in items)]
        
        context = (
            f"{history_context}"
            f"Official Import Restrictions Database\n"
            f"Country: {country}\n\n"
            f"Total Restricted Items: {len(all_prohibited)}\n\n"
            "Complete List of Import Prohibitions:\n" +
            "\n".join(f"• {item}" for item in all_prohibited) +
            f"\n\nQuery Analysis for: {item}\n" +
            "Relevant Restrictions:\n" +
            ("\n".join(f"• {item}" for item in matched_items) if matched_items else "• No direct matches found") +
            "\n\nCreate an official response that includes:\n"
            "• A clear declaration of the item's import status\n"
            "• Complete list of relevant restrictions\n"
            "• Related categories of prohibited items\n"
            "• Standard regulatory disclaimer\n"
            "Format as a formal bulletin with bullet points\n"
            "Maintain authoritative tone throughout"
        )
        
        response = model.generate_content(context)
        return response.text

    elif items and not countries:
        item = " ".join(items)
        results = search_prohibited_items(item, top_k=100)
        
        if isinstance(results, dict) and "error" in results:
            return ("• System Notice: Unable to process database query\n"
                   "• Please rephrase your inquiry or try again later")
        
        if results:
            countries_with_item = [r for r in results if any(score > 0.5 for score in r["scores"])]
            context = (
                f"{history_context}"
                "INTERNATIONAL IMPORT RESTRICTIONS BULLETIN\n\n"
                f"Subject: {item.upper()}\n\n" +
                "\n\n".join(
                    f"JURISDICTION: {r['country']}\nPROHIBITED ITEMS AND CATEGORIES:\n" +
                    "\n".join(f"• {item}" for item in r['items'])
                    for r in countries_with_item
                ) +
                "\n\nGenerate formal advisory that includes:\n"
                "• Official notification of jurisdictions with restrictions\n"
                "• Comprehensive list of affected territories\n"
                "• Complete itemization of related restrictions\n"
                "• Standard regulatory notice\n"
                "Use formal, authoritative language\n"
                "Format as official bulletin"
            )
            response = model.generate_content(context)
            return response.text
        return ("OFFICIAL NOTICE:\n"
                "• No specific import restrictions found for this item\n"
                "• Importers must verify requirements with relevant authorities\n"
                "• Additional regulations may apply")

    elif country_data:
        return format_country_items_response(country_data)

    else:
        if chat_history and len(chat_history) > 0:
            recent_countries = []
            recent_items = []
            
            for msg in chat_history[-3:]:
                if msg["role"] == "user":
                    entities = extract_entities(msg["content"])
                    if entities["countries"] and not recent_countries:
                        recent_countries = entities["countries"]
                    if entities["items"] and not recent_items:
                        recent_items = entities["items"]
            
            if recent_countries:
                country = recent_countries[0]
                result = get_prohibited_items_for_country(country)
                if "error" not in result:
                    context = (
                        f"{history_context}"
                        f"The user previously asked about {country}. Based on that context:\n\n"
                        f"Query: {query}\n\n"
                        "Please provide a helpful response about prohibited items in this country, "
                        "referencing the previous conversation and addressing the user's new query."
                    )
                    response = model.generate_content(context)
                    return response.text.replace("FedEx", "").replace("fedex", "")
            
            context = (
                f"{history_context}"
                f"User's new query: {query}\n\n"
                "Based on the conversation history, provide a helpful response about prohibited shipping items. "
                "If you can't determine what the user is asking about, prompt them for more specific information."
            )
            response = model.generate_content(context)
            return response.text.replace("FedEx", "").replace("fedex", "")
        
        return ("• I need more specific information to help you\n"
                "• Try asking about:\n"
                "  • A specific country (e.g., 'What items are prohibited in Japan?')\n"
                "  • A specific item (e.g., 'Which countries prohibit electronics?')\n"
                "  • Or both (e.g., 'Can I ship alcohol to France?')")

def get_image_description(image):
    """Get a short description of the image using Gemini Vision."""
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = "Describe what item is shown in this image in 2-3 words only. Be very concise."
    
    try:
        response = model.generate_content([prompt, image])
        return response.text.strip()
    except Exception as e:
        print(f"Error processing image: {e}")
        return None

def get_multiple_items_from_image(image):
    """Get multiple items detected in the image using Gemini Vision."""
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = """List detected physical objects:
    - One item per line
    - Use 2-3 words only
    - Skip decorative or background items
    - Maximum 5 items
    Do not include any introductory text or bullets."""
    
    try:
        response = model.generate_content([prompt, image])
        clean_text = response.text.strip()
        clean_text = re.sub(r'^(Here\'s|This is|I see|The image shows).*?\n', '', clean_text, flags=re.IGNORECASE)
        clean_text = re.sub(r'^[-•*]\s*', '', clean_text, flags=re.MULTILINE)
        items = [item.strip() for item in clean_text.split('\n') if item.strip()]
        return items[:5]
    except Exception as e:
        print(f"Error processing image: {e}")
        return []

def create_results_dataframe(items_results):
    """Create a pandas DataFrame from multiple items search results."""
    import pandas as pd
    
    if not items_results:
        return pd.DataFrame(columns=["Search Item", "Country", "Prohibited Item", "Relevance"])
        
    all_rows = []
    for item, results in items_results.items():
        for country_result in results:
            for detected_item, score in zip(country_result["items"], country_result["scores"]):
                if score > 0.6:
                    all_rows.append({
                        "Search Item": item,
                        "Country": country_result["country"],
                        "Prohibited Item": detected_item,
                        "Relevance": f"{score:.3f}"
                    })
    
    if not all_rows:
        return pd.DataFrame(columns=["Search Item", "Country", "Prohibited Item", "Relevance"])
    
    return pd.DataFrame(all_rows)



