import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginUser,
  registerUser,
  fetchMe,
  fetchSites,
  createSiteApi,
  deleteSiteApi,
} from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sites, setSites] = useState([]);
  const [activeSite, setActiveSiteState] = useState(null);
  const [loading, setLoading] = useState(true);

  const selectSite = useCallback((site) => {
    setActiveSiteState(site);
    if (site?.siteId) {
      localStorage.setItem('cf_active_site_id', site.siteId);
    } else {
      localStorage.removeItem('cf_active_site_id');
    }
  }, []);

  const refreshSites = useCallback(async () => {
    const data = await fetchSites();
    const list = data.sites || [];
    setSites(list);
    const savedId = localStorage.getItem('cf_active_site_id');
    const matched = list.find((s) => s.siteId === savedId) || list[0] || null;
    selectSite(matched);
    return list;
  }, [selectSite]);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('cf_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const meData = await fetchMe();
        setUser(meData.user);
        await refreshSites();
      } catch (err) {
        localStorage.removeItem('cf_token');
        localStorage.removeItem('cf_active_site_id');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [refreshSites]);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    localStorage.setItem('cf_token', data.token);
    setUser(data.user);
    await refreshSites();
    return data;
  };

  const register = async (name, email, password) => {
    const data = await registerUser(name, email, password);
    localStorage.setItem('cf_token', data.token);
    setUser(data.user);
    await refreshSites();
    return data;
  };

  const logout = () => {
    localStorage.removeItem('cf_token');
    localStorage.removeItem('cf_active_site_id');
    setUser(null);
    setSites([]);
    setActiveSiteState(null);
  };

  const createSite = async (name, domain) => {
    const data = await createSiteApi(name, domain);
    const updated = [data.site, ...sites];
    setSites(updated);
    selectSite(data.site);
    return data.site;
  };

  const deleteSite = async (siteId) => {
    await deleteSiteApi(siteId);
    const remaining = sites.filter((s) => s.siteId !== siteId);
    setSites(remaining);
    if (activeSite?.siteId === siteId) {
      selectSite(remaining[0] || null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sites,
        activeSite,
        loading,
        login,
        register,
        logout,
        refreshSites,
        createSite,
        deleteSite,
        setActiveSite: selectSite,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
