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
    """Check compliance using Gemini API with enhanced compliance officer analysis."""
    gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key
    }
    
    # Construct enhanced prompt for Gemini
    prompt = f"""
    You are a UPS Senior International Compliance Officer with 15+ years of experience in global shipping regulations. 
    Analyze the following shipment details against regulatory requirements with extreme attention to detail.
    
    REGULATORY FRAMEWORK:
    {section_data['content']}
    
    COMPLIANCE CHECKLIST:
    {json.dumps(section_data['simplified_form'], indent=2)}
    
    SHIPMENT DETAILS FOR INSPECTION:
    {json.dumps(user_data, indent=2)}
    
    TASK: Conduct a thorough, critical compliance analysis as a Senior Compliance Officer would.
    
    Format your response as a JSON object with the following structure:
    {{
        "compliant": boolean,  // true if fully compliant, false otherwise
        "compliance_score": number,  // Rate compliance from 0-100
        "risk_level": string,  // "High", "Medium", "Low", or "None"
        "reasons": [
            // Detailed array of specific compliance findings (both positive and negative)
            // Include regulation code references where applicable
        ],
        "violations": [
            // Array of specific rules violated, if any
        ],
        "suggestions": [
            // Specific, actionable recommendations to resolve each violation
        ],
        "additional_requirements": [
            // Any additional permits, forms or documentation needed
        ],
        "officer_notes": string  // Professional insight from your experience with similar cases
    }}
    
    Ensure your analysis is thorough, strict, and identifies ALL potential compliance issues.
    Be extremely attentive to details that might be overlooked.
    """
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 1500
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
                    "compliant": None,
                    "compliance_score": 0,
                    "risk_level": "Unknown",
                    "reasons": ["Failed to parse Gemini response: " + str(parse_error)],
                    "violations": ["Error in analysis"],
                    "suggestions": ["Please review manually"],
                    "additional_requirements": [],
                    "officer_notes": "Technical error occurred during compliance evaluation."
                }
                
        return {
            "compliant": None,
            "compliance_score": 0,
            "risk_level": "Unknown",
            "reasons": ["Failed to get a valid response from Gemini"],
            "violations": ["Analysis error"],
            "suggestions": ["Please review manually"],
            "additional_requirements": [],
            "officer_notes": "System couldn't complete the compliance evaluation."
        }
    except Exception as e:
        print(f"Error calling Gemini API: {str(e)}")
        return {
            "compliant": None,
            "compliance_score": 0,
            "risk_level": "Unknown",
            "reasons": [f"API error: {str(e)}"],
            "violations": ["Service unavailable"],
            "suggestions": ["Please try again later"],
            "additional_requirements": [],
            "officer_notes": "Technical difficulties encountered during evaluation process."
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
@app.route('/api/check_all', methods=['POST'])
def check_all_compliance():
    try:
        data = request.json
        source = data.get('source')
        destination = data.get('destination')
        user_data = data.get('shipment_details', {})
        
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)