import os
import json
import re
import threading
import random
import requests
from flask import Flask, request, jsonify
from concurrent.futures import ThreadPoolExecutor
from flask_cors import CORS
from dotenv import load_dotenv  # Add this import
from concurrent.futures import ThreadPoolExecutor, as_completed

app = Flask(__name__)
CORS(app)

# Load environment variables from .env file
load_dotenv()

# Directory containing regulation files
REGULATIONS_DIR = "ups_regulations"

# List of Gemini API keys (loaded from .env file)
GEMINI_KEYS = os.getenv("GEMINI_KEYS").split(",")


def get_regulation_file(source, destination):
    """Get the appropriate regulation file based on source and destination countries."""
    try:
        # Create pattern for matching source_to_destination.json format
        pattern = re.compile(f"{source.lower()}_to_{destination.lower()}\.json$")
        
        # Try multiple directory paths
        possible_dirs = [
            REGULATIONS_DIR,
            os.path.join(os.path.dirname(__file__), REGULATIONS_DIR),
            os.path.abspath(REGULATIONS_DIR)
        ]
        
        for dir_path in possible_dirs:
            if os.path.exists(dir_path):
                # Search for matching files in directory
                for filename in os.listdir(dir_path):
                    if pattern.match(filename):
                        file_path = os.path.join(dir_path, filename)
                        print(f"Found file at: {file_path}")
                        return file_path
                        
        print(f"No matching regulation file found for {source} to {destination}")
        return None
        
    except Exception as e:
        print(f"Error in get_regulation_file: {str(e)}")
        return None

def load_regulation_data(file_path):
    """Load regulation data from JSON file."""
    try:
        if not file_path:
            print("Error: No file path provided")
            return None
            
        if not os.path.exists(file_path):
            print(f"Error: File does not exist at {file_path}")
            return None
            
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"Successfully loaded data from {file_path}")
            return data
            
    except json.JSONDecodeError as e:
        print(f"JSON parsing error in {file_path}: {str(e)}")
        return None
    except Exception as e:
        print(f"Error loading regulation file {file_path}: {str(e)}")
        return None

def get_section_content(regulation_data, section_name):
    """Extract section content including simplified form for a specific section."""
    for item in regulation_data:
        if isinstance(item, dict) and item.get("Section") == section_name:
            return {
                "content": item.get("Content", ""),
                "simplified_form": item.get("Simplified Form", [])
            }
    return None

def check_compliance_with_gemini(section_data, user_data, api_key):
    """Check compliance with Gemini API, including tax/tariff for your specific routes."""
    gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key
    }
    print("user data", user_data)
    # Calculate financial information first
    shipment_value = float(user_data.get('shipment_value_usd', 0.0))
    source_country = user_data.get('source')
    destination_country = user_data.get('destination')
    
    cost_info = get_exchange_rate_and_taxes(source_country, destination_country, shipment_value)
    financial_details = json.dumps(cost_info, indent=2) if cost_info else "Not available"

    prompt = f"""
    You are a UPS Senior International Compliance Officer with 15+ years of experience in global shipping regulations. 
    Analyze the shipment details against regulatory requirements and financial implications.
    
    REGULATORY FRAMEWORK:
    {section_data['content']}
    
    COMPLIANCE CHECKLIST:
    {json.dumps(section_data['simplified_form'], indent=2)}
    
    SHIPMENT DETAILS:
    {json.dumps(user_data, indent=2)}
    
    FINANCIAL DETAILS:
    {financial_details}
    
    TASK: Conduct a thorough compliance analysis. You MUST include the financial analysis in your response.
    The financial analysis should reflect the provided financial details and their compliance implications.
    
    Format your response as a JSON object:
    {{
        "compliant": boolean,
        "compliance_score": number,
        "risk_level": string,
        "reasons": [],
        "violations": [],
        "suggestions": [],
        "additional_requirements": [],
        "financial_analysis": {{
            "exchange_rate": {cost_info.get('exchange_rate') if cost_info else 0},
            "source_currency": "{cost_info.get('source_currency') if cost_info else ''}",
            "dest_currency": "{cost_info.get('dest_currency') if cost_info else ''}",
            "converted_amount": {cost_info.get('converted_amount') if cost_info else 0},
            "tariff_rate": {cost_info.get('tariff_rate') if cost_info else 0},
            "tariff_amount": {cost_info.get('tariff_amount') if cost_info else 0},
            "total_with_tariff": {cost_info.get('total_with_tariff') if cost_info else 0},
            "tax_compliance_notes": "Include any tax compliance observations here"
        }},
        "officer_notes": string
    }}
    
    IMPORTANT: Always include the financial_analysis object with the provided values. Do not return null for financial_analysis.
    """
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 2000
        }
    }
    
    try:
        response = requests.post(gemini_url, headers=headers, json=payload)
        response_data = response.json()
        
        if "candidates" in response_data and len(response_data["candidates"]) > 0:
            text_response = response_data["candidates"][0]["content"]["parts"][0]["text"]
            json_match = re.search(r'({.*})', text_response, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group(1))
                # Ensure financial analysis is always present
                if 'financial_analysis' not in result or result['financial_analysis'] is None:
                    result['financial_analysis'] = cost_info or {
                        "exchange_rate": 0,
                        "source_currency": "",
                        "dest_currency": "",
                        "converted_amount": 0,
                        "tariff_rate": 0,
                        "tariff_amount": 0,
                        "total_with_tariff": 0,
                        "tax_compliance_notes": "Financial analysis not available"
                    }
                return result
                
        default_result = {
            "compliant": None,
            "compliance_score": 0,
            "risk_level": "Unknown",
            "reasons": ["Failed to get valid response"],
            "violations": ["Analysis error"],
            "suggestions": ["Please review manually"],
            "additional_requirements": [],
            "financial_analysis": cost_info if cost_info else None,
            "officer_notes": "System couldn't complete evaluation"
        }
        return default_result
        
    except Exception as e:
        print(f"Error calling Gemini API: {str(e)}")
        return {
            "compliant": None,
            "compliance_score": 0,
            "risk_level": "Unknown",
            "reasons": [f"API error: {str(e)}"],
            "violations": ["Service unavailable"],
            "suggestions": ["Please try again"],
            "additional_requirements": [],
            "financial_analysis": cost_info if cost_info else None,
            "officer_notes": "Technical difficulties encountered"
        }
# Function to get all section names from a regulation file
def get_all_sections(file_path):
    """Get all section names from a regulation file."""
    data = load_regulation_data(file_path)
    if not data:
        return []
    
    sections = []
    for item in data:
        if isinstance(item, dict) and "Section" in item:
            sections.append(item["Section"])
    
    return sections

# Route to get all available sections for a source-destination pair
@app.route('/api/sections', methods=['GET'])
def get_sections():
    source = request.args.get('source')
    destination = request.args.get('destination')
    
    if not source or not destination:
        return jsonify({"error": "Source and destination are required"}), 400
    
    file_path = get_regulation_file(source, destination)
    if not file_path:
        return jsonify({"error": f"No regulations found for {source} to {destination}"}), 404
    
    sections = get_all_sections(file_path)
    return jsonify({"sections": sections})

# Route to check compliance for a specific section
@app.route('/api/check/<section_name>', methods=['POST'])
def check_section_compliance(section_name):
    try:
        data = request.json
        source = data.get('source')
        destination = data.get('destination')
        user_data = data.get('shipment_details', {})
        
        # Add source and destination to user_data
        user_data['source'] = source
        user_data['destination'] = destination
        
        if not source or not destination:
            return jsonify({"error": "Source and destination are required"}), 400
        
        file_path = get_regulation_file(source, destination)
        if not file_path:
            return jsonify({"error": f"No regulations found for {source} to {destination}"}), 404
        
        regulation_data = load_regulation_data(file_path)
        if not regulation_data:
            return jsonify({"error": "Failed to load regulation data"}), 500
        
        section_data = get_section_content(regulation_data, section_name)
        if not section_data:
            return jsonify({"error": f"Section '{section_name}' not found"}), 404
        
        # Randomly select one of the API keys
        api_key = random.choice(GEMINI_KEYS)
        
        # Check compliance
        compliance_result = check_compliance_with_gemini(section_data, user_data, api_key)
        
        return jsonify({
            "section": section_name,
            "compliance": compliance_result
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to check compliance for all sections in parallel
@app.route('/api/check_financial_all', methods=['POST'])
def check_all_compliance():
    try:
        data = request.json
        source = data.get('source')
        destination = data.get('destination')
        user_data = data.get('shipment_details', {})
        user_data['source'] = source
        user_data['destination'] = destination
        if not source or not destination:
            return jsonify({"error": "Source and destination are required"}), 400
        
        file_path = get_regulation_file(source, destination)
        print("regulation file path", file_path)
        if not file_path:
            return jsonify({"error": f"No regulations found for {source} to {destination}"}), 404
        
        sections = get_all_sections(file_path)
        regulation_data = load_regulation_data(file_path)
        
        def check_section(section_name):
            section_data = get_section_content(regulation_data, section_name)
            if not section_data:
                return {
                    "section": section_name,
                    "error": "Section data not found"
                }
            
            # Randomly select one of the API keys
            api_key = random.choice(GEMINI_KEYS)
            
            compliance_result = check_compliance_with_gemini(section_data, user_data, api_key)
            return {
                "section": section_name,
                "compliance": compliance_result
            }
        
        # Run compliance checks in parallel using ThreadPoolExecutor
        results = []
        with ThreadPoolExecutor(max_workers=min(len(sections), 20)) as executor:
            futures = {executor.submit(check_section, section): section for section in sections}
            for future in futures:
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    section = futures[future]
                    results.append({
                        "section": section,
                        "error": str(e)
                    })
        
        return jsonify({
            "source": source,
            "destination": destination,
            "results": results
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    




@app.route('/api/check_bulk', methods=['POST'])
def check_bulk_compliance():
    try:
        # Check if the file was uploaded
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
            
        file = request.files['file']
        
        # Check if the file is a CSV
        if file.filename == '' or not file.filename.endswith('.csv'):
            return jsonify({"error": "Please upload a valid CSV file"}), 400
            
        # Process the CSV file
        import csv
        import io
        
        # Read the CSV data
        csv_data = []
        csv_stream = io.StringIO(file.stream.read().decode("utf-8"), newline='')
        csv_reader = csv.DictReader(csv_stream)
        
        # Verify required fields in CSV
        required_fields = ['source', 'destination']
        if not all(field in csv_reader.fieldnames for field in required_fields):
            return jsonify({"error": f"CSV must contain the following fields: {', '.join(required_fields)}"}), 400
            
        # Store all rows from CSV
        for row in csv_reader:
            csv_data.append(row)
            
        if not csv_data:
            return jsonify({"error": "CSV file is empty"}), 400
        
        # Determine how many API keys we have
        num_api_keys = len(GEMINI_KEYS)
        print(f"Using {num_api_keys} Gemini API keys for parallel processing")
        
        # Process all shipments in parallel, using different API keys
        results = []
        
        # Create a lock for thread-safe API key selection
        api_key_lock = threading.Lock()
        key_index = [0]  # Mutable container for the current key index
        
        def get_next_api_key():
            with api_key_lock:
                key = GEMINI_KEYS[key_index[0]]
                key_index[0] = (key_index[0] + 1) % num_api_keys
                return key
        
        def process_with_dedicated_key(row):
            # Each thread gets its own API key from the pool
            api_key = get_next_api_key()
            return process_single_shipment(row, api_key)
        
        # Use as many workers as we have rows or a reasonable limit
        max_workers = min(len(csv_data), num_api_keys * 2, 20)
        print(f"Starting parallel processing with {max_workers} workers")
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(process_with_dedicated_key, row): row for row in csv_data}
            for future in futures:
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    row = futures[future]
                    results.append({
                        "source": row.get('source', 'unknown'),
                        "destination": row.get('destination', 'unknown'),
                        "error": str(e),
                        "status": "failed"
                    })
                
        return jsonify({
            "total_shipments": len(csv_data),
            "processed": len(results),
            "results": results
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def process_single_shipment(shipment_row, api_key):
    """Process a single shipment from CSV with one Gemini call, using the provided API key."""
    source = shipment_row.get('source')
    destination = shipment_row.get('destination')
    
    if not source or not destination:
        return {
            "source": source or "missing",
            "destination": destination or "missing",
            "error": "Source and destination are required",
            "status": "failed"
        }
    
    # Get regulation file path
    file_path = get_regulation_file(source, destination)
    if not file_path:
        return {
            "source": source,
            "destination": destination,
            "error": f"No regulations found for {source} to {destination}",
            "status": "failed"
        }
    
    # Load regulation data
    regulation_data = load_regulation_data(file_path)
    if not regulation_data:
        return {
            "source": source,
            "destination": destination,
            "error": "Failed to load regulation data",
            "status": "failed"
        }
    
    # Extract all sections and their simplified forms
    all_sections_data = []
    for item in regulation_data:
        if isinstance(item, dict) and "Section" in item:
            section_data = {
                "section_name": item.get("Section", ""),
                "content": item.get("Content", ""),
                "simplified_form": item.get("Simplified Form", [])
            }
            all_sections_data.append(section_data)
    
    # Use the provided API key for this specific shipment
    compliance_result = check_all_compliance_with_gemini(all_sections_data, shipment_row, api_key)
    
    # Add financial analysis
    shipment_value = float(shipment_row.get('shipment_value_usd', 0.0))
    cost_info = get_exchange_rate_and_taxes(source, destination, shipment_value)
    compliance_result['financial_analysis'] = cost_info if cost_info else {
        "exchange_rate": 0,
        "source_currency": "",
        "dest_currency": "",
        "converted_amount": 0,
        "tariff_rate": 0,
        "tariff_amount": 0,
        "total_with_tariff": 0,
        "tax_compliance_notes": "Financial analysis not available"
    }
    
    return {
        "source": source,
        "destination": destination,
        "shipment_id": shipment_row.get('shipment_id', 'unknown'),
        "compliance_result": compliance_result,
        "status": "processed"
    }

def check_all_compliance_with_gemini(all_sections_data, shipment_details, api_key):
    """Check compliance for all sections in a single Gemini call."""
    gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key
    }
    
    # Construct comprehensive prompt for all sections
    sections_json = json.dumps(all_sections_data, indent=2)
    shipment_json = json.dumps(shipment_details, indent=2)
    
    prompt = f"""
    You are a UPS Senior International Compliance Officer with 15+ years of experience in global shipping regulations.
    Analyze this shipment against ALL regulatory requirements with extreme attention to detail.
    
    REGULATORY FRAMEWORKS AND COMPLIANCE CHECKLISTS:
    {sections_json}
    
    SHIPMENT DETAILS FOR INSPECTION:
    {shipment_json}
    
    TASK: Conduct a thorough, critical compliance analysis of the shipment across ALL sections.
    
    Format your response as a JSON object with the following structure:
    {{
        "overall_compliance": {{
            "compliant": boolean,  // true if fully compliant with ALL sections, false otherwise
            "overall_compliance_score": number,  // Overall compliance score from 0-100
            "overall_risk_level": string,  // "High", "Medium", "Low", or "None"
            "critical_violations_count": number,  // Count of critical violations
            "summary": string  // Brief summary of overall compliance status
        }},
        "section_results": [
            {{
                "section_name": string,  // Name of the regulatory section
                "compliant": boolean,  // true if compliant with this section, false otherwise
                "compliance_score": number,  // Section compliance score from 0-100
                "risk_level": string,  // "High", "Medium", "Low", or "None" for this section
                "reasons": [
                    // Specific compliance findings for this section
                ],
                "violations": [
                    // Specific rules violated in this section, if any
                ],
                "suggestions": [
                    // Recommendations to resolve violations in this section
                ]
            }},
            // Additional section results...
        ],
        "additional_requirements": [
            // Any additional permits, forms or documentation needed
        ],
        "officer_notes": string  // Professional insight from your experience
    }}
    
    Ensure your analysis is thorough, strict, and identifies ALL potential compliance issues across ALL sections.
    """
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 4000
        }
    }
    
    try:
        response = requests.post(gemini_url, headers=headers, json=payload)
        response_data = response.json()
        
        # Extract the text response and parse it as JSON
        if "candidates" in response_data and len(response_data["candidates"]) > 0:
            text_response = response_data["candidates"][0]["content"]["parts"][0]["text"]
            # Find JSON in the response
            try:
                import re
                json_match = re.search(r'({.*})', text_response, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group(1))
            except Exception as parse_error:
                print(f"JSON parsing error: {str(parse_error)}")
                # Fallback if JSON parsing fails
                return {
                    "error": "Failed to parse Gemini response",
                    "error_details": str(parse_error),
                    "overall_compliance": {
                        "compliant": None,
                        "overall_compliance_score": 0,
                        "overall_risk_level": "Unknown",
                        "critical_violations_count": 0,
                        "summary": "Technical error occurred during compliance evaluation."
                    }
                }
                
        return {
            "error": "Failed to get a valid response from Gemini",
            "overall_compliance": {
                "compliant": None,
                "overall_compliance_score": 0,
                "overall_risk_level": "Unknown",
                "critical_violations_count": 0,
                "summary": "System couldn't complete the compliance evaluation."
            }
        }
    except Exception as e:
        print(f"Error calling Gemini API: {str(e)}")
        return {
            "error": f"API error: {str(e)}",
            "overall_compliance": {
                "compliant": None,
                "overall_compliance_score": 0,
                "overall_risk_level": "Unknown",
                "critical_violations_count": 0,
                "summary": "Technical difficulties encountered during evaluation process."
            }
        }
    


from flask import Flask, request, jsonify
from PIL import Image
import io
import json
import pandas as pd
import plotly.express as px
import numpy as np

# Import necessary functions from your existing code
from myfiles.first import get_multiple_items_from_image, search_prohibited_items, create_results_dataframe

@app.route('/api/search_items', methods=['POST'])
def search_items():
    try:
        # Check if the request contains a file
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        # Read the image file
        file = request.files['file']
        image = Image.open(io.BytesIO(file.read()))
        
        # Get multiple items from the image
        detected_items = get_multiple_items_from_image(image)
        
        if not detected_items:
            return jsonify({"error": "No items detected in the image"}), 400
        
        # Search for prohibited items for each detected item
        top_k = 20  # You can make this configurable via request parameters
        all_results = {}
        for item in detected_items:
            results = search_prohibited_items(item, top_k)
            if not isinstance(results, dict):  # Ensure no error was returned
                all_results[item] = results
        
        # Create a DataFrame from the results
        df = create_results_dataframe(all_results)
        
        
        
        # Convert DataFrame to JSON
        results_json = df.to_json(orient='records')
        
        # Return the results along with visualizations
        return jsonify({
            "detected_items": detected_items,
            "results": json.loads(results_json),
            
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def get_exchange_rate_and_taxes(source_country, destination_country, amount_usd):
    """Get exchange rate and tax/tariff information for specific country pairs in your dataset."""
    try:
        # Input validation
        if not source_country or not destination_country:
            print("Source or destination country is missing")
            return None
            
        if not isinstance(source_country, str) or not isinstance(destination_country, str):
            print("Source and destination must be strings")
            return None
            
        if not amount_usd or not isinstance(amount_usd, (int, float)) or amount_usd <= 0:
            print("Invalid amount provided")
            return None

        # Country code mapping (using ISO 3166-1 alpha-2 codes where possible)
        country_codes = {
            'australia': 'AU',
            'brazil': 'BR',
            'canada': 'CA',
            'china': 'CN',
            'france': 'FR',
            'germany': 'DE',
            'india': 'IN',
            'italy': 'IT',
            'japan': 'JP',
            'malaysia': 'MY',
            'mexico': 'MX',
            'netherlands': 'NL',
            'singapore': 'SG',
            'thailand': 'TH',
            'arabia': 'SA',
            'africa': 'ZA',
            'korea': 'KR',
            'emirates': 'AE',
            'kingdom': 'UK',
            'states': 'US'
        }

        # Safe conversion to lowercase and lookup
        source_code = country_codes.get(source_country.lower().strip())
        dest_code = country_codes.get(destination_country.lower().strip())
        
        if not source_code or not dest_code:
            print(f"Invalid country codes for {source_country} or {destination_country}")
            return None

        # Currency mapping (rest remains same)
        currencies = {
            'AU': 'AUD',
            'BR': 'BRL',
            'CA': 'CAD',
            'CN': 'CNY',
            'FR': 'EUR',
            'DE': 'EUR',
            'IN': 'INR',
            'IT': 'EUR',
            'JP': 'JPY',
            'MY': 'MYR',
            'MX': 'MXN',
            'NL': 'EUR',
            'SG': 'SGD',
            'TH': 'THB',
            'SA': 'SAR',
            'ZA': 'ZAR',
            'KR': 'KRW',
            'AE': 'AED',
            'UK': 'GBP',
            'US': 'USD'
        }

        tariff_rates = {
            # To India
            'AU-IN': 0.10,  # Australia to India: 10% average
            'BR-IN': 0.15,  # Brazil to India: 15%
            'CA-IN': 0.08,  # Canada to India: 8%
            'CN-IN': 0.12,  # China to India: 12%
            'FR-IN': 0.10,  # France to India: 10%
            'DE-IN': 0.10,  # Germany to India: 10%
            'IT-IN': 0.10,  # Italy to India: 10%
            'JP-IN': 0.07,  # Japan to India: 7%
            'MY-IN': 0.06,  # Malaysia to India: 6%
            'MX-IN': 0.15,  # Mexico to India: 15%
            'NL-IN': 0.10,  # Netherlands to India: 10%
            'SA-IN': 0.12,  # Saudi Arabia to India: 12%
            'SG-IN': 0.05,  # Singapore to India: 5%
            'ZA-IN': 0.14,  # South Africa to India: 14%
            'KR-IN': 0.08,  # South Korea to India: 8%
            'TH-IN': 0.07,  # Thailand to India: 7%
            'AE-IN': 0.11,  # UAE to India: 11%
            'UK-IN': 0.10,  # UK to India: 10%
            'US-IN': 0.09,  # US to India: 9%
            # From India
            'IN-AU': 0.06,  # India to Australia: 6%
            'IN-BR': 0.20,  # India to Brazil: 20%
            'IN-CA': 0.07,  # India to Canada: 7%
            'IN-CN': 0.15,  # India to China: 15%
            'IN-FR': 0.12,  # India to France: 12%
            'IN-DE': 0.12,  # India to Germany: 12%
            'IN-IT': 0.12,  # India to Italy: 12%
            'IN-JP': 0.05,  # India to Japan: 5%
            'IN-MY': 0.04,  # India to Malaysia: 4%
            'IN-MX': 0.18,  # India to Mexico: 18%
            'IN-NL': 0.12,  # India to Netherlands: 12%
            'IN-SG': 0.03,  # India to Singapore: 3%
            'IN-TH': 0.06   # India to Thailand: 6%
        }
        # Get destination currency
        dest_currency = currencies.get(dest_code)
        if not dest_currency:
            print(f"No currency found for destination country code: {dest_code}")
            return None

        # Get exchange rates
        try:
            exchange_api_url = "https://api.exchangerate-api.com/v4/latest/USD"
            response = requests.get(exchange_api_url, timeout=10)
            response.raise_for_status()  # Raises an HTTPError for bad responses
            rates = response.json()['rates']
        except requests.exceptions.RequestException as e:
            print(f"Error fetching exchange rates: {str(e)}")
            return None

        # Calculate exchange
        exchange_rate = rates.get(dest_currency, 1.0) / rates.get('USD', 1.0)
        converted_amount = amount_usd * exchange_rate

        # Calculate tariff using existing rates
        route_key = f"{source_code}-{dest_code}"
        tariff_rate = tariff_rates.get(route_key, 0.0)
        tariff_amount = converted_amount * tariff_rate

        result = {
            'exchange_rate': round(exchange_rate, 4),
            'source_currency': 'USD',
            'dest_currency': dest_currency,
            'converted_amount': round(converted_amount, 2),
            'tariff_rate': tariff_rate,
            'tariff_amount': round(tariff_amount, 2),
            'total_with_tariff': round(converted_amount + tariff_amount, 2),
            'calculation_successful': True
        }
        
        print(f"Successfully calculated rates for {source_country} to {destination_country}")
        return result

    except Exception as e:
        print(f"Error getting exchange rate/tax info: {str(e)}")
        return {
            'exchange_rate': 1.0,
            'source_currency': 'USD',
            'dest_currency': 'USD',
            'converted_amount': amount_usd,
            'tariff_rate': 0.0,
            'tariff_amount': 0.0,
            'total_with_tariff': amount_usd,
            'calculation_successful': False,
            'error': str(e)
        }




if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=3000)