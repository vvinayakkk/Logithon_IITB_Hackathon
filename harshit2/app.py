import random
from faker import Faker
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta
import pytz
import csv
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Faker
fake = Faker()

# Connect to MongoDB
mongo_uri = os.getenv('MONGO_URI')
client = MongoClient(mongo_uri)
db = client["complianceDB"]

# Clear existing collections to avoid duplicates
collections = ["users", "organizations", "shipments", "shipment_items", "compliance_rules", 
               "documents", "country_compliance", "logs"]
for collection in collections:
    db[collection].delete_many({})

# HS Codes with descriptions for common export items
hs_codes = {
    "8471.30": "Portable automatic data processing machines, weighing not more than 10 kg",
    "8517.12": "Mobile phones and smartphones",
    "8528.72": "Television reception apparatus, color",
    "6204.33": "Women's or girls' jackets and blazers, of synthetic fibers",
    "6403.99": "Footwear with outer soles of rubber, plastics or composition leather",
    "4202.12": "Trunks, suitcases, with outer surface of plastics or textile materials",
    "9503.00": "Toys; tricycles, scooters, pedal cars and similar wheeled toys",
    "3304.99": "Beauty or make-up preparations and preparations for skin care",
    "8516.50": "Microwave ovens",
    "8418.10": "Combined refrigerator-freezers, fitted with separate external doors",
    "9018.90": "Medical instruments and appliances",
    "8443.31": "Machines which perform two or more of the functions of printing, copying or facsimile transmission",
    "6110.20": "Sweaters, pullovers, sweatshirts, waistcoats (vests) of cotton",
    "9504.50": "Video game consoles and machines",
    "8423.10": "Personal weighing machines, including baby scales; household scales",
    "3926.90": "Other articles of plastics",
    "2208.30": "Whiskies",
    "2204.21": "Wine of fresh grapes, in containers holding 2 liters or less",
    "0901.21": "Coffee, roasted, not decaffeinated",
    "1806.90": "Chocolate and other food preparations containing cocoa"
}

# Countries with restrictions and special requirements
country_data = {
    "US": {
        "name": "United States",
        "restricted_items": ["2208.30", "9018.90"],
        "prohibited_items": ["2939.91"],
        "value_threshold": 2500,
        "special_requirements": "Electronic Export Information (EEI) required for shipments over $2,500",
        "tax_rates": {"standard": 0, "import_duty": 0.025},
        "tariffs": {"electronics": 0.02, "textiles": 0.07, "food": 0.03}
    },
    "CA": {
        "name": "Canada",
        "restricted_items": ["2208.30"],
        "prohibited_items": ["0301.93"],
        "value_threshold": 2000,
        "special_requirements": "Canada Customs Invoice for commercial shipments over $2,000",
        "tax_rates": {"standard": 0.05, "import_duty": 0.018},
        "tariffs": {"electronics": 0.015, "textiles": 0.05, "food": 0.02}
    },
    "GB": {
        "name": "United Kingdom",
        "restricted_items": ["2208.30", "9018.90"],
        "prohibited_items": ["0302.81"],
        "value_threshold": 1500,
        "special_requirements": "Commercial invoice and Certificate of Origin required",
        "tax_rates": {"standard": 0.20, "import_duty": 0.035},
        "tariffs": {"electronics": 0.025, "textiles": 0.08, "food": 0.05}
    },
    "FR": {
        "name": "France",
        "restricted_items": ["2208.30", "9018.90"],
        "prohibited_items": ["0301.93"],
        "value_threshold": 1000,
        "special_requirements": "EU declaration of conformity for electronic products",
        "tax_rates": {"standard": 0.20, "import_duty": 0.03},
        "tariffs": {"electronics": 0.023, "textiles": 0.075, "food": 0.045}
    },
    "DE": {
        "name": "Germany",
        "restricted_items": ["2208.30", "9018.90"],
        "prohibited_items": ["0301.93"],
        "value_threshold": 1000,
        "special_requirements": "EU declaration of conformity for electronic products",
        "tax_rates": {"standard": 0.19, "import_duty": 0.03},
        "tariffs": {"electronics": 0.025, "textiles": 0.07, "food": 0.04}
    },
    "JP": {
        "name": "Japan",
        "restricted_items": ["2208.30", "0901.21"],
        "prohibited_items": ["0301.93"],
        "value_threshold": 200000,  # in JPY
        "special_requirements": "Import Declaration Form (Customs Form C-5020) required",
        "tax_rates": {"standard": 0.10, "import_duty": 0.04},
        "tariffs": {"electronics": 0, "textiles": 0.09, "food": 0.06}
    },
    "AU": {
        "name": "Australia",
        "restricted_items": ["2208.30", "0901.21"],
        "prohibited_items": ["0301.93"],
        "value_threshold": 1000,  # in AUD
        "special_requirements": "Self-assessed clearance declaration for goods valued under AUD 1,000",
        "tax_rates": {"standard": 0.10, "import_duty": 0.05},
        "tariffs": {"electronics": 0.03, "textiles": 0.1, "food": 0.05}
    },
    "CN": {
        "name": "China",
        "restricted_items": ["9018.90", "8471.30", "8443.31"],
        "prohibited_items": ["2939.91", "0301.93"],
        "value_threshold": 5000,  # in CNY
        "special_requirements": "China Compulsory Certification (CCC) for electronics",
        "tax_rates": {"standard": 0.13, "import_duty": 0.08},
        "tariffs": {"electronics": 0.1, "textiles": 0.12, "food": 0.15}
    },
    "AE": {
        "name": "United Arab Emirates",
        "restricted_items": ["2208.30", "9018.90"],
        "prohibited_items": ["2204.21"],
        "value_threshold": 1000,  # in AED
        "special_requirements": "Certificate of Origin required for all shipments",
        "tax_rates": {"standard": 0.05, "import_duty": 0.05},
        "tariffs": {"electronics": 0.05, "textiles": 0.05, "food": 0.05}
    },
    "BR": {
        "name": "Brazil",
        "restricted_items": ["9018.90", "8471.30"],
        "prohibited_items": ["0301.93"],
        "value_threshold": 3000,  # in BRL
        "special_requirements": "Portuguese label required for consumer goods",
        "tax_rates": {"standard": 0.17, "import_duty": 0.15},
        "tariffs": {"electronics": 0.12, "textiles": 0.35, "food": 0.1}
    }
}

# Currencies with codes and exchange rates to USD
currencies = {
    "USD": {"name": "US Dollar", "exchange_rate": 1.0},
    "EUR": {"name": "Euro", "exchange_rate": 0.92},
    "GBP": {"name": "British Pound", "exchange_rate": 0.79},
    "CAD": {"name": "Canadian Dollar", "exchange_rate": 1.37},
    "JPY": {"name": "Japanese Yen", "exchange_rate": 150.45},
    "AUD": {"name": "Australian Dollar", "exchange_rate": 1.54},
    "CNY": {"name": "Chinese Yuan", "exchange_rate": 7.23},
    "AED": {"name": "UAE Dirham", "exchange_rate": 3.67},
    "BRL": {"name": "Brazilian Real", "exchange_rate": 5.64}
}

# Mapping country codes to currency codes
country_to_currency = {
    "US": "USD",
    "CA": "CAD",
    "GB": "GBP",
    "FR": "EUR",
    "DE": "EUR",
    "JP": "JPY",
    "AU": "AUD",
    "CN": "CNY",
    "AE": "AED",
    "BR": "BRL"
}

# Carriers
carriers = ["DHL", "FedEx", "UPS", "USPS", "DPD", "Royal Mail", "Japan Post", "Australia Post", "China Post", "Emirates Post"]

# Shipment methods based on distance and type
def determine_shipment_method(sender_country, recipient_country):
    # For nearby countries, land might be an option
    nearby_pairs = [("US", "CA"), ("CA", "US"), ("FR", "DE"), ("DE", "FR")]
    
    if (sender_country, recipient_country) in nearby_pairs:
        return random.choice(["Air", "Land"])
    # For very distant countries, sea might be a better option for heavier shipments
    elif sender_country in ["US", "CA"] and recipient_country in ["JP", "AU", "CN"]:
        return random.choice(["Air", "Sea"])
    elif sender_country in ["JP", "AU", "CN"] and recipient_country in ["US", "CA"]:
        return random.choice(["Air", "Sea"])
    else:
        return "Air"  # Default to air for most international shipments

# Generate Organizations
def generate_organizations(count=5):
    org_ids = []
    for _ in range(count):
        country_code = random.choice(list(country_data.keys()))
        org_id = ObjectId()
        org_data = {
            "organization_id": org_id,
            "name": fake.company(),
            "address": fake.address().replace('\n', ', '),
            "country": country_data[country_code]["name"],
            "country_code": country_code,
            "tax_id": fake.bothify(text="??#######"),
            "contact_email": fake.company_email(),
            "contact_phone": fake.phone_number(),
            "created_at": fake.date_time_between(start_date="-2y", end_date="-1y", tzinfo=pytz.UTC),
            "updated_at": fake.date_time_between(start_date="-1y", end_date="now", tzinfo=pytz.UTC)
        }
        db.organizations.insert_one(org_data)
        org_ids.append(org_id)
    return org_ids

# Generate Users
def generate_users(org_ids, count=15):
    user_ids = []
    roles = ["Admin", "Compliance Officer", "User"]
    role_weights = [0.2, 0.3, 0.5]  # More regular users than admins
    
    for _ in range(count):
        user_id = ObjectId()
        org_id = random.choice(org_ids)
        role = random.choices(roles, weights=role_weights)[0]
        
        user_data = {
            "user_id": user_id,
            "name": fake.name(),
            "email": fake.email(),
            "phone": fake.phone_number(),
            "role": role,
            "organization_id": org_id,
            "password_hash": fake.sha256(),
            "is_active": random.random() > 0.1,  # 90% active
            "created_at": fake.date_time_between(start_date="-1y", end_date="-6m", tzinfo=pytz.UTC),
            "updated_at": fake.date_time_between(start_date="-6m", end_date="now", tzinfo=pytz.UTC)
        }
        db.users.insert_one(user_data)
        user_ids.append(user_id)
    return user_ids

# Generate Country Compliance
def generate_country_compliance():
    for country_code, data in country_data.items():
        country_compliance = {
            "country_code": country_code,
            "country_name": data["name"],
            "required_documents": [
                "Commercial Invoice",
                "Packing List",
                "Certificate of Origin" if random.random() > 0.5 else None,
                "Customs Declaration",
                "Bill of Lading" if random.random() > 0.7 else None
            ],
            "restricted_items": data["restricted_items"],
            "prohibited_items": data["prohibited_items"],
            "value_thresholds": {
                "documentation": data["value_threshold"],
                "inspection": data["value_threshold"] * 2
            },
            "special_requirements": data["special_requirements"],
            "tax_rates": data["tax_rates"],
            "tariffs": data["tariffs"],
            "created_at": fake.date_time_between(start_date="-2y", end_date="-1y", tzinfo=pytz.UTC),
            "updated_at": fake.date_time_between(start_date="-6m", end_date="now", tzinfo=pytz.UTC)
        }
        # Remove None values
        country_compliance["required_documents"] = [doc for doc in country_compliance["required_documents"] if doc]
        db.country_compliance.insert_one(country_compliance)

# Generate Compliance Rules
def generate_compliance_rules():
    rules = [
        {
            "rule_name": "Restricted Countries Shipment",
            "description": "Prohibits shipments to countries under trade restrictions",
            "condition": "recipient_country in restricted_countries",
            "affected_countries": ["IR", "KP", "CU", "SY"],
            "required_documents": [],
            "restricted_items": [],
            "value_thresholds": {},
            "action": "Reject"
        },
        {
            "rule_name": "High-Value Shipment Documentation",
            "description": "Requires additional documentation for high-value shipments",
            "condition": "shipment_value > country_threshold",
            "affected_countries": [],
            "required_documents": ["Export License", "Insurance Certificate"],
            "restricted_items": [],
            "value_thresholds": {"threshold": "country_specific"},
            "action": "Flag"
        },
        {
            "rule_name": "Restricted Items Clearance",
            "description": "Requires special clearance for restricted items",
            "condition": "any(item in restricted_items for item in shipment_items)",
            "affected_countries": [],
            "required_documents": ["Export License"],
            "restricted_items": [],
            "value_thresholds": {},
            "action": "Flag"
        },
        {
            "rule_name": "Prohibited Items Check",
            "description": "Prevents shipping of items prohibited by destination country",
            "condition": "any(item in country_prohibited_items for item in shipment_items)",
            "affected_countries": [],
            "required_documents": [],
            "restricted_items": [],
            "value_thresholds": {},
            "action": "Reject"
        },
        {
            "rule_name": "Weight Limit Check",
            "description": "Flags shipments exceeding certain weight thresholds",
            "condition": "shipment_weight > 20",
            "affected_countries": [],
            "required_documents": ["Special Handling Form"],
            "restricted_items": [],
            "value_thresholds": {},
            "action": "Flag"
        },
        {
            "rule_name": "Electronics Export Control",
            "description": "Special handling for electronics to certain countries",
            "condition": "any(item.startswith('84') or item.startswith('85') for item in shipment_items) and recipient_country in ['CN', 'RU']",
            "affected_countries": ["CN", "RU"],
            "required_documents": ["End-User Certificate"],
            "restricted_items": ["8471.30", "8517.12", "8528.72"],
            "value_thresholds": {},
            "action": "Flag"
        },
        {
            "rule_name": "Medical Supplies Export",
            "description": "Special requirements for medical supplies",
            "condition": "any(item.startswith('9018') for item in shipment_items)",
            "affected_countries": [],
            "required_documents": ["Medical Device Registration"],
            "restricted_items": ["9018.90"],
            "value_thresholds": {},
            "action": "Flag"
        },
        {
            "rule_name": "Alcohol Export",
            "description": "Special requirements for alcohol exports",
            "condition": "any(item.startswith('2208') for item in shipment_items)",
            "affected_countries": [],
            "required_documents": ["Alcohol Export License"],
            "restricted_items": ["2208.30"],
            "value_thresholds": {},
            "action": "Flag"
        }
    ]
    
    for rule in rules:
        rule_id = ObjectId()
        rule_data = {
            "rule_id": rule_id,
            "rule_name": rule["rule_name"],
            "description": rule["description"],
            "condition": rule["condition"],
            "affected_countries": rule["affected_countries"],
            "required_documents": rule["required_documents"],
            "restricted_items": rule["restricted_items"],
            "value_thresholds": rule["value_thresholds"],
            "action": rule["action"],
            "created_at": fake.date_time_between(start_date="-1y", end_date="-6m", tzinfo=pytz.UTC),
            "updated_at": fake.date_time_between(start_date="-6m", end_date="now", tzinfo=pytz.UTC)
        }
        db.compliance_rules.insert_one(rule_data)

# Generate Shipments and related data
def generate_shipments(user_ids, org_ids, count=50):
    shipment_ids = []
    all_shipment_data = []
    
    for _ in range(count):
        user_id = random.choice(user_ids)
        user = db.users.find_one({"user_id": user_id})
        org_id = user["organization_id"]
        org = db.organizations.find_one({"organization_id": org_id})
        
        # Get organization's country
        sender_country_code = org.get("country_code", random.choice(list(country_data.keys())))
        sender_country = country_data[sender_country_code]["name"]
        
        # Choose recipient country different from sender
        available_countries = list(country_data.keys())
        available_countries.remove(sender_country_code)
        recipient_country_code = random.choice(available_countries)
        recipient_country = country_data[recipient_country_code]["name"]
        
        # Determine shipment method
        shipment_method = determine_shipment_method(sender_country_code, recipient_country_code)
        
        # Choose carrier based on countries and method
        suitable_carriers = carriers
        if shipment_method == "Land" and sender_country_code == "US" and recipient_country_code == "CA":
            suitable_carriers = ["UPS", "FedEx", "USPS"]
        elif shipment_method == "Air":
            suitable_carriers = ["DHL", "FedEx", "UPS"]
        elif shipment_method == "Sea":
            suitable_carriers = ["Maersk", "MSC", "CMA CGM"]
        
        carrier = random.choice(suitable_carriers)
        
        # Generate shipment date (more recent dates are more likely)
        shipment_date = fake.date_time_between(start_date="-3m", end_date="now", tzinfo=pytz.UTC)
        
        # Generate shipment status (with realistic weighting)
        if (datetime.now(pytz.UTC) - shipment_date).days < 7:  # Recent shipments
            status_options = ["Pending", "Flagged", "Compliant", "Rejected"]
            status_weights = [0.3, 0.2, 0.4, 0.1]
        else:  # Older shipments
            status_options = ["Pending", "Flagged", "Compliant", "Rejected", "In Transit", "Delivered"]
            status_weights = [0.05, 0.1, 0.2, 0.05, 0.2, 0.4]
        
        status = random.choices(status_options, weights=status_weights)[0]
        
        # Generate shipment ID and tracking number
        shipment_id = ObjectId()
        tracking_number = fake.bothify(text="?#?#?#?#?#?").upper()
        
        # Set currency based on sender country
        currency = country_to_currency.get(sender_country_code, "USD")
        
        # Initial shipment without items (to be updated later)
        shipment_data = {
            "shipment_id": shipment_id,
            "user_id": user_id,
            "organization_id": org_id,
            "shipment_date": shipment_date,
            "sender_name": org["name"],
            "sender_address": org["address"],
            "sender_country": sender_country,
            "sender_country_code": sender_country_code,
            "recipient_name": fake.company(),
            "recipient_address": fake.address().replace('\n', ', '),
            "recipient_country": recipient_country,
            "recipient_country_code": recipient_country_code,
            "total_value": 0,  # to be updated after items are added
            "currency": currency,
            "total_weight": 0,  # to be updated after items are added
            "shipment_method": shipment_method,
            "tracking_number": tracking_number,
            "carrier": carrier,
            "status": status,
            "compliance_notes": "",
            "created_at": shipment_date - timedelta(hours=random.randint(1, 24)),
            "updated_at": shipment_date
        }
        
        # Generate shipment items
        item_count = random.randint(1, 5)
        shipment_items = []
        total_value = 0
        total_weight = 0
        hs_code_list = []
        
        for _ in range(item_count):
            hs_code = random.choice(list(hs_codes.keys()))
            description = hs_codes[hs_code]
            quantity = random.randint(1, 10)
            unit_value = random.uniform(10, 500)
            item_total_value = unit_value * quantity
            weight = random.uniform(0.1, 5) * quantity
            
            # Check if item is restricted or needs clearance
            restricted = hs_code in country_data[recipient_country_code]["restricted_items"]
            clearance_required = restricted
            prohibited = hs_code in country_data[recipient_country_code]["prohibited_items"]
            
            # If item is prohibited and shipment not rejected yet, mark it as flagged or rejected
            if prohibited and status not in ["Rejected", "Flagged"]:
                status = random.choice(["Flagged", "Rejected"])
                shipment_data["compliance_notes"] = f"Contains prohibited item: {description} (HS: {hs_code})"
            
            # If item is restricted and shipment not flagged yet, mark it as flagged
            elif restricted and status not in ["Flagged", "Rejected"]:
                status = "Flagged"
                shipment_data["compliance_notes"] = f"Contains restricted item requiring special clearance: {description} (HS: {hs_code})"
            
            item_data = {
                "item_id": ObjectId(),
                "shipment_id": shipment_id,
                "description": description,
                "hs_code": hs_code,
                "quantity": quantity,
                "unit_value": unit_value,
                "total_value": item_total_value,
                "weight": weight,
                "restricted": restricted,
                "clearance_required": clearance_required,
                "origin_country": sender_country,
                "origin_country_code": sender_country_code,
                "destination_country": recipient_country,
                "destination_country_code": recipient_country_code,
                "created_at": shipment_date - timedelta(hours=random.randint(1, 24)),
                "updated_at": shipment_date
            }
            
            shipment_items.append(item_data)
            total_value += item_total_value
            total_weight += weight
            hs_code_list.append(hs_code)
        
        # Update shipment with totals and final status
        shipment_data["total_value"] = round(total_value, 2)
        shipment_data["total_weight"] = round(total_weight, 2)
        shipment_data["status"] = status
        
        # Check value thresholds
        value_threshold = country_data[recipient_country_code]["value_threshold"]
        if total_value > value_threshold and status not in ["Flagged", "Rejected"]:
            shipment_data["status"] = "Flagged"
            shipment_data["compliance_notes"] = f"Shipment value exceeds threshold for {recipient_country}. Additional documentation required."
        
        # If shipment was created over 14 days ago and is still compliant, mark as delivered
        days_since_creation = (datetime.now(pytz.UTC) - shipment_date).days
        if days_since_creation > 14 and shipment_data["status"] == "Compliant":
            shipment_data["status"] = "Delivered"
        
        # Insert shipment and items
        db.shipments.insert_one(shipment_data)
        db.shipment_items.insert_many(shipment_items)
        
        shipment_ids.append(shipment_id)
        all_shipment_data.append({"shipment": shipment_data, "items": shipment_items})
        
        # Generate documents for Compliant or Delivered shipments
        if shipment_data["status"] in ["Compliant", "Delivered"]:
            generate_documents(shipment_id, user_id, shipment_date)
        
        # Generate logs for this shipment
        generate_logs(shipment_id, user_id, shipment_data["status"], shipment_date)
    
    return shipment_ids, all_shipment_data

# Generate Documents
def generate_documents(shipment_id, user_id, shipment_date):
    # Basic documents all shipments should have
    basic_docs = ["Invoice", "Packing List", "Customs Declaration"]
    
    # Additional documents that may be required
    additional_docs = ["Certificate of Origin", "Bill of Lading", "Export License", "Insurance Certificate"]
    
    # Create basic documents (always present)
    for doc_type in basic_docs:
        doc_id = ObjectId()
        status = random.choices(["Pending", "Verified"], weights=[0.2, 0.8])[0]
        
        verified_data = None
        verified_by = None
        
        if status == "Verified":
            verified_by = user_id
            verified_data = shipment_date + timedelta(hours=random.randint(1, 48))
        
        doc_data = {
            "document_id": doc_id,
            "shipment_id": shipment_id,
            "document_name": f"{doc_type} - {fake.bothify(text='#####')}",
            "document_type": doc_type,
            "file_url": f"/documents/{shipment_id}/{doc_type.lower().replace(' ', '_')}.pdf",
            "status": status,
            "verified_by": verified_by,
            "verified_at": verified_data,
            "created_at": shipment_date - timedelta(hours=random.randint(1, 24)),
            "updated_at": shipment_date
        }
        db.documents.insert_one(doc_data)
    
    # Add some additional documents with probability
    for doc_type in additional_docs:
        if random.random() < 0.3:  # 30% chance to add each additional document
            doc_id = ObjectId()
            status = random.choices(["Pending", "Verified", "Rejected"], weights=[0.3, 0.6, 0.1])[0]
            
            verified_data = None
            verified_by = None
            
            if status == "Verified":
                verified_by = user_id
                verified_data = shipment_date + timedelta(hours=random.randint(1, 48))
            
            doc_data = {
                "document_id": doc_id,
                "shipment_id": shipment_id,
                "document_name": f"{doc_type} - {fake.bothify(text='#####')}",
                "document_type": doc_type,
                "file_url": f"/documents/{shipment_id}/{doc_type.lower().replace(' ', '_')}.pdf",
                "status": status,
                "verified_by": verified_by,
                "verified_at": verified_data,
                "created_at": shipment_date - timedelta(hours=random.randint(1, 24)),
                "updated_at": shipment_date
            }
            db.documents.insert_one(doc_data)

# Generate Logs
def generate_logs(shipment_id, user_id, status, shipment_date):
    # Create shipment creation log
    creation_log = {
        "log_id": ObjectId(),
        "user_id": user_id,
        "action": "SHIPMENT_CREATED",
        "details": f"Shipment {shipment_id} created",
        "timestamp": shipment_date - timedelta(hours=random.randint(1, 24))
    }
    db.logs.insert_one(creation_log)
    
    # Create status update logs
    if status == "Flagged":
        flag_log = {
            "log_id": ObjectId(),
            "user_id": user_id,
            "action": "SHIPMENT_FLAGGED",
            "details": f"Shipment {shipment_id} flagged for compliance review",
            "timestamp": shipment_date + timedelta(hours=random.randint(1, 12))
        }
        db.logs.insert_one(flag_log)
    
    elif status == "Compliant":
        approve_log = {
            "log_id": ObjectId(),
            "user_id": user_id,
            "action": "SHIPMENT_APPROVED",
            "details": f"Shipment {shipment_id} marked as compliant",
            "timestamp": shipment_date + timedelta(hours=random.randint(1, 12))
        }
        db.logs.insert_one(approve_log)
    
    elif status == "Rejected":
        reject_log = {
            "log_id": ObjectId(),
            "user_id": user_id,
            "action": "SHIPMENT_REJECTED",
            "details": f"Shipment {shipment_id} rejected due to compliance issues",
            "timestamp": shipment_date + timedelta(hours=random.randint(1, 12))
        }
        db.logs.insert_one(reject_log)
    
    elif status == "In Transit":
        transit_log = {
            "log_id": ObjectId(),
            "user_id": user_id,
            "action": "SHIPMENT_IN_TRANSIT",
            "details": f"Shipment {shipment_id} is now in transit",
            "timestamp": shipment_date + timedelta(days=random.randint(1, 3))
        }
        db.logs.insert_one(transit_log)
    
    elif status == "Delivered":
        compliant_log = {
            "log_id": ObjectId(),
            "user_id": user_id,
            "action": "SHIPMENT_APPROVED",
            "details": f"Shipment {shipment_id} marked as compliant",
            "timestamp": shipment_date + timedelta(hours=random.randint(1, 12))
        }
        db.logs.insert_one(compliant_log)
        
        transit_log = {
            "log_id": ObjectId(),
            "user_id": user_id,
            "action": "SHIPMENT_IN_TRANSIT",
            "details": f"Shipment {shipment_id} is now in transit",
            "timestamp": shipment_date + timedelta(days=random.randint(1, 3))
        }
        db.logs.insert_one(transit_log)
        
        delivered_log = {
            "log_id": ObjectId(),
            "user_id": user_id,
            "action": "SHIPMENT_DELIVERED",
            "details": f"Shipment {shipment_id} has been delivered",
            "timestamp": shipment_date + timedelta(days=random.randint(5, 10))
        }
        db.logs.insert_one(delivered_log)

# Function to export data to CSV for easy import to UI
def export_to_csv(shipment_data):
    os.makedirs("export_data", exist_ok=True)
    
    # Export shipments to CSV
    with open('export_data/shipments.csv', 'w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['shipment_id', 'tracking_number', 'shipment_date', 'sender_name', 'sender_country', 
                         'recipient_name', 'recipient_country', 'total_value', 'currency', 'total_weight', 
                         'shipment_method', 'carrier', 'status', 'compliance_notes'])
        
        for data in shipment_data:
            shipment = data['shipment']
            writer.writerow([
                str(shipment['shipment_id']),
                shipment['tracking_number'],
                shipment['shipment_date'].strftime('%Y-%m-%d'),
                shipment['sender_name'],
                shipment['sender_country'],
                shipment['recipient_name'],
                shipment['recipient_country'],
                shipment['total_value'],
                shipment['currency'],
                shipment['total_weight'],
                shipment['shipment_method'],
                shipment['carrier'],
                shipment['status'],
                shipment['compliance_notes']
            ])
    
    # Export shipment items to CSV
    with open('export_data/shipment_items.csv', 'w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['item_id', 'shipment_id', 'description', 'hs_code', 'quantity', 'unit_value', 
                         'total_value', 'weight', 'restricted', 'clearance_required', 'origin_country', 
                         'destination_country'])
        
        for data in shipment_data:
            for item in data['items']:
                writer.writerow([
                    str(item['item_id']),
                    str(item['shipment_id']),
                    item['description'],
                    item['hs_code'],
                    item['quantity'],
                    item['unit_value'],
                    item['total_value'],
                    item['weight'],
                    'Yes' if item['restricted'] else 'No',
                    'Yes' if item['clearance_required'] else 'No',
                    item['origin_country'],
                    item['destination_country']
                ])
    
    # Export country compliance data to CSV
    with open('export_data/country_compliance.csv', 'w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['country_code', 'country_name', 'required_documents', 'restricted_items', 
                         'prohibited_items', 'value_threshold', 'special_requirements'])
        
        for country_code, data in country_data.items():
            writer.writerow([
                country_code,
                data['name'],
                ', '.join(['Commercial Invoice', 'Packing List', 'Customs Declaration']),
                ', '.join([f"{code} ({hs_codes.get(code, 'Unknown')})" for code in data['restricted_items']]),
                ', '.join([f"{code} ({hs_codes.get(code, 'Unknown')})" for code in data['prohibited_items']]),
                data['value_threshold'],
                data['special_requirements']
            ])

# Main function to generate all data
def generate_all_data():
    print("Generating organizations...")
    org_ids = generate_organizations(count=5)
    
    print("Generating users...")
    user_ids = generate_users(org_ids, count=15)
    
    print("Generating country compliance data...")
    generate_country_compliance()
    
    print("Generating compliance rules...")
    generate_compliance_rules()
    
    print("Generating shipments and related data...")
    shipment_ids, shipment_data = generate_shipments(user_ids, org_ids, count=50)
    
    print("Exporting data to CSV...")
    export_to_csv(shipment_data)
    
    print("Data generation complete!")
    
    # Print some stats
    print(f"\nGenerated data summary:")
    print(f"- {len(org_ids)} organizations")
    print(f"- {len(user_ids)} users")
    print(f"- {len(shipment_ids)} shipments")
    print(f"- {db.shipment_items.count_documents({})} shipment items")
    print(f"- {db.documents.count_documents({})} documents")
    print(f"- {db.logs.count_documents({})} activity logs")
    print(f"- {len(country_data)} countries with compliance data")
    print(f"- {db.compliance_rules.count_documents({})} compliance rules")
    
    # Print location of CSV export
    print(f"\nCSV data exported to: {os.path.abspath('export_data')}")

if __name__ == "__main__":
    generate_all_data()