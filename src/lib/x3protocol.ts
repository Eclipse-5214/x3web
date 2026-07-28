// Reverse-engineered HID protocol for the Attack Shark X3, via USB capture
// of the official Windows configurator (SET_REPORT feature reports on the
// vendor-defined interface). See project notes for capture methodology.

export const VENDOR_ID = 0x1d57;
export const PRODUCT_ID_WIRELESS = 0xfa60;
export const PRODUCT_ID_WIRED = 0xfa61;
export const PRODUCT_IDS = [PRODUCT_ID_WIRELESS, PRODUCT_ID_WIRED];

export const DPI_STAGE_REPORT_ID = 4;
export const POLLING_RATE_REPORT_ID = 6;

export const DPI_PRESET_STAGES: number[] = [800, 1600, 2400, 3200, 5000, 26000];

export const POLLING_RATES: Record<number, number> = { 1000: 0x01, 500: 0x02, 250: 0x04, 125: 0x08 };

export const DPI_STEP = 50; // mouse only accepts DPI in increments of 50
export const DPI_MIN = 50;
// Custom value is a 16-bit (DPI/50 - 1), split as low byte (13) + high byte
// at 21. byte21 = 0x02 is ALSO the "use firmware preset table" sentinel,
// colliding with what would otherwise be a valid high byte of 2 (raw >= 512,
// DPI >= 25650). We only have one confirmed data point past the 1-byte
// range (high byte = 1, DPI 23750) — the mirrored high byte at offset 50
// (0x0E + highByte) held there, but a later test at the collision boundary
// (high byte = 2, DPI 25950, sent by the official app) did NOT show that
// offset-50 shift, so that part of the model is unconfirmed/inconsistent
// above high byte 1, and it's unknown whether the mouse actually honors a
// custom value once byte21 == 0x02 or silently falls back to the preset.
// Custom values are capped below the collision point to stay in the one
// range (high byte 0 or 1) that's actually been verified end to end.
export const DPI_MAX = 25600;

// checksum = (sum(bytes[0..49]) - 0x3D) & 0xFF — note byte50 is NOT included,
// verified against 8+ captured samples including a wide (>1-byte) custom value.
function checksum(payloadWithId: Uint8Array): number {
  const sum = payloadWithId.slice(0, 50).reduce((a, b) => a + b, 0);
  return (sum - 0x3d) & 0xff;
}

interface DpiReportOptions {
  stageIndex: number;
  customDpi: number | null;
}

// Report ID 4 payload (excludes the report ID byte itself, per WebHID convention).
// customDpi: if set, activates the custom-value override for the currently
// selected stage instead of using the firmware preset table.
function buildDpiReportPayload({ stageIndex, customDpi }: DpiReportOptions): Uint8Array {
  const full = new Uint8Array(52);
  full.set(
    [
      0x04, 0x38, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x00, 0x0f, 0x1f, 0x2f, 0x3f, 0x63,
      0x07, // byte13: custom DPI value low byte, (DPI/50 - 1) & 0xFF
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x02, // byte21: 0x02 = preset stage table; otherwise the custom value's high byte
      0x00, 0x00,
      0x01, // byte24: active stage index (1-based)
      0xff, 0x00, 0x00, 0x00, 0xff, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00,
      0xff, 0xff, 0xff, 0x00, 0xff, 0xff, 0x40, 0x00, 0xff, 0xff, 0xff, 0x01,
      0x0e, // byte50: 0x0e + high byte, confirmed only for high byte 0/1 (see DPI_MAX note above)
      0x00, // byte51: checksum, computed below
    ],
  );

  full[24] = stageIndex;
  if (customDpi != null) {
    const raw = customDpi / DPI_STEP - 1;
    const highByte = (raw >> 8) & 0xff;
    full[13] = raw & 0xff;
    full[21] = highByte;
    full[50] = 0x0e + highByte;
  } else {
    full[21] = 0x02;
  }
  full[51] = checksum(full);

  return full.slice(1); // drop report ID; WebHID sendFeatureReport() takes it separately
}

export function buildDpiStagePayload(stageIndex: number): Uint8Array {
  return buildDpiReportPayload({ stageIndex, customDpi: null });
}

export function buildCustomDpiPayload(stageIndex: number, dpiValue: number): Uint8Array {
  const snapped = Math.round(dpiValue / DPI_STEP) * DPI_STEP;
  return buildDpiReportPayload({ stageIndex, customDpi: snapped });
}

export function buildPollingRatePayload(hz: number): Uint8Array {
  const value = POLLING_RATES[hz];
  if (value == null) throw new Error(`Unsupported polling rate: ${hz}Hz`);
  return new Uint8Array([0x09, 0x01, value, ~value & 0xff, 0x00, 0x00, 0x00, 0x00]);
}

// Note: the X3's vendor config interface only implements SET_REPORT, not
// GET_REPORT (receiveFeatureReport() fails on real hardware) — so current
// state can't be read back. The UI can't know which stage is active until
// this driver sends one itself.

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(' ');
}
