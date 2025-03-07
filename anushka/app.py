

import time
import json
import pandas as pd
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import TimeoutException, NoSuchElementException, ElementClickInterceptedException

# List of destination countries to scrape
# destination_countries = [
    # "United States",
    # "United Kingdom",
    # "Canada",
    # "Australia",
    # "Germany",
    # "China",
    # "Japan",
    # "South Korea",
    # "France",
    # "Italy",
    # "Netherlands",
    # "Singapore",
    # "United Arab Emirates",
    # "Saudi Arabia",
    # "Brazil",
    # "Mexico",
    # "Russia",
    # "South Africa",
    # "Thailand",
    # "Malaysia"
# ]

destination_countries = ["India"]

# List of origin countries to scrape
origin_countries = [
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany",
    "China",
    "Japan",
    "South Korea",
    "France",
    "Italy",
    "Netherlands",
    "Singapore",
    "United Arab Emirates",
    "Saudi Arabia",
    "Brazil",
    "Mexico",
    "Russia",
    "South Africa",
    "Thailand",
    "Malaysia"
]

# Create a directory to store country-specific files
output_dir = "ups_regulations"
os.makedirs(output_dir, exist_ok=True)

# Set Chrome options
chrome_options = Options()
# chrome_options.add_argument("--headless")  # Comment this out for debugging
chrome_options.add_argument("--disable-blink-features=AutomationControlled")
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
chrome_options.add_experimental_option("useAutomationExtension", False)
chrome_options.add_argument("--window-size=1920,1080")

# Initialize WebDriver
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=chrome_options)
wait = WebDriverWait(driver, 20)

# List of irrelevant headers to filter out
irrelevant_headers = [
    "Find UPS Closest Location",
    "Service Alerts",
    "United States - English",
    "Support",
    "Shipping",
    "Tracking",
    "Products & Services",
    "The UPS Store",
    "Log In",
    "Country or Territory Regulations - Report"
]

# Function to handle cookie consent if present
def handle_cookie_consent():
    try:
        cookie_xpath = "//button[contains(@class, 'cookie') or contains(text(), 'Accept') or contains(text(), 'I agree') or contains(text(), 'Got it')]"
        cookie_button = driver.find_element(By.XPATH, cookie_xpath)
        cookie_button.click()
        print("Cookie consent handled")
        time.sleep(1)
    except:
        print("No cookie consent dialog found or already accepted")

# Function to create a filename-safe version of country names
def sanitize_filename(name):
    return name.lower().replace(" ", "_").replace(",", "").replace(".", "")

# Function to select countries and submit
def select_countries(origin, destination):
    try:
        # Wait for page to fully load
        wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
        print("Page loaded successfully")
        
        # Handle any cookie consent dialogs
        handle_cookie_consent()
        
        # Wait a moment for the page to stabilize
        time.sleep(2)
        
        # Select Origin and Destination Countries
        select_elements = driver.find_elements(By.TAG_NAME, "select")
        if len(select_elements) >= 2:
            # First dropdown (Origin Country)
            origin_select = Select(select_elements[0])
            origin_select.select_by_visible_text(origin)
            print(f"Selected origin country: {origin}")
            
            # Second dropdown (Destination Country)
            dest_select = Select(select_elements[1])
            dest_select.select_by_visible_text(destination)
            print(f"Selected destination country: {destination}")
        else:
            print(f"Error: Found only {len(select_elements)} select elements")
            return False
        
        # Wait for the page to update after country selection
        time.sleep(2)
        
        # Check all checkboxes
        checkboxes = driver.find_elements(By.XPATH, "//input[@type='checkbox']")
        for checkbox in checkboxes:
            if not checkbox.is_selected():
                try:
                    driver.execute_script("arguments[0].scrollIntoView(true);", checkbox)
                    driver.execute_script("arguments[0].click();", checkbox)
                except:
                    pass
        print(f"Checked {len(checkboxes)} checkboxes")
        
        # Click the "Show Regulations" button
        try:
            show_btn = driver.find_element(By.XPATH, "//input[@name='ShowRegulations' and @type='submit']")
            driver.execute_script("arguments[0].scrollIntoView(true);", show_btn)
            driver.execute_script("arguments[0].click();", show_btn)
            print("Clicked 'Show Regulations' button")
        except Exception as e:
            print(f"Error clicking 'Show Regulations' button: {str(e)}")
            try:
                # Try any button or input that might be the submit button
                show_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Show')] | //input[@type='submit'] | //button[@type='submit']")
                driver.execute_script("arguments[0].scrollIntoView(true);", show_btn)
                driver.execute_script("arguments[0].click();", show_btn)
                print("Clicked submit button using alternative selector")
            except:
                print("Failed to click 'Show Regulations' button")
                return False
        
        # Wait for results to load
        print("Waiting for results to load...")
        time.sleep(5)
        return True
    except Exception as e:
        print(f"Error in select_countries: {str(e)}")
        return False

# Function to check if a header is relevant
def is_relevant_header(header_text):
    # Filter out known irrelevant headers
    if header_text in irrelevant_headers:
        return False
    
    # Filter out very short headers or navigation elements
    if len(header_text) < 5:
        return False
        
    # Filter out headers that are likely navigation elements or general website elements
    nav_keywords = ["log in", "sign up", "register", "home", "contact", "about", "menu", "search", 
                   "support", "help", "faq", "language", "english", "español", "français"]
    
    lower_header = header_text.lower()
    for keyword in nav_keywords:
        if keyword in lower_header:
            return False
    
    return True

# Function to extract regulations data
def extract_regulations(origin, destination):
    # Initialize list to store regulation data
    regulations_data = []
    
    # Create a filename-safe version of the country pair for screenshots
    origin_safe = sanitize_filename(origin)
    dest_safe = sanitize_filename(destination)
    screenshot_filename = f"{output_dir}/{origin_safe}_to_{dest_safe}_screenshot.png"
    
    # Take a screenshot to verify the page state
    driver.save_screenshot(screenshot_filename)
    print(f"Saved screenshot to {screenshot_filename}")
    
    # Look for the main content container to narrow the search scope
    try:
        main_content = driver.find_element(By.ID, "main_content")
        search_scope = main_content
        print("Found main content container")
    except:
        search_scope = driver
        print("Using full page as search scope")
    
    # Find all heading elements - typically these would be h3 or similar tags with specific styling
    possible_headers = search_scope.find_elements(By.XPATH, "//h3 | //div[contains(@class, 'head')] | //div[contains(@style, 'background')]")
    
    print(f"Found {len(possible_headers)} possible section headers")
    
    # Loop through each potential header to find its "Show" button and extract content
    processed_headers = set()  # To avoid duplicates
    
    for header in possible_headers:
        try:
            # Get header text
            header_text = header.text.strip()
            
            # Skip if empty, too short, or already processed
            if not header_text or len(header_text) < 3 or header_text in processed_headers:
                continue
                
            # Skip irrelevant headers
            if not is_relevant_header(header_text):
                print(f"Skipping irrelevant header: {header_text}")
                continue
            
            print(f"Processing section: {header_text}")
            
            # Find the "Show" button near this header
            # First look in the header element itself
            show_button = None
            try:
                # Try to find a Show button within or near this header
                button_xpath = ".//input[@value='Show'] | .//a[contains(text(), 'Show')] | following::input[@value='Show'][1] | following::a[contains(text(), 'Show')][1]"
                show_button = header.find_element(By.XPATH, button_xpath)
            except:
                # If that fails, try to find the Show button in parent or nearby elements
                try:
                    # Try the parent row or container
                    parent = header.find_element(By.XPATH, "./..")
                    show_button = parent.find_element(By.XPATH, ".//input[@value='Show'] | .//a[contains(text(), 'Show')]")
                except:
                    print(f"No Show button found for section: {header_text}")
            
            # If we found a Show button, click it
            if show_button:
                print(f"Found Show button for: {header_text}")
                driver.execute_script("arguments[0].scrollIntoView(true);", show_button)
                time.sleep(1)  # Give the page time to scroll
                driver.execute_script("arguments[0].click();", show_button)
                time.sleep(2)  # Wait for section to expand
                
            # Get the content after clicking Show
            content_text = ""
            try:
                # Try various paths to find the content relative to this header
                content_paths = [
                    "following-sibling::div[1]",  # Next div after header
                    "following::div[contains(@class, 'Content')][1]",  # Div with "Content" in class
                    "../following-sibling::div[1]",  # Sibling of parent
                    "..//div[contains(@class, 'Content')]",  # Child of parent with "Content" in class
                    "../..//div[contains(@id, 'Content')]"  # Grandchild with "Content" in id
                ]
                
                for path in content_paths:
                    try:
                        content_element = header.find_element(By.XPATH, path)
                        potential_content = content_element.text.strip()
                        if potential_content and len(potential_content) > len(content_text):
                            content_text = potential_content
                    except:
                        continue
            except Exception as content_error:
                print(f"Error getting content for {header_text}: {str(content_error)}")
            
            # Only add non-duplicate sections with meaningful headers and content
            if header_text and header_text not in processed_headers and content_text:
                processed_headers.add(header_text)
                regulations_data.append({
                    "Section": header_text,
                    "Content": content_text
                })
                print(f"Added section '{header_text}' with {len(content_text)} chars of content")
        
        except Exception as e:
            print(f"Error processing a header: {str(e)}")
    
    # If we still didn't find much, try an alternative approach focusing on the main content area
    if len(regulations_data) < 3:
        print("Trying fallback approach...")
        
        try:
            # First try to find the main content area that contains the regulations
            content_containers = driver.find_elements(By.XPATH, "//div[contains(@class, 'content')] | //div[@id='content'] | //div[@id='main_content']")
            
            for container in content_containers:
                # Look for h3 or header-like elements within this container
                headers = container.find_elements(By.XPATH, ".//h3 | .//div[contains(@class, 'header')] | .//div[contains(@class, 'title')]")
                
                for header in headers:
                    section_title = header.text.strip()
                    
                    # Apply the same filtering as before
                    if not section_title or section_title in processed_headers or not is_relevant_header(section_title):
                        continue
                    
                    print(f"Fallback: Processing section: {section_title}")
                    
                    # Try to find and click Show button
                    try:
                        show_button = container.find_element(By.XPATH, f".//h3[contains(text(), '{section_title}')]/following::input[@value='Show'][1] | .//h3[contains(text(), '{section_title}')]/following::a[contains(text(), 'Show')][1]")
                        driver.execute_script("arguments[0].scrollIntoView(true);", show_button)
                        time.sleep(1)
                        driver.execute_script("arguments[0].click();", show_button)
                        time.sleep(2)
                    except:
                        print(f"No Show button found for {section_title} in fallback approach")
                    
                    # Get content after attempting to click Show
                    content = ""
                    try:
                        content_div = container.find_element(By.XPATH, f".//h3[contains(text(), '{section_title}')]/following::div[1]")
                        content = content_div.text.strip()
                    except:
                        print(f"No content found for {section_title} in fallback approach")
                    
                    # Add only if we have content and it's not a duplicate
                    if section_title not in processed_headers and content:
                        processed_headers.add(section_title)
                        regulations_data.append({
                            "Section": section_title,
                            "Content": content
                        })
                        print(f"Added section '{section_title}' in fallback approach")
        
        except Exception as e:
            print(f"Error in fallback approach: {str(e)}")
    
    return regulations_data

# Function to save regulations data for a country pair
def save_country_data(origin, destination, regulations_data):
    if not regulations_data:
        print(f"No data to save for {origin} to {destination}")
        return False
    
    # Create sanitized filename versions of the country names
    origin_safe = sanitize_filename(origin)
    dest_safe = sanitize_filename(destination)
    base_filename = f"{origin_safe}_to_{dest_safe}"
    
    # Save as JSON
    json_filename = f"{output_dir}/{base_filename}.json"
    with open(json_filename, "w", encoding="utf-8") as f:
        json.dump(regulations_data, f, indent=4, ensure_ascii=False)
    
    # Save as CSV
    csv_filename = f"{output_dir}/{base_filename}.csv"
    df = pd.DataFrame(regulations_data)
    df.to_csv(csv_filename, index=False, encoding="utf-8")
    
    print(f"✅ Saved {len(regulations_data)} regulation sections for {origin} to {destination} in:")
    print(f"   - {json_filename}")
    print(f"   - {csv_filename}")
    return True

# Function to navigate back to the starting page
def navigate_to_new_regulation():
    try:
        # Look for the "Start a new regulation" link
        start_new_link_xpath = "//a[contains(text(), 'Start a new regulation')] | //a[contains(text(), 'new regulation')] | //a[contains(text(), 'New Regulation')]"
        start_new_link = driver.find_element(By.XPATH, start_new_link_xpath)
        
        print("Found 'Start a new regulation' link")
        driver.execute_script("arguments[0].scrollIntoView(true);", start_new_link)
        time.sleep(1)
        driver.execute_script("arguments[0].click();", start_new_link)
        
        print("Clicked 'Start a new regulation' link")
        time.sleep(3)  # Wait for the page to load
        return True
    except Exception as e:
        print(f"Error finding 'Start a new regulation' link: {str(e)}")
        
        # Try an alternative approach - go back to the main page
        try:
            main_url = "https://www.ups.com/ga/CountryRegs?loc=en_US"
            print(f"Navigating back to main page: {main_url}")
            driver.get(main_url)
            time.sleep(3)
            return True
        except Exception as nav_error:
            print(f"Error navigating to main page: {str(nav_error)}")
            return False

try:
    # Main URL
    url = "https://www.ups.com/ga/CountryRegs?loc=en_US"
    
    # Create a summary file to track which country pairs were processed
    summary_data = []
    
    # Process each origin-destination pair
    total_pairs = len(origin_countries) * len(destination_countries)
    pair_counter = 0
    
    # First loop for origin countries
    for origin_idx, current_origin in enumerate(origin_countries):
        # Second loop for destination countries
        for dest_idx, current_destination in enumerate(destination_countries):
            pair_counter += 1
            
            print(f"\n{'='*50}")
            print(f"Processing pair {pair_counter}/{total_pairs}: {current_origin} to {current_destination}")
            print(f"{'='*50}\n")
            
            # First iteration or if navigation to new regulation fails, go to the main URL
            if pair_counter == 1 or not navigate_success:
                driver.get(url)
                time.sleep(3)
            
            # Select countries and submit the form
            selection_success = select_countries(current_origin, current_destination)
            
            if selection_success:
                # Extract regulations data
                regulations_data = extract_regulations(current_origin, current_destination)
                
                # Save data for this country pair
                if regulations_data:
                    save_success = save_country_data(current_origin, current_destination, regulations_data)
                    if save_success:
                        # Add to summary
                        summary_data.append({
                            "Origin": current_origin,
                            "Destination": current_destination,
                            "Sections_Extracted": len(regulations_data),
                            "Status": "Success"
                        })
                else:
                    print(f"❌ No regulation data was found for {current_origin} to {current_destination}")
                    
                    # Save the page source for debugging
                    origin_safe = sanitize_filename(current_origin)
                    dest_safe = sanitize_filename(current_destination)
                    debug_filename = f"{output_dir}/{origin_safe}_to_{dest_safe}_debug.html"
                    with open(debug_filename, "w", encoding="utf-8") as f:
                        f.write(driver.page_source)
                    print(f"Page source saved for debugging: {debug_filename}")
                    
                    # Add to summary
                    summary_data.append({
                        "Origin": current_origin,
                        "Destination": current_destination,
                        "Sections_Extracted": 0,
                        "Status": "Failed - No data found"
                    })
                
                # Navigate back to start a new regulation
                navigate_success = navigate_to_new_regulation()
            else:
                print(f"❌ Failed to select countries for {current_origin} to {current_destination}")
                # Add to summary
                summary_data.append({
                    "Origin": current_origin,
                    "Destination": current_destination,
                    "Sections_Extracted": 0,
                    "Status": "Failed - Could not select countries"
                })
                navigate_success = False
    
    # Save the summary report
    if summary_data:
        summary_filename = f"{output_dir}/summary_report.csv"
        summary_df = pd.DataFrame(summary_data)
        summary_df.to_csv(summary_filename, index=False, encoding="utf-8")
        
        print(f"\n✅ Summary report saved to {summary_filename}")
        print("\nProcessing Summary:")
        for item in summary_data:
            status_symbol = "✅" if item["Status"].startswith("Success") else "❌"
            print(f"{status_symbol} {item['Origin']} to {item['Destination']}: {item['Sections_Extracted']} sections - {item['Status']}")
    else:
        print("\n❌ No country pairs were processed")

except Exception as e:
    print(f"An error occurred in the main process: {str(e)}")
    error_screenshot = f"{output_dir}/error_screenshot.png"
    driver.save_screenshot(error_screenshot)
    print(f"Error screenshot saved as {error_screenshot}")
    
    # Save the page source for debugging
    error_page = f"{output_dir}/error_page_source.html"
    with open(error_page, "w", encoding="utf-8") as f:
        f.write(driver.page_source)
    print(f"Error page source saved for debugging: {error_page}")

finally:
    # Close WebDriver
    driver.quit()
