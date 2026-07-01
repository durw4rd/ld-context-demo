import { createContext, useContext } from 'react';

export const LDReinitContext = createContext(() => {
  console.warn('useLDReinit() called outside of <LDRoot>');
});

export const LDActiveModeContext = createContext('essential');

export function useLDReinit() {
  return useContext(LDReinitContext);
}

// The mode the currently-mounted LD client generation was actually built for.
// Read this (rather than a ref inside the remounted subtree) to decide whether a
// reinit is still needed, since the whole provider subtree remounts on reinit.
export function useLDActiveMode() {
  return useContext(LDActiveModeContext);
}
