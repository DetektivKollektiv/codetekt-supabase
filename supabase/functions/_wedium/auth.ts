import { timingSafeEqual } from "jsr:@std/crypto/timing-safe-equal";

const encoder = new TextEncoder();

export function isSecretValid(expected: string, incoming: string): boolean {
  const expectedBytes = encoder.encode(expected);
  const incomingBytes = encoder.encode(incoming);

  return expectedBytes.length > 0 &&
    expectedBytes.length === incomingBytes.length &&
    timingSafeEqual(expectedBytes, incomingBytes);
}
