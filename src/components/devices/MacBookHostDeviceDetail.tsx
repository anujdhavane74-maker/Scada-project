/**
 * MacBook Air M5 / Host Monitored Device Detail View
 * Backward-compatible wrapper delegating to LocalHostDeviceDetail.
 */

import React from 'react';
import { LocalHostDeviceDetail } from './LocalHostDeviceDetail';

export const MacBookHostDeviceDetail: React.FC = () => {
  return <LocalHostDeviceDetail />;
};
