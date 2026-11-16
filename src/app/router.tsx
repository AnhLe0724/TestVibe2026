import { useEffect, useState } from 'react';

export type AppRoute = 'member' | 'manager';

const parseHash = (hash: string): AppRoute => {
  if (hash === '#/quan-ly') return 'manager';
  return 'member';
};

export const useHashRoute = (): AppRoute => {
  const [route, setRoute] = useState<AppRoute>(() => parseHash(window.location.hash));

  useEffect(() => {
    const normalize = (): void => {
      const current = window.location.hash;
      if (current !== '' && current !== '#/' && current !== '#/quan-ly') {
        window.location.hash = '#/';
        setRoute('member');
        return;
      }
      setRoute(parseHash(current));
    };

    normalize();
    window.addEventListener('hashchange', normalize);
    return () => window.removeEventListener('hashchange', normalize);
  }, []);

  return route;
};
