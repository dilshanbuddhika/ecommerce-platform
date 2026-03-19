// ============================================
// STRIPE CONFIGURATION
// ============================================
import Stripe from 'stripe';

let stripe = null;

// Stripe API key තියෙනවනම් initialize කරන්න
if (
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_secret_key_here'
) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
  console.log('✅ Stripe configured'.green);
} else {
  console.log('⚠️  Stripe not configured (no API key). Using test mode.'.yellow);
}

export default stripe;