/**
 * Protocol Adapter Base Definitions & Factory
 */

import { IProtocolAdapter, ProtocolConnectionStatus, ProtocolType } from '../../types/protocol';

export class ProtocolAdapterManager {
  private static instance: ProtocolAdapterManager;
  private adapters: Map<ProtocolType, IProtocolAdapter> = new Map();
  private activeProtocol: ProtocolType = 'SIMULATOR';

  private constructor() {}

  public static getInstance(): ProtocolAdapterManager {
    if (!ProtocolAdapterManager.instance) {
      ProtocolAdapterManager.instance = new ProtocolAdapterManager();
    }
    return ProtocolAdapterManager.instance;
  }

  public registerAdapter(adapter: IProtocolAdapter): void {
    this.adapters.set(adapter.protocol, adapter);
  }

  public getAdapter(protocol: ProtocolType): IProtocolAdapter | undefined {
    return this.adapters.get(protocol);
  }

  public getActiveAdapter(): IProtocolAdapter {
    const adapter = this.adapters.get(this.activeProtocol);
    if (!adapter) {
      throw new Error(`Active protocol adapter [${this.activeProtocol}] is not registered.`);
    }
    return adapter;
  }

  public setActiveProtocol(protocol: ProtocolType): void {
    if (!this.adapters.has(protocol)) {
      throw new Error(`Cannot switch to unregistered protocol: ${protocol}`);
    }
    this.activeProtocol = protocol;
  }

  public getAllStatuses(): ProtocolConnectionStatus[] {
    return Array.from(this.adapters.values()).map(a => a.getConnectionStatus());
  }
}
