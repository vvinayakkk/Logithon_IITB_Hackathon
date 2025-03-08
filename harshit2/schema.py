from pymongo import MongoClient
from bson import ObjectId

client = MongoClient("mongodb://localhost:27017/")
db = client["complianceDB"]

# User Schema
user_schema = {
    "user_id": ObjectId,
    "name": str,
    "email": str,
    "phone": str,
    "role": {"type": str, "enum": ["Admin", "Compliance Officer", "User"]},
    "organization_id": ObjectId,
    "password_hash": str,
    "is_active": bool,
    "created_at": {"type": "datetime"},
    "updated_at": {"type": "datetime"}
}
db.create_collection("users")

# Organization Schema
organization_schema = {
    "organization_id": ObjectId,
    "name": str,
    "address": str,
    "country": str,
    "tax_id": str,
    "contact_email": str,
    "contact_phone": str,
    "created_at": {"type": "datetime"},
    "updated_at": {"type": "datetime"}
}
db.create_collection("organizations")

# Shipment Schema
shipment_schema = {
    "shipment_id": ObjectId,
    "user_id": ObjectId,
    "organization_id": ObjectId,
    "shipment_date": {"type": "datetime"},
    "sender_name": str,
    "sender_address": str,
    "sender_country": str,
    "recipient_name": str,
    "recipient_address": str,
    "recipient_country": str,
    "total_value": float,
    "currency": str,
    "total_weight": float,
    "shipment_method": {"type": str, "enum": ["Air", "Sea", "Land"]},
    "tracking_number": str,
    "carrier": str,
    "status": {"type": str, "enum": ["Pending", "Flagged", "Compliant", "Rejected", "In Transit", "Delivered"]},
    "compliance_notes": str,
    "created_at": {"type": "datetime"},
    "updated_at": {"type": "datetime"}
}
db.create_collection("shipments")

# Shipment Items Schema
shipment_item_schema = {
    "item_id": ObjectId,
    "shipment_id": ObjectId,
    "description": str,
    "hs_code": str,
    "quantity": int,
    "unit_value": float,
    "total_value": float,
    "weight": float,
    "restricted": bool,
    "clearance_required": bool,
    "origin_country": str,
    "destination_country": str,
    "created_at": {"type": "datetime"},
    "updated_at": {"type": "datetime"}
}
db.create_collection("shipment_items")

# Compliance Rules Schema
compliance_rule_schema = {
    "rule_id": ObjectId,
    "rule_name": str,
    "description": str,
    "condition": str,
    "affected_countries": list,
    "required_documents": list,
    "restricted_items": list,
    "value_thresholds": dict,
    "action": {"type": str, "enum": ["Flag", "Reject", "Warn"]},
    "created_at": {"type": "datetime"},
    "updated_at": {"type": "datetime"}
}
db.create_collection("compliance_rules")

# Documents Schema
document_schema = {
    "document_id": ObjectId,
    "shipment_id": ObjectId,
    "document_name": str,
    "document_type": {"type": str, "enum": ["Invoice", "Packing List", "Certificate of Origin", "Customs Declaration", "Bill of Lading", "Export License", "Insurance Certificate"]},
    "file_url": str,
    "status": {"type": str, "enum": ["Pending", "Verified", "Rejected"]},
    "verified_by": ObjectId,
    "verified_at": {"type": "datetime"},
    "created_at": {"type": "datetime"},
    "updated_at": {"type": "datetime"}
}
db.create_collection("documents")

# Country-Specific Compliance Schema
country_compliance_schema = {
    "country_code": str,
    "required_documents": list,
    "restricted_items": list,
    "value_thresholds": dict,
    "special_requirements": str,
    "tax_rates": dict,
    "tariffs": dict,
    "prohibited_items": list,
    "created_at": {"type": "datetime"},
    "updated_at": {"type": "datetime"}
}
db.create_collection("country_compliance")

# Logs Schema
log_schema = {
    "log_id": ObjectId,
    "user_id": ObjectId,
    "action": str,
    "details": str,
    "timestamp": {"type": "datetime"}
}
db.create_collection("logs")
