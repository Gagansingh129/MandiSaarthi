import { useState, useEffect } from 'react';
import {
  fetchCommodities,
  fetchDistricts,
  fetchLatest,
  fetchHistory,
} from '../api/mandiApi';

/**
 * Hook to fetch available commodities.
 * Returns { commodities, loading, error }
 */
export function useCommodities() {
  const [commodities, setCommodities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCommodities()
      .then((data) => {
        if (!cancelled) {
          setCommodities(data.commodities || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load commodities');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  return { commodities, loading, error };
}

/**
 * Hook to fetch districts for a given commodity.
 * Returns { districts, loading, error }
 */
export function useDistricts(commodity) {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!commodity) {
      setDistricts([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchDistricts(commodity)
      .then((data) => {
        if (!cancelled) {
          setDistricts(data.districts || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load districts');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [commodity]);

  return { districts, loading, error };
}

/**
 * Hook to fetch latest prices for a commodity + district + state combo.
 * Returns { data, loading, error }
 */
export function useLatestPrices(commodity, district, state) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!commodity || !district || !state) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchLatest(commodity, district, state)
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load prices');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [commodity, district, state]);

  return { data, loading, error };
}

/**
 * Hook to fetch price history for a commodity + mandi.
 * Returns { history, loading, error }
 */
export function useHistory(commodity, mandi, days = 7) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!commodity || !mandi) {
      setHistory([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchHistory(commodity, mandi, days)
      .then((json) => {
        if (!cancelled) {
          setHistory(json.history || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load history');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [commodity, mandi, days]);

  return { history, loading, error };
}
