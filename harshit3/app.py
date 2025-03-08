from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import random
import threading
from concurrent.futures import ThreadPoolExecutor,as_completed
import google.generativeai as genai
from dotenv import load_dotenv  # Add this import

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)


# List of Gemini API keys (loaded from .env file)
GEMINI_KEYS = os.getenv("GEMINI_KEYS").split(",")

genai.configure(api_key=GEMINI_KEYS[0])

# File path for storing rules
RULES_FILE = 'compliance_rules.json'

# Initialize rules dictionary if the file doesn't exist
if not os.path.exists(RULES_FILE):
    with open(RULES_FILE, 'w') as f:
        json.dump({}, f)

def load_rules():
    """Load rules from the JSON file."""
    try:
        with open(RULES_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return {}

def save_rules(rules):
    """Save rules to the JSON file."""
    with open(RULES_FILE, 'w') as f:
        json.dump(rules, f, indent=2)

@app.route('/api/rules', methods=['GET'])
def get_rules():
    """Get all compliance rules."""
    rules = load_rules()
    return jsonify(rules)

@app.route('/api/rules', methods=['POST'])
def add_rule():
    """Add a new compliance rule."""
    data = request.json
    
    source = data.get('source')
    destination = data.get('destination')
    rule = data.get('rule')
    
    if not all([source, destination, rule]):
        return jsonify({"error": "Source, destination, and rule are required"}), 400
    
    rules = load_rules()
    
    # Create the key for source-destination pair
    route_key = f"{source.lower()}-{destination.lower()}"
    
    # Initialize if the route doesn't exist
    if route_key not in rules:
        rules[route_key] = []
    
    # Add the rule if it doesn't already exist
    if rule not in rules[route_key]:
        rules[route_key].append(rule)
        save_rules(rules)
        return jsonify({"message": "Rule added successfully", "route": route_key, "rules": rules[route_key]})
    else:
        return jsonify({"message": "Rule already exists", "route": route_key, "rules": rules[route_key]})

@app.route('/api/rules/<source>/<destination>', methods=['GET'])
def get_rules_for_route(source, destination):
    """Get rules for a specific route."""
    rules = load_rules()
    route_key = f"{source.lower()}-{destination.lower()}"
    
    if route_key in rules:
        return jsonify({
            "source": source,
            "destination": destination,
            "rules": rules[route_key]
        })
    else:
        return jsonify({
            "source": source,
            "destination": destination,
            "rules": []
        })

@app.route('/api/rules/<source>/<destination>', methods=['DELETE'])
def delete_rule(source, destination):
    """Delete a rule for a specific route."""
    data = request.json
    rule_to_delete = data.get('rule')
    
    if not rule_to_delete:
        return jsonify({"error": "Rule to delete is required"}), 400
    
    rules = load_rules()
    route_key = f"{source.lower()}-{destination.lower()}"
    
    if route_key in rules and rule_to_delete in rules[route_key]:
        rules[route_key].remove(rule_to_delete)
        save_rules(rules)
        return jsonify({"message": "Rule deleted successfully", "route": route_key, "rules": rules[route_key]})
    else:
        return jsonify({"error": "Rule not found"}), 404

def check_compliance_with_gemini(rules, shipment_data, api_key=None):
    """
    Check compliance using Google's Gemini AI.
    
    Args:
        rules: List of compliance rules
        shipment_data: Shipment details
        api_key: Gemini API key (optional)
    
    Returns:
        Dict containing compliance results
    """
    # Use the provided API key or the first one in the list
    if api_key:
        genai.configure(api_key=api_key)
    else:
        genai.configure(api_key=random.choice(GEMINI_KEYS))
    
    model = genai.GenerativeModel('gemini-1.5-pro')
    
    # Prepare the prompt for Gemini
    prompt = f"""
    You are a compliance expert for international shipments. Analyze the following shipment against these compliance rules:
    
    SHIPMENT DETAILS:
    {json.dumps(shipment_data, indent=2)}
    
    COMPLIANCE RULES:
    {json.dumps(rules, indent=2)}
    
    Evaluate if this shipment is compliant with these rules. Provide a structured analysis with these exact fields:
    - compliant: true/false
    - compliance_score: 0-100
    - risk_level: "Low", "Medium", or "High"
    - violations: [list specific violations if any]
    - reasons: [detailed explanations for each violation or compliance concern]
    - suggestions: [actionable steps to resolve compliance issues]
    - additional_requirements: [any extra documentation or steps needed]
    - officer_notes: [professional expert opinion written from first person perspective of a compliance officer with 15+ years experience]
    
    Return your response as a valid JSON object with these exact keys.
    """
    
    try:
        response = model.generate_content(prompt)
        # Extract the JSON from the response
        response_text = response.text
        
        # Clean up the response to handle potential formatting issues
        if "```json" in response_text:
            # Extract JSON from code block
            json_str = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            # Extract from generic code block
            json_str = response_text.split("```")[1].split("```")[0].strip()
        else:
            # Use as is
            json_str = response_text
        
        # Parse the JSON
        try:
            compliance_result = json.loads(json_str)
            # Ensure all required fields exist in the response
            required_fields = ["compliant", "compliance_score", "risk_level", "violations", 
                              "reasons", "suggestions", "additional_requirements", "officer_notes"]
            
            for field in required_fields:
                if field not in compliance_result:
                    compliance_result[field] = "" if field == "officer_notes" else []
                    
            return compliance_result
            
        except json.JSONDecodeError:
            print(f"Error parsing JSON from Gemini response: {response_text}")
            return {
                "compliant": False,
                "compliance_score": 0,
                "risk_level": "High",
                "violations": ["Unable to parse compliance assessment"],
                "reasons": ["System received malformed response from compliance engine"],
                "suggestions": ["Please try again or contact system administrator"],
                "additional_requirements": [],
                "officer_notes": "The compliance system encountered an error processing the response data."
            }
    
    except Exception as e:
        print(f"Error in Gemini API: {str(e)}")
        return {
            "compliant": False,
            "compliance_score": 0,
            "risk_level": "High",
            "violations": ["Unable to assess compliance due to system error"],
            "reasons": [f"Error processing compliance check: {str(e)}"],
            "suggestions": ["Please try again or contact system administrator"],
            "additional_requirements": [],
            "officer_notes": "System encountered an error while processing this compliance check."
        }

@app.route('/api/check_compliance', methods=['POST'])
def check_compliance():
    """
    Check compliance for a shipment.
    
    Expected payload:
    {
        "source": "US",
        "destination": "DE",
        "shipment_details": {
            // Any shipment data structure
        }
    }
    """
    try:
        data = request.json
        
        # Extract required fields
        source = data.get('source')
        destination = data.get('destination')
        shipment_details = data.get('shipment_details', {})
        
        # Validate required fields
        if not source or not destination:
            return jsonify({"error": "Both source and destination countries are required"}), 400
        
        if not shipment_details:
            return jsonify({"error": "Shipment details are required"}), 400
        
        # Load rules for this route
        rules = load_rules()
        route_key = f"{source.lower()}-{destination.lower()}"
        
        # Get applicable rules
        applicable_rules = rules.get(route_key, [])
        
        if not applicable_rules:
            return jsonify({
                "source": source,
                "destination": destination,
                "results": [{
                    "section": "General Compliance",
                    "compliance": {
                        "compliant": True,
                        "compliance_score": 100,
                        "risk_level": "Low",
                        "violations": [],
                        "reasons": ["No specific compliance rules found for this route"],
                        "suggestions": [],
                        "additional_requirements": [],
                        "officer_notes": "No specific compliance rules have been defined for this route. This does not guarantee compliance with all international regulations."
                    }
                }]
            })
        
        # Check compliance with Gemini
        # Randomly select one of the API keys
        api_key = random.choice(GEMINI_KEYS) if 'GEMINI_KEYS' in globals() else None
        compliance_result = check_compliance_with_gemini(applicable_rules, shipment_details, api_key)
        
        return jsonify({
            "source": source,
            "destination": destination,
            "results": [{
                "section": "Trade Compliance",
                "compliance": compliance_result
            }]
        })
    
    except Exception as e:
        return jsonify({"error": f"Compliance check failed: {str(e)}"}), 500

@app.route('/api/check_all', methods=['POST'])
def check_all_compliance():
    """
    Check compliance against multiple rule sections.
    Similar to your provided example.
    """
    try:
        data = request.json
        shipment_details = data.get('shipment_details', {})
        
        # Extract source and destination countries
        source = shipment_details.get('senderCountry', '')
        destination = shipment_details.get('recipientCountry', '')
        
        if not source or not destination:
            return jsonify({"error": "Sender and recipient countries are required"}), 400
        
        # Load rules for this route
        rules = load_rules()
        route_key = f"{source.lower()}-{destination.lower()}"
        
        # Get applicable rules and group them by section
        # For demo purposes, let's create some sections from the rules
        all_rules = rules.get(route_key, [])
        
        # Group rules into sections (for this example, we'll create artificial sections)
        sections = {
            "Import Documentation": [],
            "Restricted Items": [],
            "Customs Clearance": [],
            "Shipping Requirements": []
        }
        
        # Distribute rules to sections (simplified approach)
        for i, rule in enumerate(all_rules):
            section_keys = list(sections.keys())
            section_index = i % len(section_keys)
            sections[section_keys[section_index]].append(rule)
        
        def check_section(section_name, section_rules):
            if not section_rules:
                return {
                    "section": section_name,
                    "compliance": {
                        "compliant": True,
                        "compliance_score": 100,
                        "risk_level": "Low",
                        "violations": [],
                        "reasons": [f"No specific {section_name} rules defined for this route"],
                        "suggestions": [],
                        "additional_requirements": [],
                        "officer_notes": f"No {section_name} rules have been defined for this route."
                    }
                }
            
            # Randomly select one of the API keys
            api_key = random.choice(GEMINI_KEYS)
            
            compliance_result = check_compliance_with_gemini(section_rules, shipment_details, api_key)
            return {
                "section": section_name,
                "compliance": compliance_result
            }
        
        # Run compliance checks in parallel using ThreadPoolExecutor
        results = []
        with ThreadPoolExecutor(max_workers=min(len(sections), 4)) as executor:
            futures = {executor.submit(check_section, section, rules): section for section, rules in sections.items()}
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

@app.route('/api/check_bulk_custom', methods=['POST'])
def check_bulk_custom_compliance():
    """
    Process a CSV file with multiple shipments and check compliance against custom rules.
    Each row in the CSV contains source, destination, and item details.
    
    Expected CSV format:
    source,destination,item_description,quantity,value,weight,hs_code,...(other optional fields)
    """
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
        required_fields = ['source', 'destination', 'item_description']
        if not all(field in csv_reader.fieldnames for field in required_fields):
            return jsonify({"error": f"CSV must contain the following fields: {', '.join(required_fields)}"}), 400
            
        # Store all rows from CSV
        for row in csv_reader:
            csv_data.append(row)
            
        if not csv_data:
            return jsonify({"error": "CSV file is empty"}), 400
        
        # Load custom rules from the rules database
        rules = load_rules()
        
        # Determine how many API keys we have
        num_api_keys = len(GEMINI_KEYS) if 'GEMINI_KEYS' in globals() else 1
        print(f"Using {num_api_keys} Gemini API keys for parallel processing")
        
        # Create a lock for thread-safe API key selection
        api_key_lock = threading.Lock()
        key_index = [0]  # Mutable container for the current key index
        
        def get_next_api_key():
            if 'GEMINI_KEYS' not in globals() or not GEMINI_KEYS:
                return None
                
            with api_key_lock:
                key = GEMINI_KEYS[key_index[0]]
                key_index[0] = (key_index[0] + 1) % num_api_keys
                return key
        
        def process_csv_shipment(row):
            # Extract source and destination
            source = row.get('source')
            destination = row.get('destination')
            
            if not source or not destination:
                return {
                    "source": source or "missing",
                    "destination": destination or "missing",
                    "error": "Source and destination are required",
                    "status": "failed"
                }
            
            # Create the route key
            route_key = f"{source.lower()}-{destination.lower()}"
            
            # Get applicable rules for this route
            applicable_rules = rules.get(route_key, [])
            
            if not applicable_rules:
                return {
                    "source": source,
                    "destination": destination,
                    "shipment_id": row.get('shipment_id', 'unknown'),
                    "results": [{
                        "section": "General Compliance",
                        "compliance": {
                            "compliant": True,
                            "compliance_score": 100,
                            "risk_level": "Low",
                            "violations": [],
                            "reasons": ["No specific compliance rules found for this route"],
                            "suggestions": [],
                            "additional_requirements": [],
                            "officer_notes": "No specific compliance rules have been defined for this route."
                        }
                    }],
                    "status": "processed"
                }
            
            # Convert CSV row to shipment details format
            shipment_details = {
                "itemDescription": row.get('item_description', ''),
                "quantity": row.get('quantity', '0'),
                "value": row.get('value', '0'),
                "weight": row.get('weight', '0'),
                "hsCode": row.get('hs_code', '')
            }
            
            # Add any additional fields from the CSV
            for key, value in row.items():
                if key not in ['source', 'destination', 'item_description', 'quantity', 'value', 'weight', 'hs_code']:
                    shipment_details[key] = value
            
            # Each thread gets its own API key from the pool
            api_key = get_next_api_key()
            
            # Check compliance with Gemini
            compliance_result = check_compliance_with_gemini(applicable_rules, shipment_details, api_key)
            
            return {
                "source": source,
                "destination": destination,
                "shipment_id": row.get('shipment_id', 'unknown'),
                "item_description": row.get('item_description', ''),
                "results": [{
                    "section": "Trade Compliance",
                    "compliance": compliance_result
                }],
                "status": "processed"
            }
        
        # Process all shipments in parallel
        results = []
        
        # Use as many workers as we have rows or a reasonable limit
        max_workers = min(len(csv_data), num_api_keys * 2, 20)
        print(f"Starting parallel processing with {max_workers} workers")
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(process_csv_shipment, row): row for row in csv_data}
            for future in as_completed(futures):
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    row = futures[future]
                    results.append({
                        "source": row.get('source', 'unknown'),
                        "destination": row.get('destination', 'unknown'),
                        "shipment_id": row.get('shipment_id', 'unknown'),
                        "error": str(e),
                        "status": "failed"
                    })
        
        # Summarize results
        successful = sum(1 for r in results if r.get("status") == "processed")
        failed = len(results) - successful
        compliant = sum(1 for r in results if r.get("status") == "processed" and 
                        any(section.get("compliance", {}).get("compliant", False) 
                           for section in r.get("results", [])))
                
        return jsonify({
            "total_shipments": len(csv_data),
            "processed": successful,
            "failed": failed,
            "compliant": compliant,
            "non_compliant": successful - compliant,
            "results": results
        })
        
    except Exception as e:
        print(f"Error in bulk processing: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error processing CSV: {str(e)}"}), 500

# Admin routes for managing rules
@app.route('/api/admin/rules', methods=['GET'])
def admin_get_all_rules():
    """Get all rules for admin interface."""
    rules = load_rules()
    
    # Transform the rules to a more admin-friendly format
    formatted_rules = []
    for route_key, route_rules in rules.items():
        source, destination = route_key.split('-')
        for rule in route_rules:
            formatted_rules.append({
                "source": source,
                "destination": destination,
                "rule": rule
            })
    
    return jsonify(formatted_rules)

@app.route('/api/admin/routes', methods=['GET'])
def get_all_routes():
    """Get all defined routes."""
    rules = load_rules()
    routes = []
    
    for route_key in rules.keys():
        source, destination = route_key.split('-')
        routes.append({
            "source": source,
            "destination": destination,
            "rule_count": len(rules[route_key])
        })
    
    return jsonify(routes)

if __name__ == '__main__':
    app.run(debug=True, port=6002)