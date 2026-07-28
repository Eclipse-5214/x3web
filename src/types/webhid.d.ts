// Minimal WebHID API types. This is a Chromium-only experimental API and
// isn't part of TypeScript's standard DOM lib yet, so we declare just the
// subset this project actually uses.

interface HIDDeviceFilter {
  vendorId?: number;
  productId?: number;
  usagePage?: number;
  usage?: number;
}

interface HIDDeviceRequestOptions {
  filters: HIDDeviceFilter[];
}

interface HIDReportInfo {
  reportId?: number;
}

interface HIDCollectionInfo {
  usagePage?: number;
  usage?: number;
  featureReports?: HIDReportInfo[];
  inputReports?: HIDReportInfo[];
  outputReports?: HIDReportInfo[];
  children?: HIDCollectionInfo[];
}

interface HIDDevice extends EventTarget {
  readonly opened: boolean;
  readonly vendorId: number;
  readonly productId: number;
  readonly productName: string;
  readonly collections: HIDCollectionInfo[];
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: Uint8Array): Promise<void>;
  sendFeatureReport(reportId: number, data: Uint8Array): Promise<void>;
  receiveFeatureReport(reportId: number): Promise<DataView>;
}

interface HIDConnectionEvent extends Event {
  readonly device: HIDDevice;
}

interface HIDEventMap {
  connect: HIDConnectionEvent;
  disconnect: HIDConnectionEvent;
}

interface HID extends EventTarget {
  requestDevice(options: HIDDeviceRequestOptions): Promise<HIDDevice[]>;
  getDevices(): Promise<HIDDevice[]>;
  addEventListener<K extends keyof HIDEventMap>(
    type: K,
    listener: (this: HID, ev: HIDEventMap[K]) => void,
  ): void;
}

interface Navigator {
  readonly hid: HID;
}
