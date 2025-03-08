from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
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
import spacy
import google.generativeai as genai
import logging
from twilio.rest import Client
from jinja2 import Template
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from io import BytesIO
import uuid


account_sid = 'AC338d14a32c3fd7d04aa789471a6617e5'
auth_token = 'c2a0f002936b4a8a62b219f8865ae247'
TWILIO_WHATSAPP_NUMBER = "whatsapp:+14155238886"  # Twilio's default sandbox number
YOUR_PHONE_NUMBER = "+919930679651"  # Example: +919876543210
client = Client(account_sid, auth_token)
# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


app = Flask(__name__, static_folder='../frontend/build')
CORS(app)  # Enable CORS for all routes

# Global variables to keep resources loaded
_model = None
_index = None
_all_items = None
_country_map = None
_country_data = None
_nlp = None



# Paths configuration
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
VECTOR_DB_DIR = os.path.join(DATA_DIR, 'vector_db')
PDF_PATH = os.path.join(DATA_DIR, 'fedex-international-connect-country-region-specific-prohibited-and-restricted-items.pdf')
JSON_OUTPUT_PATH = os.path.join(DATA_DIR, 'fedex_country_restrictions.json')

# Gemini API Configuration
GEMINI_API_KEY = "AIzaSyDqMg4cv_n04wbxo16Bpovc01LXAa96h_I"
genai.configure(api_key=GEMINI_API_KEY)

def get_embedding_model():
    """Load the embedding model only once and reuse it."""
    global _model
    if (_model is None):
        logger.info("Loading embedding model...")
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model

def get_nlp_model():
    """Load the spaCy NLP model for natural language processing."""
    global _nlp
    if (_nlp is None):
        logger.info("Loading NLP model...")
        try:
            _nlp = spacy.load("en_core_web_sm")
        except:
            logger.warning("Installing spaCy model...")
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
        if (country_match):
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
    logger.info(f"Processing PDF from {pdf_path}")
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
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(cleaned_data, f, indent=2, ensure_ascii=False)
    
    logger.info(f"Processed {len(cleaned_data)} countries. Data saved to {output_path}")
    return cleaned_data

def fix_malformed_countries(json_file):
    """Fix any malformed country names in the JSON file."""
    logger.info(f"Fixing malformed country names in {json_file}")
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
    
    logger.info(f"Fixed malformed country names. Now contains {len(fixed_data)} countries.")
    return fixed_data

def create_vector_database(data, output_dir=VECTOR_DB_DIR):
    """Create a vector database from the country items data."""
    logger.info(f"Creating vector database in {output_dir}")
    os.makedirs(output_dir, exist_ok=True)
    model = get_embedding_model()
    all_items = []
    country_map = []
    
    for country, items in data.items():
        for item in items:
            all_items.append(item)
            country_map.append(country)
    
    logger.info(f"Creating embeddings for {len(all_items)} items...")
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
    
    logger.info(f"Vector database created in {output_dir}")
    return True

def initialize_system(force_reload=False):
    """Initialize the system by loading all required components once."""
    global _model, _index, _all_items, _country_map, _country_data, _nlp
    
    if _model is None or force_reload:
        logger.info("Loading embedding model...")
        _model = get_embedding_model()
    
    if _nlp is None or force_reload:
        logger.info("Loading NLP model...")
        _nlp = get_nlp_model()
    
    index_path = os.path.join(VECTOR_DB_DIR, "items_index.faiss")
    items_path = os.path.join(VECTOR_DB_DIR, "items.pkl")
    country_map_path = os.path.join(VECTOR_DB_DIR, "country_map.pkl")
    country_data_path = os.path.join(VECTOR_DB_DIR, "country_data.json")
    
    if not all(os.path.exists(path) for path in [index_path, items_path, country_map_path, country_data_path]):
        logger.error(f"Vector database files not found in {VECTOR_DB_DIR}")
        return False
    
    if _index is None or _all_items is None or _country_map is None or _country_data is None or force_reload:
        try:
            logger.info("Loading vector database components...")
            _index = faiss.read_index(index_path)
            with open(items_path, "rb") as f:
                _all_items = pickle.load(f)
            with open(country_map_path, "rb") as f:
                _country_map = pickle.load(f)
            with open(country_data_path, "r", encoding="utf-8") as f:
                _country_data = json.load(f)
            logger.info(f"System initialized with {len(_all_items)} items from {len(_country_data)} countries")
            return True
        except Exception as e:
            logger.error(f"Error initializing system: {e}")
            return False
    return True

def query_vector_database(query, top_k=10):
    """Query the vector database for similar items."""
    global _model, _index, _all_items, _country_map
    
    if not initialize_system():
        return {"error": "Failed to initialize the system"}
    
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
    
    # Try exact match first
    for name, items in _country_data.items():
        if name.lower() == country.lower():
            return {"country": name, "items": items, "count": len(items)}
    
    # Try partial matching for better country recognition
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
        # Sort items by score in descending order
        items.sort(key=lambda x: x["score"], reverse=True)
        response.append({
            "country": country,
            "items": [item["item"] for item in items],
            "scores": [item["score"] for item in items],
            "count": len(items)
        })
    
    # Sort countries by highest scoring item
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

def chatbot_response(query, chat_history):
    """Generate a human-like response using Gemini API and RAG with memory of previous chat."""
    entities = extract_entities(query)
    countries = entities["countries"]
    items = entities["items"]
    
    if not initialize_system():
        return "Hmm, it looks like I can't access the database right now. Could you try again later?"
    
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    # First get country data if available
    country_data = None
    if countries:
        country = countries[0]
        result = get_prohibited_items_for_country(country)
        if "error" not in result:
            country_data = result

    # Create chat history context for the model
    history_context = ""
    if chat_history and len(chat_history) > 0:
        history_context = "Previous conversation:\n"
        for msg in chat_history[-3:]:  # Use the last 3 messages as context
            role = "User" if msg["role"] == "user" else "Assistant"
            history_context += f"{role}: {msg['content']}\n"
        history_context += "\n"

    # Case 1: Specific country and item
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

    # Case 2: Item only
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

    # Case 3: Country only
    elif country_data:
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

    # Case 4: No entities detected - Check memory for context
    else:
        # Check if we can use chat history to get context
        if chat_history and len(chat_history) > 0:
            # Extract countries and items from recent chat history
            recent_countries = []
            recent_items = []
            
            # Look at the last 3 messages to extract context
            for msg in chat_history[-3:]:
                if msg["role"] == "user":
                    entities = extract_entities(msg["content"])
                    if entities["countries"] and not recent_countries:
                        recent_countries = entities["countries"]
                    if entities["items"] and not recent_items:
                        recent_items = entities["items"]
            
            # If we found context from history, use it
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
            
            # General response with memory
            context = (
                f"{history_context}"
                f"User's new query: {query}\n\n"
                "Based on the conversation history, provide a helpful response about prohibited shipping items. "
                "If you can't determine what the user is asking about, prompt them for more specific information."
            )
            response = model.generate_content(context)
            return response.text.replace("FedEx", "").replace("fedex", "")
        
        # No history context available
        return ("• I need more specific information to help you\n"
                "• Try asking about:\n"
                "  • A specific country (e.g., 'What items are prohibited in Japan?')\n"
                "  • A specific item (e.g., 'Which countries prohibit electronics?')\n"
                "  • Or both (e.g., 'Can I ship alcohol to France?')")

# API Routes
@app.route('/api/check-database', methods=['GET'])
def check_database():
    """Check if the vector database exists and is ready to use."""
    db_exists = all(os.path.exists(os.path.join(VECTOR_DB_DIR, fname)) 
                   for fname in ["items_index.faiss", "items.pkl", "country_map.pkl", "country_data.json"])
    return jsonify({
        "exists": db_exists, 
        "path": VECTOR_DB_DIR
    })

@app.route('/api/process-pdf', methods=['POST'])
def api_process_pdf():
    """API endpoint to process the PDF and create the vector database."""
    try:
        # Make sure the data directory exists
        os.makedirs(DATA_DIR, exist_ok=True)
        
        # Check if the PDF file exists
        if not os.path.exists(PDF_PATH):
            return jsonify({"error": f"PDF file not found at {PDF_PATH}"}), 404
        
        # Process the PDF
        data = process_fedex_pdf(PDF_PATH, JSON_OUTPUT_PATH)
        
        # Fix any malformed country names
        data = fix_malformed_countries(JSON_OUTPUT_PATH)
        
        # Create the vector database
        create_vector_database(data, VECTOR_DB_DIR)
        
        # Initialize the system
        success = initialize_system(force_reload=True)
        
        if success:
            return jsonify({
                "success": True,
                "message": f"Processed {len(data)} countries and created vector database",
                "country_count": len(data)
            })
        else:
            return jsonify({
                "success": False,
                "error": "Failed to initialize the system after processing"
            }), 500
    except Exception as e:
        logger.error(f"Error processing PDF: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/countries', methods=['GET'])
def get_countries():
    """Get a list of all available countries."""
    if not initialize_system():
        return jsonify({"error": "Failed to initialize the system"}), 500
    
    return jsonify({
        "countries": sorted(list(_country_data.keys()))
    })

@app.route('/api/country/<country>', methods=['GET'])
def get_country_items(country):
    """Get prohibited items for a specific country."""
    if not initialize_system():
        return jsonify({"error": "Failed to initialize the system"}), 500
    
    result = get_prohibited_items_for_country(country)
    return jsonify(result)

@app.route('/api/search-item', methods=['GET'])
def search_item():
    """Search for countries that prohibit a specific item."""
    if not initialize_system():
        return jsonify({"error": "Failed to initialize the system"}), 500
    
    query = request.args.get('query', '')
    top_k = int(request.args.get('top_k', 20))
    
    if not query:
        return jsonify({"error": "No query provided"}), 400
    
    results = search_prohibited_items(query, top_k)
    return jsonify({"results": results})

@app.route('/api/chat', methods=['POST'])
def chat():
    """Chat with the AI assistant about prohibited items."""
    if not initialize_system():
        return jsonify({"error": "Failed to initialize the system"}), 500
    
    data = request.json
    query = data.get('query', '')
    chat_history = data.get('chat_history', [])
    
    if not query:
        return jsonify({"error": "No query provided"}), 400
    
    response = chatbot_response(query, chat_history)
    return jsonify({
        "response": response,
        "entities": extract_entities(query)
    })

@app.route('/generate-pdf', methods=['POST'])
def generate_pdf():
    try:
        data = request.json
        title = data.get('title', 'Shipping Restrictions Report')
        results = data.get('results', [])
        country_info = data.get('country_info', {})
        
        # Create PDF buffer
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )

        # Prepare the story (content)
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor('#1a365d')
        )
        
        header_style = ParagraphStyle(
            'CustomHeader',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=12,
            textColor=colors.HexColor('#2563eb')
        )
        
        subheader_style = ParagraphStyle(
            'CustomSubHeader',
            parent=styles['Heading3'],
            fontSize=14,
            spaceAfter=8,
            textColor=colors.HexColor('#3b82f6')
        )
        
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=10,
            spaceBefore=4,
            spaceAfter=4,
            textColor=colors.HexColor('#333333')
        )
        
        item_style = ParagraphStyle(
            'ItemStyle',
            parent=styles['Normal'],
            fontSize=10,
            leftIndent=20,
            bulletIndent=10,
            spaceBefore=2,
            spaceAfter=2,
            textColor=colors.HexColor('#333333')
        )

        # Add report title
        story.append(Paragraph(title, title_style))
        story.append(Spacer(1, 20))
        
        # Add generation date
        current_date = time.strftime("%B %d, %Y %H:%M:%S")
        story.append(Paragraph(f"Generated on: {current_date}", normal_style))
        story.append(Spacer(1, 20))
        
        # Add country-specific information if available
        if country_info:
            country_name = country_info.get('country', 'Country Information')
            story.append(Paragraph(f"Country: {country_name}", header_style))
            story.append(Spacer(1, 8))
            
            items = country_info.get('items', [])
            if items:
                story.append(Paragraph(f"Total Prohibited Items: {len(items)}", normal_style))
                story.append(Spacer(1, 12))
                
                story.append(Paragraph("Complete List of Import Prohibitions:", subheader_style))
                for item in items:
                    story.append(Paragraph(f"• {item}", item_style))
                story.append(Spacer(1, 20))

        # Add search results if available
        if results:
            story.append(Paragraph("Search Results", header_style))
            story.append(Spacer(1, 8))
            
            # Add results table
            table_data = [['Item', 'Country', 'Status', 'Match Score']]
            for result in results:
                score = f"{result.get('score', 0) * 100:.1f}%" if result.get('score') is not None else 'N/A'
                table_data.append([
                    result.get('item', ''),
                    result.get('country', ''),
                    result.get('status', 'Prohibited'),
                    score
                ])

            table_style = TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#333333')),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('PADDING', (0, 0), (-1, -1), 6),
            ])

            # Calculate column widths based on content
            col_widths = [200, 100, 100, 100]  # Adjust these values as needed
            table = Table(table_data, colWidths=col_widths)
            table.setStyle(table_style)
            story.append(table)
            story.append(Spacer(1, 20))
            
        # Group results by country
        grouped_results = {}
        for result in results:
            country = result.get('country', 'Unknown')
            if country not in grouped_results:
                grouped_results[country] = []
            grouped_results[country].append(result)
            
        # Add detailed country sections
        if grouped_results:
            story.append(Paragraph("Detailed Country Restrictions", header_style))
            story.append(Spacer(1, 12))
            
            for country, items in grouped_results.items():
                story.append(Paragraph(f"{country}", subheader_style))
                story.append(Spacer(1, 4))
                
                for item in items:
                    item_text = item.get('item', '')
                    score = item.get('score', 0)
                    score_text = f" (Match Score: {score * 100:.1f}%)" if score > 0 else ""
                    story.append(Paragraph(f"• {item_text}{score_text}", item_style))
                
                story.append(Spacer(1, 12))

        # Add disclaimer and additional information
        story.append(Paragraph("Important Information", header_style))
        story.append(Spacer(1, 8))
        
        disclaimer_text = """
        These items are strictly prohibited for import into the specified destinations. 
        Attempting to ship these items may result in delays, fines, or confiscation.
        Always verify current regulations with customs authorities before shipping.
        """
        story.append(Paragraph(disclaimer_text, normal_style))
        story.append(Spacer(1, 12))
        
        notes_text = """
        Note: This report is generated based on information available in our database. 
        Import regulations may change without notice. The information in this document 
        is provided for reference purposes only and should not be considered legal advice.
        """
        story.append(Paragraph(notes_text, normal_style))

        # Build PDF
        doc.build(story)
        
        # Get PDF content
        pdf_content = buffer.getvalue()
        buffer.close()

        # Create response
        response = make_response(pdf_content)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename={title.replace(" ", "-").lower()}.pdf'
        
        return response

    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}")
        return jsonify({"error": str(e)}), 500

import os
from flask import Flask, request, jsonify
from supabase import create_client
from twilio.rest import Client
import uuid

supabase_url = "https://egdbvwtvwqhqorfknmfj.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZGJ2d3R2d3FocW9yZmtubWZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyMjA1MTQsImV4cCI6MjA1MDc5NjUxNH0.osnvEZThw50kZTZfuM1qjIMkaFeOo6bJ2A5NnM86hC0"
supabase = create_client(supabase_url, supabase_key)
BUCKET_NAME="uploads"
# Define this route OUTSIDE of any other function, at the top level of your app
@app.route('/files/<filename>')
def serve_file(filename):
    return send_from_directory('uploads', filename)


@app.route("/send_message", methods=["POST"])
def send_message():
    try:
        data = request.form
        from_number = 'whatsapp:+14155238886'
        to = data.get('to')
        to_number = f"whatsapp:{to}"
        message_body = data.get('message')
        
        # Handle file upload to Supabase
        if 'file' in request.files:
            file = request.files['file']
            if file:
                # Generate a unique filename
                file_extension = os.path.splitext(file.filename)[1]
                unique_filename = f"{uuid.uuid4()}{file_extension}"
                
                # Save file temporarily
                temp_path = f"temp_{unique_filename}"
                file.save(temp_path)
                
                try:
                    logger.info(f"Using bucket: {BUCKET_NAME}")
                    
                    # Upload to Supabase storage
                    with open(temp_path, 'rb') as f:
                        file_content = f.read()
                    
                    logger.info(f"Uploading file {unique_filename} ({len(file_content)} bytes)")
                    
                    # Try the upload
                    res = supabase.storage.from_(BUCKET_NAME).upload(
                        path=unique_filename,
                        file=file_content,
                        file_options={"content-type": file.content_type or "application/octet-stream"}
                    )
                    
                    logger.info(f"Upload response: {res}")
                    
                    # Get public URL for the file
                    file_url = supabase.storage.from_(BUCKET_NAME).get_public_url(unique_filename)
                    logger.info(f"Generated public URL: {file_url}")
                    
                    # Clean up temporary file
                    os.remove(temp_path)
                    
                    # Send message with media
                    message = client.messages.create(
                        from_=from_number,
                        body=message_body,
                        to=to_number,
                        media_url=file_url
                    )
                    
                    logger.info(f"Message sent with SID: {message.sid}")
                    
                except Exception as upload_error:
                    logger.error(f"Supabase upload error: {str(upload_error)}")
                    
                    # Send message without media as a fallback
                    message = client.messages.create(
                        from_=from_number,
                        body=f"{message_body} (Note: File attachment failed to upload)",
                        to=to_number
                    )
            else:
                # Send message without media
                message = client.messages.create(
                    from_=from_number,
                    body=message_body,
                    to=to_number
                )
        else:
            # Send message without media
            message = client.messages.create(
                from_=from_number,
                body=message_body,
                to=to_number
            )
        data = request.form
        from_number = 'whatsapp:+14155238886'
        to = data.get('to')
        to_number = f"whatsapp:{to}"
        message_body = data.get('message')
        
        # Handle file upload to Supabase
        if 'file' in request.files:
            file = request.files['file']
            if file:
                # Generate a unique filename
                file_extension = os.path.splitext(file.filename)[1]
                unique_filename = f"{uuid.uuid4()}{file_extension}"
                
                # Save file temporarily
                temp_path = f"temp_{unique_filename}"
                file.save(temp_path)
                
                try:
                    logger.info(f"Using bucket: {BUCKET_NAME}")
                    
                    # Upload to Supabase storage
                    with open(temp_path, 'rb') as f:
                        file_content = f.read()
                    
                    logger.info(f"Uploading file {unique_filename} ({len(file_content)} bytes)")
                    
                    # Try the upload
                    res = supabase.storage.from_(BUCKET_NAME).upload(
                        path=unique_filename,
                        file=file_content,
                        file_options={"content-type": file.content_type or "application/octet-stream"}
                    )
                    
                    logger.info(f"Upload response: {res}")
                    
                    # Get public URL for the file
                    file_url = supabase.storage.from_(BUCKET_NAME).get_public_url(unique_filename)
                    logger.info(f"Generated public URL: {file_url}")
                    
                    # Clean up temporary file
                    os.remove(temp_path)
                    
                    # Send message with media
                    message = client.messages.create(
                        from_=from_number,
                        body=message_body,
                        to=to_number,
                        media_url=file_url
                    )
                    
                    logger.info(f"Message sent with SID: {message.sid}")
                    
                except Exception as upload_error:
                    logger.error(f"Supabase upload error: {str(upload_error)}")
                    
                    # Send message without media as a fallback
                    message = client.messages.create(
                        from_=from_number,
                        body=f"{message_body} (Note: File attachment failed to upload)",
                        to=to_number
                    )
            else:
                # Send message without media
                message = client.messages.create(
                    from_=from_number,
                    body=message_body,
                    to=to_number
                )
        else:
            # Send message without media
            message = client.messages.create(
                from_=from_number,
                body=message_body,
                to=to_number
            )

        return jsonify({"message_sid": message.sid})
        return jsonify({"message_sid": message.sid})

    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
        logger.error(f"Error sending message: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """Serve the React frontend."""
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')
    



from flask import Flask, request, jsonify
import google.generativeai as genai
from dotenv import load_dotenv
GOOGLE_API_KEY = "AIzaSyAWalRIQgdh5JU31vN88y9F8KdrovC6QOo"
genai.configure(api_key=GOOGLE_API_KEY)
@app.route('/generate', methods=['POST'])
def generate_text():
    try:
        # Get data from request
        data = request.json
        prompt = data.get('prompt')
        
        if not prompt:
            return jsonify({"error": "No prompt provided"}), 400
        
        # Configure the model
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        # Generate content
        response = model.generate_content(prompt)
        
        # Return the response
        return jsonify({
            "response": response.text,
            "model": "gemini-1.5-pro"
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    # Check if the vector database exists, if not try to create it
    db_exists = all(os.path.exists(os.path.join(VECTOR_DB_DIR, fname)) 
                   for fname in ["items_index.faiss", "items.pkl", "country_map.pkl", "country_data.json"])
    
    if not db_exists and os.path.exists(PDF_PATH):
        try:
            logger.info("Vector database not found. Attempting to create it...")
            data = process_fedex_pdf(PDF_PATH, JSON_OUTPUT_PATH)
            data = fix_malformed_countries(JSON_OUTPUT_PATH)
            create_vector_database(data, VECTOR_DB_DIR)
        except Exception as e:
            logger.error(f"Failed to create vector database automatically: {str(e)}")
    
    # Initialize the system
    initialize_system()
    if not os.path.exists('uploads'):
        os.makedirs('uploads')
    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)
