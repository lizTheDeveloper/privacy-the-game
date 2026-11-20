// Loads the broker map and its build-time layout. Relative URLs, so the service worker caches them.
// Nothing here goes in a URL or an event; a failure is reported once, with no broker detail.
import { captureError } from './errors.js';

let promise = null;
let status = 'idle';
let data = null;

export function loadBrokerData(fetchImpl = fetch) {
  if (promise) return promise;
  status = 'loading';
  const get = async (url) => {
    const res = await fetchImpl(url);
    if (!res.ok) throw new Error(`broker data ${url}: ${res.status}`);
    return res.json();
  };
  const p = Promise.all([get('data/broker-map.json'), get('data/broker-layout.json')]).then(
    ([map, layout]) => {
      data = { map, layout };
      status = 'ready';
      return data;
    },
    (error) => {
      status = 'error';
      data = null;
      if (promise === p) promise = null;
      captureError(error, { screen: 'broker-map' });
      throw error;
    },
  );
  promise = p;
  return p;
}

export const brokerDataStatus = () => status;
export const brokerData = () => data;

export function resetBrokerData() {
  promise = null;
  status = 'idle';
  data = null;
}
