// What you can do about a badge (Liz 2026-11-20, "Do it"): the missions a leak page, PRISM and the
// government map end with. Two sources, in this order:
// - a leak's own `missions` (in its group file), chosen by reading its summary, data and sources:
//   only a mission whose subject is the leak's company, its data or its broker (never one that
//   claims to undo the program);
// - then ACCOUNT_MISSIONS for each of the leak's `accounts`: the one mission in this city about what
//   that company keeps, shares or sells.
// components/what-you-can-do.js keeps the ones in play, the player's undone ones first, up to 3.

// One mission per account: its privacy review or its data opt-out. An account with no mission about
// its data (OneDrive, iCloud Drive) is left out rather than given a near miss.
export const ACCOUNT_MISSIONS = Object.freeze({
  gmail: 'gmail-reclaim-privacy',
  google: 'google-reclaim-privacy',
  yahoo: 'yahoo-reclaim-privacy',
  outlook: 'outlook-reclaim-privacy',
  microsoft: 'microsoft-reclaim-privacy',
  icloud: 'icloud-reclaim-privacy',
  apple_id: 'apple_id-reclaim-privacy',
  facebook: 'facebook-reclaim-privacy',
  instagram: 'instagram-reclaim-privacy',
  whatsapp: 'whatsapp-reclaim-privacy',
  twitter: 'twitter-reclaim-privacy',
  linkedin: 'linkedin-reclaim-privacy',
  amazon: 'amazon-reclaim-privacy',
  github: 'github-recon-security',
  telegram: 'telegram-recon-sessions',
  ai_microsoft: 'ai_microsoft-optout',
  ai_google: 'ai_google-optout',
  ai_meta: 'ai_meta-optout',
  ai_apple: 'ai_apple-optout',
  ai_linkedin: 'ai_linkedin-optout',
  ad_trackers: 'ad_trackers-fortify-bulk',
  location_brokers: 'location_brokers-fortify-optout',
  phone_carrier: 'phone_carrier-reclaim-ads',
  weather_app: 'weather_app-recon-location',
  fitness_trackers: 'fitness-limit-sharing',
  health_apps: 'health-apps-period-tracker-audit',
  smart_tv: 'smart_tv-recon-acr',
  smart_camera: 'smart_camera-recon-access',
  smart_network: 'smart_network-recon-router',
  voice_assistant: 'voice_assistant-recon-recordings',
  device_security: 'device_security-fortify-phone',
  car_gm: 'car_gm-optout-privacy',
  car_toyota: 'car_toyota-optout-privacy',
  car_honda: 'car_honda-optout-privacy',
  car_ford: 'car_ford-optout-privacy',
  car_hyundai: 'car_hyundai-optout-privacy',
  car_kia: 'car_kia-optout-privacy',
  car_nissan: 'car_nissan-optout-privacy',
  car_subaru: 'car_subaru-optout-privacy',
  car_tesla: 'car_tesla-optout-privacy',
  car_bmw: 'car_bmw-optout-privacy',
  car_vw: 'car_vw-optout-privacy',
  car_stellantis: 'car_stellantis-optout-privacy',
  car_broker_lexisnexis: 'car_broker_lexisnexis-optout',
  car_broker_verisk: 'car_broker_verisk-optout',
});

const list = (v) => (Array.isArray(v) ? v : []);

// A leak's candidate missions, best first, each once.
export function leakMissionIds(entry) {
  const ids = [...list(entry?.missions), ...list(entry?.accounts).map((id) => ACCOUNT_MISSIONS[id]).filter(Boolean)];
  return [...new Set(ids)];
}

// The government map (#/government): what reaches an agency without a warrant, and what the player
// can cut off. Its "Buying your data" pipe and "Your apps" origin are the location brokers.
export const GOV_MISSIONS = Object.freeze(['location_brokers-fortify-optout', 'location_brokers-fortify-phone', 'smart_camera-fortify-police']);
export const GOV_BROKER_MISSION = 'location_brokers-fortify-optout';
