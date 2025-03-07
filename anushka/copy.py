import os
import json

# Define the folder path where your JSON files are located
folder_path = r"C:/Users/vinay/OneDrive/Desktop/logithonn/iitb/anushka/ups_regulations"  # Update this with your folder path

# Define the reference JSON file (china_to_india.json)
reference_file = "china_to_india.json"

# Step 1: Read the reference JSON file to get the SECTION -> Info About Section Header mapping
reference_path = os.path.join(folder_path, reference_file)
with open(reference_path, 'r', encoding='utf-8') as f:
    reference_data = json.load(f)

# Create a dictionary to store SECTION -> Info About Section Header mappings
section_info_map = {}
for section in reference_data:
    if "Section" in section and "Info About Section Header" in section:
        section_name = section["Section"]
        info = section["Info About Section Header"]
        section_info_map[section_name] = info

# Step 2: Iterate through all JSON files in the folder, excluding the reference file
for filename in os.listdir(folder_path):
    if filename.endswith(".json") and filename != reference_file:
        file_path = os.path.join(folder_path, filename)
        
        # Read the current JSON file
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Step 3: Update each section in the current JSON file
        updated = False
        for section in data:
            if "Section" in section:
                section_name = section["Section"]
                # If the SECTION matches one in the reference file, update/add the Info About Section Header
                if section_name in section_info_map:
                    section["Info About Section Header"] = section_info_map[section_name]
                    updated = True
        
        # Step 4: If any updates were made, write the updated data back to the file
        if updated:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4)
            print(f"Updated {filename} with Info About Section Headers.")
        else:
            print(f"No updates needed for {filename}.")

print("Processing complete!")