const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { SolapiMessageService } = require("solapi");

admin.initializeApp();

// --- CONFIGURATION ---
// It's recommended to store secrets in environment variables
// firebase functions:config:set solapi.key="YOUR_API_KEY" solapi.secret="YOUR_API_SECRET"
const cfg = (() => {
  try {
    return functions.config();
  } catch (e) {
    return {};
  }
})();
const solapiKey = process.env.SOLAPI_KEY || (cfg.solapi && cfg.solapi.key) || '';
const solapiSecret = process.env.SOLAPI_SECRET || (cfg.solapi && cfg.solapi.secret) || '';
const senderPhoneNumber = process.env.SENDER_PHONE || "01058922434"; // From your .env file

const messageService = (solapiKey && solapiSecret)
  ? new SolapiMessageService(solapiKey, solapiSecret)
  : null;

// Callable function to send SMS
exports.sendSms = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const to = data.to; // Phone number to send to
  const text = data.text; // Message content

  if (!to || !text) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with two arguments "to" and "text".'
    );
  }

  try {
    if (!messageService) {
      console.warn('SOLAPI credentials not configured; returning mocked success');
      return { success: true, result: { mocked: true } };
    }
    const result = await messageService.sendOne({
      to: to,
      from: senderPhoneNumber,
      text: text,
    });
    console.log("SMS sent successfully: ", result);
    return { success: true, result };
  } catch (error) {
    console.error("SMS sending failed: ", error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to send SMS.',
      error
    );
  }
});

// Mount HTTP API (Express) from api.js, if present
try {
  const api = require('./api');
  exports.api = api.api; // functions.https.onRequest(app)
} catch (e) {
  console.warn('api.js not found or failed to load:', e.message);
}
