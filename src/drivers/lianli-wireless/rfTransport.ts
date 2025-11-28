import {
  type Device,
  type InEndpoint,
  type OutEndpoint,
  usb,
} from 'usb';
import type { LianLiWirelessControllerInfo } from './controllerDiscovery';

export class LianLiWirelessRfTransport {
  private readonly info: LianLiWirelessControllerInfo;

  private txDevice: Device | null = null;
  private rxDevice: Device | null = null;

  private outEndpoint: OutEndpoint | null = null; // TX side
  private inEndpoint: InEndpoint | null = null; // RX side

  constructor(info: LianLiWirelessControllerInfo) {
    this.info = info;
  }

  open(): void {
    if (this.txDevice || this.rxDevice) return;

    // Helper to find a device by bus+address
    const findByRef = (
      ref: { busNumber: number; deviceAddress: number } | undefined,
    ): Device | null => {
      if (!ref) return null;
      const dev = usb.getDeviceList().find(d =>
        d.busNumber === ref.busNumber
        && d.deviceAddress === ref.deviceAddress,
      );

      return dev ?? null;
    };

    if (this.info.tx) {
      const dev = findByRef(this.info.tx);

      if (!dev) {
        throw new Error('L-Wireless TX device not found on USB bus');
      }

      dev.open();
      this.txDevice = dev;

      // TODO: choose & claim correct interface for TX,
      // then select the correct OUT endpoint.
      // For now just grab the first OUT endpoint
      if (dev.interfaces && dev.interfaces.length > 0) {
        const iface = dev.interfaces[0];

        iface.claim();
        const outEp = iface.endpoints.find(
          ep => ep.direction === 'out',
        ) as OutEndpoint | undefined;

        if (!outEp) {
          throw new Error('No OUT endpoint found on L-Wireless TX device');
        }
        this.outEndpoint = outEp;
      }
    }

    if (this.info.rx) {
      const dev = findByRef(this.info.rx);

      if (!dev) {
        throw new Error('L-Wireless RX device not found on USB bus');
      }

      dev.open();
      this.rxDevice = dev;

      // TODO: choose & claim correct interface for RX,
      // then select the correct IN endpoint.
      if (dev.interfaces && dev.interfaces.length > 0) {
        const iface = dev.interfaces[0];

        iface.claim();
        const inEp = iface.endpoints.find(
          ep => ep.direction === 'in',
        ) as InEndpoint | undefined;

        if (!inEp) {
          throw new Error('No IN endpoint found on L-Wireless RX device');
        }
        this.inEndpoint = inEp;
      }
    }
  }

  close(): void {
    if (this.txDevice) {
      try {
        this.txDevice.close();
      } catch {
        // ignore
      }
      this.txDevice = null;
    }
    if (this.rxDevice) {
      try {
        this.rxDevice.close();
      } catch {
        // ignore
      }
      this.rxDevice = null;
    }
    this.outEndpoint = null;
    this.inEndpoint = null;
  }

  /**
   * Send a raw RF frame via the transmitter OUT endpoint.
   * You will later adapt this to the exact frame format from uwscli.
   */
  sendFrame(frame: Buffer): Promise<void> {
    if (!this.outEndpoint) {
      return Promise.reject(
        new Error('TX OUT endpoint not initialized; call open() first'),
      );
    }

    return new Promise((resolve, reject) => {
      this.outEndpoint!.transfer(frame, err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  /**
   * Receive a raw RF frame from the receiver IN endpoint.
   * timeoutMs: how long to wait (ms) before resolving with null.
   */
  receiveFrame(timeoutMs = 100): Promise<Buffer | null> {
    if (!this.inEndpoint) {
      return Promise.reject(
        new Error('RX IN endpoint not initialized; call open() first'),
      );
    }

    return new Promise((resolve, reject) => {
      const ep = this.inEndpoint!;
      let resolved = false;

      const onData = (data: Buffer) => {
        if (resolved) return;
        resolved = true;
        ep.removeListener('error', onError);
        resolve(data);
      };

      const onError = (err: Error) => {
        if (resolved) return;
        resolved = true;
        ep.removeListener('data', onData);
        reject(err);
      };

      ep.once('data', onData);
      ep.once('error', onError);

      // Kick off a transfer; for interrupt/bulk endpoints this starts polling.
      ep.startPoll();

      if (timeoutMs > 0) {
        setTimeout(() => {
          if (resolved) return;
          resolved = true;
          ep.removeListener('data', onData);
          ep.removeListener('error', onError);
          // we intentionally do not stop polling here; you might want
          // to manage polling differently once you port the full protocol
          resolve(null);
        }, timeoutMs);
      }
    });
  }
}
