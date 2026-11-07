// The pod a geography lands in under the published pod set. Mirrors build.sql:
// city, then region, then country, then whichever pod holds the rest of the world.
// Names match the way build.sql groups them, by slug (rc_slug), so "St Louis"
// and "St. Louis" are one city; build.sql publishes one spelling (min(city)).

// build.sql's pg_temp.rc_slug: lower case, every run of other characters one '-', no '-' at the ends.
export function slug(t) {
  return String(t ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const clean = (t) => String(t ?? '').trim();

// build.sql's city_id: the region (or the country when there is none) and the city, slugged.
function cityKey(country, region, city) {
  return slug(`${region || country}-${city}`);
}

export function podForGeo(pods, { country, region, city } = {}) {
  if (!Array.isArray(pods) || pods.length === 0) return null;
  const c = clean(country).toUpperCase();
  const r = clean(region);
  const town = clean(city);
  const key = town && c ? cityKey(c, r, town) : null;
  return (
    (key && pods.find((p) => p.level === 'city' && cityKey(clean(p.country).toUpperCase(), clean(p.region), clean(p.city)) === key)) ||
    (r && pods.find((p) => p.level === 'region' && clean(p.country).toUpperCase() === c && slug(p.region) === slug(r))) ||
    (c && pods.find((p) => p.level === 'country' && p.country === c)) ||
    pods.find((p) => p.level === 'world' || p.includesWorld) ||
    null
  );
}
