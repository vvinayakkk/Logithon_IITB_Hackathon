
import matplotlib
matplotlib.use('Agg')  # Use Agg backend to avoid Tkinter issues

from flask import Flask, request, jsonify
import json
import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import base64
from io import BytesIO
import markdown
import pdfkit
from langchain.agents import AgentType, initialize_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from composio_langchain import ComposioToolSet, App
import tempfile
import datetime
import numpy as np
from flask_cors import CORS

# Set Matplotlib backend to Agg
plt.switch_backend('Agg')

app = Flask(__name__)
CORS(app)

# Configure environment variables
os.environ["GOOGLE_API_KEY"] = "AIzaSyDqMg4cv_n04wbxo16Bpovc01LXAa96h_I"

def create_report_graphs(compliance_data):
    """Create visualization graphs for the compliance report and return as base64 images"""
    graphs = {}

    # Create a DataFrame from the compliance data
    section_results = compliance_data["compliance_result"]["section_results"]
    section_names = [section["section_name"] for section in section_results]
    compliance_scores = [section["compliance_score"] for section in section_results]
    risk_levels = [section["risk_level"] for section in section_results]
    
    # Graph 1: Section Compliance Scores Bar Chart
    plt.figure(figsize=(12, 6))
    bars = plt.barh(section_names, compliance_scores, color=['#FF6B6B' if score < 100 else '#4ECB71' for score in compliance_scores])
    plt.xlabel('Compliance Score (%)')
    plt.title('Compliance Scores by Section')
    plt.xlim(0, 100)
    
    # Add the score values at the end of each bar
    for bar in bars:
        width = bar.get_width()
        plt.text(width + 1, bar.get_y() + bar.get_height()/2, f'{width:.0f}%', va='center')
    
    plt.tight_layout()
    buffer = BytesIO()
    plt.savefig(buffer, format='png', dpi=100)
    buffer.seek(0)
    graphs['section_scores'] = base64.b64encode(buffer.read()).decode('utf-8')
    plt.close()
    
    # Graph 2: Risk Level Distribution Pie Chart
    risk_counts = {'None': 0, 'Low': 0, 'Medium': 0, 'High': 0, 'Critical': 0}
    for risk in risk_levels:
        if risk in risk_counts:
            risk_counts[risk] += 1
    
    # Filter out risk levels with zero count
    risk_levels_present = {k: v for k, v in risk_counts.items() if v > 0}
    
    plt.figure(figsize=(8, 8))
    colors = {'None': '#4ECB71', 'Low': '#FFD166', 'Medium': '#F4A261', 'High': '#E76F51', 'Critical': '#9D0208'}
    present_colors = [colors[risk] for risk in risk_levels_present.keys()]
    
    plt.pie(risk_levels_present.values(), labels=risk_levels_present.keys(), 
            autopct='%1.1f%%', startangle=90, colors=present_colors, explode=[0.05]*len(risk_levels_present))
    plt.title('Risk Level Distribution')
    plt.tight_layout()
    
    buffer = BytesIO()
    plt.savefig(buffer, format='png', dpi=100)
    buffer.seek(0)
    graphs['risk_distribution'] = base64.b64encode(buffer.read()).decode('utf-8')
    plt.close()
    
    # Graph 3: Overall Compliance Score Gauge Chart
    overall_score = compliance_data["compliance_result"]["overall_compliance"]["overall_compliance_score"]
    
    fig, ax = plt.subplots(figsize=(8, 4), subplot_kw={'projection': 'polar'})
    
    # Define the gauge
    theta = np.linspace(0, np.pi, 100)
    r = np.ones_like(theta)
    
    # Color ranges (red to green)
    cmap = plt.cm.RdYlGn
    norm = plt.Normalize(0, 100)
    
    # Plot the gauge background
    ax.fill_between(theta, 0, r, color='lightgray', alpha=0.5)
    
    # Plot the gauge value
    value_theta = np.linspace(0, np.pi * overall_score / 100, 100)
    ax.fill_between(value_theta, 0, r[:len(value_theta)], color=cmap(norm(overall_score)))
    
    # Add score text
    ax.text(np.pi/2, 0.2, f"{overall_score}/100", ha='center', va='center', fontsize=20, fontweight='bold')
    
    # Configure the plot
    ax.set_theta_zero_location('S')
    ax.set_theta_direction(1)
    ax.set_rticks([])
    ax.set_xticks([0, np.pi/4, np.pi/2, 3*np.pi/4, np.pi])
    ax.set_xticklabels(['0', '25', '50', '75', '100'])
    ax.spines['polar'].set_visible(False)
    
    plt.title('Overall Compliance Score', y=0.1)
    plt.tight_layout()
    
    buffer = BytesIO()
    plt.savefig(buffer, format='png', dpi=100)
    buffer.seek(0)
    graphs['overall_score'] = base64.b64encode(buffer.read()).decode('utf-8')
    plt.close()
    
    # Graph 4: Financial Analysis Bar Chart
    financial = compliance_data["compliance_result"]["financial_analysis"]
    
    fig, ax = plt.subplots(figsize=(10, 6))
    financial_data = {
        'Base Amount': financial["converted_amount"],
        'Tariff': financial["tariff_amount"],
        'Total': financial["total_with_tariff"]
    }
    
    bars = ax.bar(financial_data.keys(), financial_data.values(), color=['#3A86FF', '#FF006E', '#8338EC'])
    
    # Add values on top of bars
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + 50,
                f'{height:.2f} {financial["dest_currency"]}', ha='center', va='bottom')
    
    plt.title(f'Financial Breakdown ({financial["source_currency"]} to {financial["dest_currency"]})')
    plt.ylabel(f'Amount ({financial["dest_currency"]})')
    
    # Add footnote with exchange rate info
    plt.figtext(0.5, 0.01, f'Exchange Rate: 1 {financial["source_currency"]} = {financial["exchange_rate"]} {financial["dest_currency"]}', 
                ha='center', fontsize=10, style='italic')
    
    plt.tight_layout(pad=3.0)
    
    buffer = BytesIO()
    plt.savefig(buffer, format='png', dpi=100)
    buffer.seek(0)
    graphs['financial_analysis'] = base64.b64encode(buffer.read()).decode('utf-8')
    plt.close()
    
    # Graph 5: Violations and Suggestions Count
    violations_count = 0
    suggestions_count = 0
    
    for section in section_results:
        violations_count += len(section["violations"])
        suggestions_count += len(section["suggestions"])
    
    fig, ax = plt.subplots(figsize=(8, 6))
    actions_data = {'Violations': violations_count, 'Suggestions': suggestions_count}
    bars = ax.bar(actions_data.keys(), actions_data.values(), color=['#E63946', '#457B9D'])
    
    # Add values on top of bars
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + 0.1, f'{int(height)}', ha='center', va='bottom')
    
    plt.title('Violations and Suggestions Count')
    plt.tight_layout()
    
    buffer = BytesIO()
    plt.savefig(buffer, format='png', dpi=100)
    buffer.seek(0)
    graphs['violations_suggestions'] = base64.b64encode(buffer.read()).decode('utf-8')
    plt.close()
    
    # Graph 6: Critical Violations Indicator
    critical_violations = compliance_data["compliance_result"]["overall_compliance"]["critical_violations_count"]
    
    plt.figure(figsize=(8, 4))
    ax = plt.subplot(111)
    
    # Create a horizontal "traffic light" indicator
    if critical_violations == 0:
        color = '#4ECB71'  # Green
        status = "No Critical Violations"
    elif critical_violations <= 1:
        color = '#FFD166'  # Yellow
        status = "Attention Required"
    else:
        color = '#E63946'  # Red
        status = "Immediate Action Required"
    
    # Draw the indicator
    ax.add_patch(plt.Rectangle((0, 0), 1, 1, color=color, alpha=0.8))
    ax.text(0.5, 0.5, f"{status}\n{critical_violations} Critical Violations", 
            ha='center', va='center', fontsize=16, fontweight='bold')
    
    # Remove axes
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    
    plt.title('Critical Violations Status')
    plt.tight_layout()
    
    buffer = BytesIO()
    plt.savefig(buffer, format='png', dpi=100)
    buffer.seek(0)
    graphs['critical_violations'] = base64.b64encode(buffer.read()).decode('utf-8')
    plt.close()
    
    # Graph 7: Compliance Timeline Simulation
    # Create a simulated timeline for demonstration purposes
    today = datetime.datetime.now()
    dates = [today + datetime.timedelta(days=i*3) for i in range(5)]
    date_labels = [d.strftime('%m/%d') for d in dates]
    
    statuses = ["Submitted", "Under Review", "Action Required", "Updates Pending", "Compliant"]
    progress = [15, 30, 45, 80, 100]
    
    fig, ax = plt.subplots(figsize=(12, 6))
    ax.plot(date_labels, progress, marker='o', markersize=10, linewidth=3, color='#3A86FF')
    
    # Add status labels
    for i, (d, p, s) in enumerate(zip(date_labels, progress, statuses)):
        if i == 0:  # Highlight current status
            ax.scatter(d, p, s=150, color='#FF006E', zorder=5)
            ax.annotate(f"{s} (Current)", (d, p), xytext=(0, 15), 
                        textcoords="offset points", ha='center', fontweight='bold',
                        bbox=dict(boxstyle="round,pad=0.3", fc='#FF006E', ec="none", alpha=0.7, color='white'))
        else:
            ax.annotate(s, (d, p), xytext=(0, -15), 
                        textcoords="offset points", ha='center')
    
    plt.title('Compliance Resolution Timeline (Projected)')
    plt.ylabel('Progress (%)')
    plt.ylim(0, 110)
    plt.grid(True, linestyle='--', alpha=0.7)
    
    plt.tight_layout()
    
    buffer = BytesIO()
    plt.savefig(buffer, format='png', dpi=100)
    buffer.seek(0)
    graphs['timeline'] = base64.b64encode(buffer.read()).decode('utf-8')
    plt.close()
    
    return graphs

def generate_report_markdown(compliance_data, graphs):
    """Generate a markdown report for the compliance data"""
    
    # Extract relevant data
    overall_compliance = compliance_data["compliance_result"]["overall_compliance"]
    financial_analysis = compliance_data["compliance_result"]["financial_analysis"]
    section_results = compliance_data["compliance_result"]["section_results"]
    additional_requirements = compliance_data["compliance_result"]["additional_requirements"]
    officer_notes = compliance_data["compliance_result"]["officer_notes"]
    
    # Format date and time
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Create markdown content
    markdown_content = markdown_content = f"""
# Compliance Report: Shipment {compliance_data['shipment_id']}

**Generated on:** {current_time}

## Executive Summary

**Origin:** {compliance_data['source']}  
**Destination:** {compliance_data['destination']}  
**Status:** {compliance_data['status'].upper()}  
**Overall Compliance:** {'✅ COMPLIANT' if overall_compliance['compliant'] else '❌ NON-COMPLIANT'}  
**Risk Level:** {overall_compliance['overall_risk_level']}  
**Compliance Score:** {overall_compliance['overall_compliance_score']}/100  
**Critical Violations:** {overall_compliance['critical_violations_count']}

{overall_compliance['summary']}

![Overall Compliance Score](data:image/png;base64,{graphs['overall_score']})

## Critical Status

![Critical Violations](data:image/png;base64,{graphs['critical_violations']})

## Financial Analysis

Exchange Rate: 1 {financial_analysis["source_currency"]} = {financial_analysis["exchange_rate"]} {financial_analysis["dest_currency"]}

| Description | Amount |
|-------------|--------|
| Base Amount | {financial_analysis["converted_amount"]} {financial_analysis["dest_currency"]} |
| Tariff Rate | {financial_analysis["tariff_rate"] * 100}% |
| Tariff Amount | {financial_analysis["tariff_amount"]} {financial_analysis["dest_currency"]} |
| **Total with Tariff** | **{financial_analysis["total_with_tariff"]} {financial_analysis["dest_currency"]}** |

![Financial Analysis](data:image/png;base64,{graphs['financial_analysis']})

## Compliance by Section

![Section Compliance Scores](data:image/png;base64,{graphs['section_scores']})

## Risk Distribution

![Risk Level Distribution](data:image/png;base64,{graphs['risk_distribution']})

## Action Items

![Violations and Suggestions](data:image/png;base64,{graphs['violations_suggestions']})

## Projected Timeline

![Compliance Timeline](data:image/png;base64,{graphs['timeline']})

## Additional Requirements

{'slashn'.join([f"- {req}" for req in additional_requirements])}

## Detailed Section Analysis
"""

    
    # Add section details
    for section in section_results:
        section_name = section["section_name"]
        compliance_status = "✅ COMPLIANT" if section["compliant"] else "❌ NON-COMPLIANT"
        risk_level = section["risk_level"]
        compliance_score = section["compliance_score"]
        
        markdown_content += f"""
### {section_name}

**Status:** {compliance_status}  
**Risk Level:** {risk_level}  
**Compliance Score:** {compliance_score}/100

"""
        
        if section["reasons"]:
            markdown_content += "**Reasons:**\n"
            for reason in section["reasons"]:
                markdown_content += f"- {reason}\n"
        
        if section["violations"]:
            markdown_content += "\n**Violations:**\n"
            for violation in section["violations"]:
                markdown_content += f"- {violation}\n"
        
        if section["suggestions"]:
            markdown_content += "\n**Suggestions:**\n"
            for suggestion in section["suggestions"]:
                markdown_content += f"- {suggestion}\n"
    
    # Add officer notes
    markdown_content += f"""
## Officer Notes

{officer_notes}
"""
    
    return markdown_content

def convert_markdown_to_pdf(markdown_content):
    """Convert markdown content to PDF"""
    # Convert markdown to HTML
    html_content = markdown.markdown(markdown_content)
    
    # Add CSS for better styling
    styled_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 2em;
            }}
            h1 {{
                color: #2c3e50;
                border-bottom: 2px solid #3498db;
                padding-bottom: 10px;
            }}
            h2 {{
                color: #2c3e50;
                margin-top: 1.5em;
                border-bottom: 1px solid #bdc3c7;
                padding-bottom: 5px;
            }}
            h3 {{
                color: #34495e;
            }}
            table {{
                border-collapse: collapse;
                width: 100%;
                margin: 1em 0;
            }}
            th, td {{
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }}
            th {{
                background-color: #f2f2f2;
            }}
            img {{
                max-width: 100%;
                display: block;
                margin: 1em auto;
            }}
            .executive-summary {{
                background-color: #f8f9fa;
                padding: 15px;
                border-left: 4px solid #3498db;
                margin-bottom: 20px;
            }}
            .non-compliant {{
                color: #e74c3c;
                font-weight: bold;
            }}
            .compliant {{
                color: #2ecc71;
                font-weight: bold;
            }}
        </style>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """
    
    # Create a temporary file for the PDF
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
        pdf_path = temp_file.name
    
    # Path to wkhtmltopdf executable
    path_to_wkhtmltopdf = r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe'  # Update this path if necessary
    config = pdfkit.configuration(wkhtmltopdf=path_to_wkhtmltopdf)
    
    # Convert HTML to PDF
    pdfkit.from_string(styled_html, pdf_path, configuration=config)
    
    return pdf_path

def send_email_with_report(email, pdf_path, shipment_id):
    """Send email with the PDF report using the Composio agent"""
    # Initialize the LLM
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro",
        temperature=0.1,
        convert_system_message_to_human=True
    )
    
    # Initialize Composio tools
    composio_toolset = ComposioToolSet(api_key="7x3tgeyd9hcuftbaxha3pn")
    tools = composio_toolset.get_tools(actions=['GMAIL_SEND_EMAIL'])
    
    # Create agent
    agent = initialize_agent(
        tools,
        llm,
        agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
        verbose=True
    )
    
    # Generate task for the agent
    task = f"""
    Send an email to {email} with the compliance report PDF attached. 
    
    Subject: Compliance Report for Shipment {shipment_id} - Action Required
    
    The email body should be professional and informative with the following key points:
    1. This is the compliance report for shipment {shipment_id}
    2. The report shows compliance violations that require immediate attention
    3. The recipient should review the attached PDF and take appropriate actions
    4. Offer assistance if they have any questions
    
    The PDF file is located at: {pdf_path}
    
    Make sure to emphasize the urgency of addressing the compliance issues.
    """
    
    # Run the agent
    result = agent.run(task)
    return result

@app.route('/api/ai_agent', methods=['POST'])
def ai_agent():
    try:
        # Get the data from the request
        data = request.json
        
        # Extract the compliance data and email
        compliance_data = data.get('results', [])[0]  # Assuming the first result for simplicity
        email = data.get('email', 'user@example.com')
        
        # Generate graphs for the report
        graphs = create_report_graphs(compliance_data)
        
        # Generate markdown report
        markdown_report = generate_report_markdown(compliance_data, graphs)
        
        # Convert markdown to PDF
        pdf_path = convert_markdown_to_pdf(markdown_report)
        
        # Send email with the PDF report
        email_result = send_email_with_report(email, pdf_path, compliance_data['shipment_id'])
        
        return jsonify({
            'status': 'success',
            'message': 'Report generated and email sent successfully',
            'email_result': email_result
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/check_bulk', methods=['POST'])
def check_bulk():
    # This endpoint doesn't need to do much since you're simulating the backend response
    return jsonify({
        'processed': 10,
        'results': [
            json.loads(request.json.get('data', '{}')),
            # Additional results would go here
        ]
    })

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=3001,debug=True)

