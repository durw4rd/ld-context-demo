import { UAParser } from 'ua-parser-js';

// Extracts browser/OS/device details from navigator.userAgent for inclusion in the
// LD context once analytics consent is granted. Note: modern Chromium browsers
// "freeze"/reduce the User-Agent string (User-Agent Reduction), so exact minor/build
// numbers may come back generic (e.g. "124.0.0.0"). Full-precision values would
// require the async, Chromium-only Client Hints API
// (navigator.userAgentData.getHighEntropyValues()) - not used here to keep this
// synchronous and cross-browser.
export function getUAInfo() {
  if (typeof navigator === 'undefined' || !navigator.userAgent) {
    return {};
  }

  const { browser, os, engine, device, cpu } = new UAParser(navigator.userAgent).getResult();

  const info = {};
  if (browser?.name) info.browserName = browser.name;
  if (browser?.version) info.browserVersion = browser.version;
  if (os?.name) info.os = os.name;
  if (os?.version) info.osVersion = os.version;
  if (engine?.name) info.engine = engine.name;
  info.deviceType = device?.type || 'desktop';
  if (device?.vendor) info.deviceVendor = device.vendor;
  if (device?.model) info.deviceModel = device.model;
  if (cpu?.architecture) info.cpuArchitecture = cpu.architecture;

  return info;
}
