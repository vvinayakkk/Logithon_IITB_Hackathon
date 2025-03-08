import requests
import json

BASE_URL = "http://localhost:6002"

def test_add_rules():
    """Test adding rules to the system."""
    print("\n--- Testing Adding Rules ---")
    
    # Rule 1: US to EU
    rules = [
    {
        "id": 1,
        "source": "India",
        "destination": "United States",
        "rule": "All textile products must include country of origin labeling, fabric composition details, and RN number for US imports."
    },
    {
        "id": 2,
        "source": "India",
        "destination": "United States",
        "rule": "Wooden handicrafts must be treated for pests and include a phytosanitary certificate."
    },
    {
        "id": 3,
        "source": "India",
        "destination": "United States",
        "rule": "Food products require FDA prior notice and must comply with US labeling requirements listing all ingredients and allergens."
    },
    {
        "id": 4,
        "source": "China",
        "destination": "European Union",
        "rule": "Electronic products must have CE marking and comply with RoHS directive limiting hazardous substances."
    },
    {
        "id": 5,
        "source": "China",
        "destination": "European Union",
        "rule": "Toys must comply with EN71 safety standards and carry appropriate warning labels."
    },
    {
        "id": 6,
        "source": "United States",
        "destination": "Japan",
        "rule": "Cosmetic products must list all ingredients in Japanese and be registered with the Ministry of Health, Labour and Welfare."
    },
    {
        "id": 7,
        "source": "United States",
        "destination": "Japan",
        "rule": "Medical devices require pre-market approval from the Pharmaceuticals and Medical Devices Agency (PMDA)."
    },
    {
        "id": 8,
        "source": "Brazil",
        "destination": "United States",
        "rule": "Leather goods must be clearly marked with country of origin and comply with USDA regulations."
    },
    {
        "id": 9,
        "source": "Germany",
        "destination": "United Arab Emirates",
        "rule": "All meat products must be halal certified and include certificates of origin and health."
    },
    {
        "id": 10,
        "source": "Australia",
        "destination": "China",
        "rule": "Wine exports must have certificates of origin, analysis, and Chinese import labeling."
    }
    ]
    
    # Add rules
    for rule in rules:
        response = requests.post(f"{BASE_URL}/api/rules", json=rule)
        data = response.json()
        print(f"Added rule for {rule['source']} to {rule['destination']}: {response.status_code}")
        print(f"Response: {json.dumps(data, indent=2)}")

# def test_get_rules():
#     """Test retrieving rules."""
#     print("\n--- Testing Getting Rules ---")
    
#     # Get all rules
#     response = requests.get(f"{BASE_URL}/api/rules")
#     data = response.json()
#     print("All rules:")
#     print(json.dumps(data, indent=2))
    
#     # Get rules for specific route
#     response = requests.get(f"{BASE_URL}/api/rules/US/DE")
#     data = response.json()
#     print("\nRules for US to DE:")
#     print(json.dumps(data, indent=2))

# def test_check_compliance():
#     """Test checking compliance for a shipment."""
#     print("\n--- Testing Compliance Check ---")
    
#     # Create test shipment
#     shipment = {
#         "shipment_details": {
#             "senderName": "John Smith",
#             "senderCountry": "US",
#             "senderAddress": "123 Main St, New York, NY",
#             "recipientName": "Klaus Mueller",
#             "recipientCountry": "DE",
#             "recipientAddress": "456 Berlin Ave, Berlin",
#             "shipmentDate": "2025-03-10",
#             "shipmentMethod": "Air",
#             "currency": "USD",
#             "carrier": "FedEx",
#             "trackingNumber": "FX123456789",
#             "totalWeight": 25.5,
#             "shipmentItems": [
#                 {
#                     "description": "Electronics - Laptop computers",
#                     "hsCode": "8471.30.0100",
#                     "quantity": 5,
#                     "unitValue": 1200,
#                     "totalValue": 6000,
#                     "weight": 20,
#                     "restricted": False,
#                     "clearanceRequired": False,
#                     "originCountry": "US",
#                     "destinationCountry": "DE"
#                 }
#             ],
#             "documents": {
#                 "invoice": True,
#                 "packingList": True,
#                 "originCert": False,
#                 "customsDeclaration": True,
#                 "billLading": False,
#                 "exportLicense": False
#             },
#             "complianceNotes": "Business shipment for company branch office"
#         }
#     }
    
#     # Check compliance
#     # Check compliance
#     response = requests.post(f"{BASE_URL}/api/check_compliance", json=shipment)
#     data = response.json()
#     print("Compliance Check Results:")
#     print(json.dumps(data, indent=2))

# def test_update_rule():
#     """Test updating an existing rule."""
#     print("\n--- Testing Updating Rule ---")
    
#     # First, get all rules to find the ID of a rule to update
#     response = requests.get(f"{BASE_URL}/api/rules")
#     rules = response.json()
    
#     if rules and len(rules) > 0:
#         # Get the ID of the first rule
#         rule_id = rules[0]["id"]
        
#         # Update rule
#         updated_rule = {
#             "rule": "Updated rule: All electronics shipments must include detailed component lists, MSDS for batteries, and RoHS compliance documentation."
#         }
        
#         response = requests.put(f"{BASE_URL}/api/rules/{rule_id}", json=updated_rule)
#         data = response.json()
#         print(f"Updated rule with ID {rule_id}: {response.status_code}")
#         print(f"Response: {json.dumps(data, indent=2)}")
#     else:
#         print("No rules found to update")

# def test_delete_rule():
#     """Test deleting a rule."""
#     print("\n--- Testing Deleting Rule ---")
    
#     # First, get all rules to find the ID of a rule to delete
#     response = requests.get(f"{BASE_URL}/api/rules")
#     rules = response.json()
    
#     if rules and len(rules) > 0:
#         # Get the ID of the last rule
#         rule_id = rules[-1]["id"]
        
#         # Delete rule
#         response = requests.delete(f"{BASE_URL}/api/rules/{rule_id}")
#         print(f"Deleted rule with ID {rule_id}: {response.status_code}")
        
#         # Verify deletion
#         response = requests.get(f"{BASE_URL}/api/rules")
#         updated_rules = response.json()
#         print(f"Number of rules after deletion: {len(updated_rules)}")
#     else:
#         print("No rules found to delete")

def run_all_tests():
    """Run all test functions."""
    test_add_rules()
    # test_get_rules()
    # test_check_compliance()
    # test_update_rule()
    # test_delete_rule()

if __name__ == "__main__":
    run_all_tests()