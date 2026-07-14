import { useCallback, useEffect, useRef, useState } from 'react';

export function useAsync(loader, key = '') {
  const loaderRef = useRef(loader);
  useEffect(() => { loaderRef.current = loader; }, [loader]);
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const reload = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const data = await loaderRef.current();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      setState({ data: null, loading: false, error: error.response?.data?.message || error.message });
      return null;
    }
  }, []);
  useEffect(() => {
    // Side effect chủ đích: tải lại khi định danh resource thay đổi.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [key, reload]);
  return { ...state, reload };
}
