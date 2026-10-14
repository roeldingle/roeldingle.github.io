
import { useEffect, useState } from 'react';
import AdminLogin from './admin/AdminLogin';
import App from './App';

export default function Root() {
  const [isAdminRoute, setIsAdminRoute] = useState(
    () => window.location.hash.replace(/\/+$/, '') === '#/admin'
  );

  useEffect(() => {
    function handleHashChange() {
      setIsAdminRoute(
        window.location.hash.replace(/\/+$/, '') === '#/admin'
      );
    }

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return isAdminRoute ? <AdminLogin /> : <App />;
}
