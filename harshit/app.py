from flask import Flask, request, jsonify, session
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
from collections import deque
import uuid

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)  # for session management
CORS(app)

# Store chat histories with a TTL (time to live)
chat_histories = {}
MAX_HISTORY = 5  # Keep last 5 messages for context

# Configure Gemini
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-pro')

def format_response(text):
    """Format the response text for better readability"""
    # Clean up any markdown-style formatting
    text = text.replace('**', '')
    text = text.replace('- ', '• ')
    
    # Format numbered lists
    for i in range(1, 10):
        text = text.replace(f'{i}. ', f'\n{i}. ')
    
    # Add proper spacing
    lines = text.split('\n')
    formatted_lines = []
    for line in lines:
        if line.strip().startswith('•'):
            formatted_lines.append(f"  {line.strip()}")
        else:
            formatted_lines.append(line.strip())
    
    return '\n'.join(formatted_lines)

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.json
        query = data.get('query')
        context = data.get('context')
        section = data.get('section', 'Unknown Section')
        chat_id = data.get('chat_id')
        
        # Create or get chat history
        if not chat_id:
            chat_id = str(uuid.uuid4())
            chat_histories[chat_id] = deque(maxlen=MAX_HISTORY)
        elif chat_id not in chat_histories:
            chat_histories[chat_id] = deque(maxlen=MAX_HISTORY)
        
        history = chat_histories[chat_id]
        history_text = "\n".join([f"{'Q' if msg['role'] == 'user' else 'A'}: {msg['content']}" 
                                for msg in history])
        
        # Enhanced prompt for more relevant responses
        prompt = f"""
        You are a specialized customs and regulations assistant focusing on the section: "{section}".
        
        CONTEXT FROM REGULATIONS:
        {context}

        CHAT HISTORY:
        {history_text}

        CURRENT QUESTION:
        {query}

        RESPONSE GUIDELINES:
        1. ONLY answer based on the information provided in the context above
        2. If the specific information isn't in the context, say: "Based on the {section} regulations provided, I cannot find specific information about that. However, ..."
        3. Start responses with relevant details from the section
        4. Format lists as bullet points starting with "•"
        5. For fees/duties, clearly state the percentages or amounts
        6. Keep responses focused on the specific section and question
        7. If you need to reference other sections, say so explicitly
        8. Maintain professional, clear language

        YOUR RESPONSE MUST BE DIRECTLY RELATED TO THE SECTION: {section}
        """
        
        response = model.generate_content(prompt)
        formatted_response = format_response(response.text)
        
        # Verify response relevance
        if len(formatted_response.strip()) < 10:
            formatted_response = f"I apologize, but I don't find specific information about that in the {section} section. Please try rephrasing your question or ask about another aspect of these regulations."
        
        # Update history
        history.append({"role": "user", "content": query})
        history.append({"role": "assistant", "content": formatted_response})
        
        return jsonify({
            'success': True,
            'message': formatted_response,
            'chat_id': chat_id
        })
        
    except Exception as e:
        print("Error:", str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Enable debug mode and allow external connections
    app.run(debug=True, port=6001, host='0.0.0.0')
