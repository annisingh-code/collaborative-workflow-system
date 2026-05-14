const axios = require('axios');

/**
 * Attempts to send a webhook payload up to 3 times.
 */
async function triggerWebhook(url, payload, retries = 3) {
  if (!url) return; // Skip if no webhook URL is configured

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await axios.post(url, payload);
      console.log(`Webhook delivered to ${url} on attempt ${attempt}`);
      return true; // Success
    } catch (error) {
      console.error(`Webhook attempt ${attempt} failed:`, error.message);
      if (attempt === retries) {
        console.error(`Webhook completely failed after ${retries} attempts.`);
        // In a production app, we would save this to a WebhookDeliveryLog model
        return false; 
      }
      // Wait 1 second before retrying (simple backoff)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

module.exports = { triggerWebhook };