# How to Get Your Paystack API Keys

To process payments with Paystack, you need API keys. These keys allow our platform (PHYZIQ) to talk to Paystack securely. Here is a simple, step-by-step guide on how to get them.

### Step 1: Create a Paystack Account
1. Go to the [Paystack website](https://paystack.com/).
2. Click on **"Create free account"**.
3. Fill in your details (business name, country, email address, and password).
4. Verify your email address by clicking the link Paystack sends you.

### Step 2: Find Your Test API Keys
When you first log in, your account will be in **Test Mode**. This is perfect for us right now, as it allows us to test the payment system without using real money.
1. Look at the left side of your Paystack dashboard and click on **Settings** (usually at the bottom of the menu).
2. In the Settings menu, click on the **API Keys & Webhooks** tab.
3. Here, you will see two "Test" keys:
   - **Test Secret Key** (starts with `sk_test_...`)
   - **Test Public Key** (starts with `pk_test_...`)

### Step 3: Add the Keys to the Project
Once you have those keys, we need to add them to our environment variables file (`apps/api/.env`).
1. Open the `.env` file in the `apps/api` folder.
2. Add the following lines, replacing the placeholder text with your actual keys:
   ```env
   PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
   PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
   ```

### Next Steps for Webhooks (Optional for now)
Later, when we want Paystack to automatically tell our system that a payment was successful (this is called a "Webhook"), you will put our server's URL in that same **API Keys & Webhooks** page under the "Test Webhook URL" field. 

For now, just getting the Secret and Public keys is all we need to get started!
