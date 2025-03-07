from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
import re
import json
import PyPDF2
import numpy as np
import faiss
from pathlib import Path
import pickle
import os
import time
import spacy
import google.generativeai as genai
from sentence_transformers import SentenceTransformer

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.secret_key = "fedex_prohibited_items_search_key"  # Required for session

# Directory setup
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_DIR = os.path.join(DATA_DIR, "vector_db")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(DB_DIR, exist_ok=True)

# Global variables to keep resources loaded
_model = None
_index = None
_all_items = None
_country_map = None
_country_data = None
_nlp = None

# Gemini API Configuration
GEMINI_API_KEY = "AIzaSyDqMg4cv_n04wbxo16Bpovc01LXAa96h_I"  # Replace with your actual Gemini API key
genai.configure(api_key=GEMINI_API_KEY)

def get_embedding_model():
    """Load the embedding model only once and reuse it."""
    global _model
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model

def get_nlp_model():
    """Load the spaCy NLP model for natural language processing."""
    global _nlp
    if (_nlp is None):
        try:
            _nlp = spacy.load("en_core_web_sm")
        except:
            print("Installing spaCy model...")
            os.system("python -m spacy download en_core_web_sm")
            _nlp = spacy.load("en_core_web_sm")
    return _nlp

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF file."""
    text = ""
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        for page_num in range(len(reader.pages)):
            page = reader.pages[page_num]
            text += page.extract_text() + "\n"
    return text

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
    
    return cleaned_data, f"Processed {len(cleaned_data)} countries. Data saved to {output_path}"

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
    
    return fixed_data, f"Fixed malformed country names. Now contains {len(fixed_data)} countries."

def create_vector_database(data, output_dir=DB_DIR):
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
    
    return f"Vector database created in {output_dir} with {len(all_items)} items from {len(data)} countries"

def initialize_system(db_dir=DB_DIR, force_reload=False):
    """Initialize the system by loading all required components once."""
    global _model, _index, _all_items, _country_map, _country_data, _nlp
    
    if _model is None or force_reload:
        _model = get_embedding_model()
    
    if _nlp is None or force_reload:
        _nlp = get_nlp_model()
    
    index_path = os.path.join(db_dir, "items_index.faiss")
    items_path = os.path.join(db_dir, "items.pkl")
    country_map_path = os.path.join(db_dir, "country_map.pkl")
    country_data_path = os.path.join(db_dir, "country_data.json")
    
    if not all(os.path.exists(path) for path in [index_path, items_path, country_map_path, country_data_path]):
        return False, "Vector database files not found. Please process the PDF first."
    
    if _index is None or _all_items is None or _country_map is None or _country_data is None or force_reload:
        try:
            _index = faiss.read_index(index_path)
            with open(items_path, "rb") as f:
                _all_items = pickle.load(f)
            with open(country_map_path, "rb") as f:
                _country_map = pickle.load(f)
            with open(country_data_path, "r", encoding="utf-8") as f:
                _country_data = json.load(f)
            return True, f"System initialized successfully with {len(_all_items)} items from {len(_country_data)} countries"
        except Exception as e:
            return False, f"Error initializing system: {e}"
    return True, "System already initialized"

def query_vector_database(query, top_k=10):
    """Query the vector database for similar items."""
    global _model, _index, _all_items, _country_map
    
    success, message = initialize_system()
    if not success:
        return {"error": message}
    
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
    
    success, message = initialize_system()
    if not success:
        return {"error": message}
    
    for name, items in _country_data.items():
        if name.lower() == country.lower():
            return {"country": name, "items": items, "count": len(items)}
    
    partial_matches = [name for name in _country_data.keys() if country.lower() in name.lower()]
    if partial_matches:
        return {"error": f"Country '{country}' not found. Did you mean: {', '.join(partial_matches)}?"}
    
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
        response.append({
            "country": country,
            "items": [item["item"] for item in items],
            "scores": [item["score"] for item in items],
            "count": len(items)
        })
    
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

def chatbot_response(query):
    """Generate a human-like response using Gemini API and RAG."""
    entities = extract_entities(query)
    countries = entities["countries"]
    items = entities["items"]
    
    success, message = initialize_system()
    if not success:
        return "Hmm, it looks like I can't access the database right now. Could you try again later?"
    
    model = genai.GenerativeModel('gemini-1.5-flash')  # Use a suitable Gemini model
    
    # Case 1: Specific country and item
    if countries and items:
        country = countries[0]
        item = " ".join(items)
        result = get_prohibited_items_for_country(country)
        
        if "error" in result:
            prompt = f"The user asked: '{query}'. I couldn't find {country} in the database. Suggest a response indicating this and offer help."
            response = model.generate_content(prompt)
            return response.text
        
        matched_items = [i for i in result["items"] if any(word.lower() in i.lower() for word in items)]
        context = f"In {country}, prohibited items include: {', '.join(result['items'][:5])}. The user asked about '{item}'."
        if matched_items:
            prompt = f"Using this context: '{context}', respond in a friendly, human-like way confirming that '{item}' is prohibited in {country}."
        else:
            search_results = search_prohibited_items(item, top_k=5)
            if search_results and not isinstance(search_results, dict):
                countries_with_item = [r["country"] for r in search_results if any(score > 0.6 for score in r["scores"])]
                context += f" Other countries prohibiting similar items: {', '.join(countries_with_item[:3])}."
                prompt = f"Using this context: '{context}', respond in a friendly way saying '{item}' isn't prohibited in {country} but is in {', '.join(countries_with_item[:3])}."
            else:
                prompt = f"Using this context: '{context}', respond in a friendly way saying '{item}' isn't explicitly prohibited in {country}."
        
        response = model.generate_content(prompt)
        return response.text
    
    # Case 2: Item only
    elif items and not countries:
        item = " ".join(items)
        results = search_prohibited_items(item, top_k=10)
        
        if isinstance(results, dict) and "error" in results:
            return "Oops, something went wrong with my search. Try again?"
        
        if results:
            countries_with_item = [r["country"] for r in results if any(score > 0.6 for score in r["scores"])]
            context = f"Countries prohibiting '{item}' or similar: {', '.join(countries_with_item[:5])}. Total found: {len(countries_with_item)}."
            prompt = f"Using this context: '{context}', respond in a friendly, human-like way listing some countries where '{item}' is prohibited."
            response = model.generate_content(prompt)
            return response.text
        else:
            prompt = f"The user asked: '{query}'. No exact matches for '{item}' were found. Respond in a friendly way suggesting it might not be widely prohibited."
            response = model.generate_content(prompt)
            return response.text
    
    # Case 3: Country only
    elif countries and not items:
        country = countries[0]
        result = get_prohibited_items_for_country(country)
        
        if "error" in result:
            prompt = f"The user asked: '{query}'. I couldn't find {country} in the database. Respond in a friendly way with this info: {result['error'].split('.')[1]}."
            response = model.generate_content(prompt)
            return response.text
        
        context = f"In {country}, prohibited items include: {', '.join(result['items'][:5])}. Total count: {result['count']}."
        prompt = f"Using this context: '{context}', respond in a friendly, human-like way listing some prohibited items in {country} and asking what specific item the user is curious about."
        response = model.generate_content(prompt)
        return response.text
    
    # Case 4: No entities detected
    else:
        prompt = f"The user asked: '{query}'. I couldn't detect a specific item or country. Respond in a friendly way asking for clarification, like 'Is alcohol prohibited in Japan?' or 'What countries ban weapons?'."
        response = model.generate_content(prompt)
        return response.text

# Route for the home page
@app.route('/')
def home():
    return render_template('index.html')

# API route for checking system status
@app.route('/api/status', methods=['GET'])
def check_status():
    db_exists = all(os.path.exists(os.path.join(DB_DIR, fname)) for fname in ["items_index.faiss", "items.pkl", "country_map.pkl", "country_data.json"])
    
    if db_exists:
        success, message = initialize_system()
        return jsonify({"status": "ready" if success else "error", "message": message})
    else:
        return jsonify({"status": "not_initialized", "message": "Vector database not found. You'll need to process the PDF first."})

# API route for processing the PDF
@app.route('/api/process_pdf', methods=['POST'])
def api_process_pdf():
    data = request.get_json()
    pdf_file = os.path.join(DATA_DIR, data.get('pdf_file', 'fedex-international-connect-country-region-specific-prohibited-and-restricted-items.pdf'))
    output_file = os.path.join(DATA_DIR, data.get('output_file', 'fedex_country_restrictions.json'))
    
    if not Path(pdf_file).exists():
        return jsonify({"status": "error", "message": f"PDF file '{pdf_file}' not found."})
    
    try:
        _, message1 = process_fedex_pdf(pdf_file, output_file)
        fixed_data, message2 = fix_malformed_countries(output_file)
        message3 = create_vector_database(fixed_data)
        success, message4 = initialize_system(force_reload=True)
        
        return jsonify({
            "status": "success" if success else "error",
            "messages": [message1, message2, message3, message4]
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# API route for searching prohibited items by country
@app.route('/api/search_by_country', methods=['POST'])
def api_search_by_country():
    data = request.get_json()
    country = data.get('country', '')
    
    if not country:
        return jsonify({"status": "error", "message": "Country name is required"})
    
    start_time = time.time()
    result = get_prohibited_items_for_country(country)
    query_time = time.time() - start_time
    
    if "error" in result:
        return jsonify({"status": "error", "message": result["error"]})
    else:
        return jsonify({
            "status": "success",
            "country": result["country"],
            "items": result["items"],
            "count": result["count"],
            "query_time": query_time
        })

# API route for searching countries by prohibited item
@app.route('/api/search_by_item', methods=['POST'])
def api_search_by_item():
    data = request.get_json()
    query = data.get('query', '')
    top_k = data.get('top_k', 20)
    
    if not query:
        return jsonify({"status": "error", "message": "Query is required"})
    
    start_time = time.time()
    results = search_prohibited_items(query, top_k)
    query_time = time.time() - start_time
    
    if isinstance(results, dict) and "error" in results:
        return jsonify({"status": "error", "message": results["error"]})
    else:
        return jsonify({
            "status": "success",
            "results": results,
            "count": len(results),
            "query_time": query_time
        })

# API route for chat
@app.route('/api/chat', methods=['POST'])
def api_chat():
    data = request.get_json()
    user_input = data.get('message', '')
    
    if not user_input:
        return jsonify({"status": "error", "message": "Message is required"})
    
    # Initialize chat history if not exists
    if 'chat_history' not in session:
        session['chat_history'] = []
    
    # Add user message to history
    session['chat_history'].append({"role": "user", "content": user_input})
    
    # Get assistant response
    try:
        response = chatbot_response(user_input)
        session['chat_history'].append({"role": "assistant", "content": response})
        return jsonify({
            "status": "success",
            "response": response,
            "history": session['chat_history']
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# Route to get chat history
@app.route('/api/chat_history', methods=['GET'])
def get_chat_history():
    return jsonify({
        "status": "success",
        "history": session.get('chat_history', [])
    })

# Route to clear chat history
@app.route('/api/clear_chat', methods=['POST'])
def clear_chat():
    session['chat_history'] = []
    return jsonify({"status": "success", "message": "Chat history cleared"})

if __name__ == "__main__":
    # Create templates directory if it doesn't exist
    templates_dir = os.path.join(os.path.dirname(__file__), "templates")
    os.makedirs(templates_dir, exist_ok=True)
    
    # Create static directory for CSS, JS files
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    css_dir = os.path.join(static_dir, "css")
    js_dir = os.path.join(static_dir, "js")
    os.makedirs(css_dir, exist_ok=True)
    os.makedirs(js_dir, exist_ok=True)
    
    app.run(host='0.0.0.0', port=5000, debug=True)