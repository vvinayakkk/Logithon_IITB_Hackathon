from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-pro')

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        query = data.get('query')
        context = data.get('context')
        
        # Prepare prompt with context
        prompt = f"""
        Based on the following regulation context, answer the user's question:
        
        Context:
        {context}
        
        Question:
        {query}
        
        Please provide a clear and concise answer focused on the regulation details.
        """
        
        response = model.generate_content(prompt)
        
        return jsonify({
            'success': True,
            'message': response.text
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True,port=6000)
