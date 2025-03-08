from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
from concurrent.futures import ThreadPoolExecutor
import csv
import io

app = Flask(__name__)
CORS(app)

# Mock API keys - replace with your actual keys
GEMINI_KEYS = ["key1", "key2", "key3", "key4"]

def process_single_shipment(row, api_key):
    try:
        # Mock compliance check logic - replace with actual API call
        result = {
            "source": row.get('source', ''),
            "destination": row.get('destination', ''),
            "contents": row.get('contents', ''),
            "compliance_status": "compliant" if len(row.get('contents', '')) > 0 else "non-compliant",
            "risk_level": "Low" if len(row.get('contents', '')) > 0 else "High",
            "suggestions": ["Verify documentation", "Check restricted items list"],
            "status": "success"
        }
        return result
    except Exception as e:
        return {
            "source": row.get('source', ''),
            "destination": row.get('destination', ''),
            "error": str(e),
            "status": "failed"
        }

@app.route('/api/check_bulk', methods=['POST'])
def check_bulk_compliance():
    try:
        data = request.get_json()
        csv_data = data.get('csv', [])
        
        if not csv_data:
            return jsonify({"error": "No CSV data provided"}), 400

        # Verify required fields
        required_fields = ['source', 'destination', 'contents']
        if not all(all(field in row for field in required_fields) for row in csv_data):
            return jsonify({"error": f"CSV must contain the following fields: {', '.join(required_fields)}"}), 400

        # Determine how many API keys we have
        num_api_keys = len(GEMINI_KEYS)
        
        # Process all shipments in parallel
        results = []
        api_key_lock = threading.Lock()
        key_index = [0]

        def get_next_api_key():
            with api_key_lock:
                key = GEMINI_KEYS[key_index[0]]
                key_index[0] = (key_index[0] + 1) % num_api_keys
                return key

        def process_with_dedicated_key(row):
            api_key = get_next_api_key()
            return process_single_shipment(row, api_key)

        max_workers = min(len(csv_data), num_api_keys * 2, 20)
        
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
