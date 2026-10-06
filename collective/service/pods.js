// The pod a geography lands in under the published pod set. Mirrors build.sql:
// city, then region, then country, then whichever pod holds the rest of the world.
export function podForGeo(pods, { country, region, city } = {}) {
  if (!Array.isArray(pods) || pods.length === 0) return null;
  const c = (country || '').toUpperCase();
  return (
    (city && pods.find((p) => p.level === 'city' && p.country === c && (p.region || '') === (region || '') && p.city === city)) ||
    (region && pods.find((p) => p.level === 'region' && p.region === region)) ||
    (c && pods.find((p) => p.level === 'country' && p.country === c)) ||
    pods.find((p) => p.level === 'world' || p.includesWorld) ||
    null
  );
}
