import requests
from datetime import datetime, timedelta
import pytz
import uuid
import json
from supabase import create_client

# Load API keys from json file
with open('api_keys.json', 'r') as f:
    config = json.load(f)

# Splitwise API URL
API_URL = "https://secure.splitwise.com/api/v3.0/get_expenses"

# Get common Supabase credentials
SUPABASE_URL = config['common']['supabase_url']
SUPABASE_SERVICE_KEY = config['common']['supabase_service_key']

# Initialize Supabase client with service role key
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

pst = pytz.timezone('US/Pacific')

def process_user_expenses(user_config):
    # Get user-specific credentials
    API_TOKEN = user_config['splitwise_api_token']
    USER_ID = user_config['splitwise_user_id']
    SUPABASE_USER_ID = user_config['supabase_user_id']
    CATEGORY_ID = user_config['category_id']
    SUBCATEGORY_ID = user_config['subcategory_id']

    now_utc = datetime.now(pytz.utc)
    one_hour_ago_utc = now_utc - timedelta(hours=8)

    # Format the times to match Splitwise's expected format
    now_utc_str = now_utc.strftime('%Y-%m-%dT%H:%M:%SZ')
    one_hour_ago_utc_str = one_hour_ago_utc.strftime('%Y-%m-%dT%H:%M:%SZ')

    # Define headers for authorization
    headers = {
        "Authorization": f"Bearer {API_TOKEN}"
    }

    # Define parameters for the API request
    params = {
        "dated_after": one_hour_ago_utc_str,
        "dated_before": now_utc_str,
        "limit": 50,
    }

    print(f"\nProcessing expenses for user: {user_config['name']}")

    # Fetch the expenses
    response = requests.get(API_URL, headers=headers, params=params)

    # Check for a successful response
    if response.status_code == 200:
        expenses = response.json().get('expenses', [])

        # Filter expenses where the user is involved and owe share is greater than 0
        my_expenses = []
        for expense in expenses:
            # Skip if this is a payment or settlement
            if expense.get('payment', False):
                continue
                
            for user in expense['users']:
                if user['user_id'] == int(USER_ID) and float(user['owed_share']) > 0:
                    my_expenses.append(expense)

        # Process the filtered expenses
        if my_expenses:
            print(f"Found {len(my_expenses)} expenses where you owe:")
            for expense in my_expenses:
                owed_share = next(
                    user['owed_share'] for user in expense['users'] if user['user_id'] == int(USER_ID))
                
                print(f"Description: {expense['description']}, Owe Share: {owed_share}, Date: {expense['date']}")
                
                # Convert UTC date to PST
                utc_date = datetime.strptime(expense['date'], '%Y-%m-%dT%H:%M:%SZ')
                utc_date = pytz.utc.localize(utc_date)
                pst_date = utc_date.astimezone(pst)

                # Insert into Supabase table
                insert_response = supabase.table('expenses').insert({
                    'id': str(uuid.uuid4()),
                    'user_id': SUPABASE_USER_ID,
                    'amount': owed_share,
                    'description': expense['description'],
                    'date': pst_date.strftime('%Y-%m-%dT%H:%M:%S%z'),
                    'category_id': CATEGORY_ID,
                    'subcategory_id': SUBCATEGORY_ID
                }).execute()

                if insert_response.data:
                    print(f"Successfully added expense: {expense['description']}")
                else:
                    print(f"Failed to add expense: {expense['description']}, Error: {insert_response.error}")
        
        else:
            print("No expenses where you owe.")
    else:
        print(f"Failed to fetch expenses. Status Code: {response.status_code}")

def main():
    # Process each user in the configuration
    for user in config['users']:
        process_user_expenses(user)

if __name__ == "__main__":
    main()
