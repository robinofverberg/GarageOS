import { describe, expect, it } from "vitest";
import {
  displayMileage,
  inputMileageToKm,
  kmToMiles,
  milesToKm,
} from "@/lib/units";

describe("unit conversions", () => {
  it("converts kilometers and miles with GarageOS rounding", () => {
    expect(kmToMiles(100)).toBe(62);
    expect(milesToKm(62)).toBe(100);
  });

  it("keeps stored kilometers for metric display", () => {
    expect(displayMileage(12345, true)).toBe(12345);
  });

  it("converts stored kilometers for imperial display", () => {
    expect(displayMileage(160_934, false)).toBe(100_000);
  });

  it("stores metric input as kilometers and imperial input as converted kilometers", () => {
    expect(inputMileageToKm(12_345, true)).toBe(12_345);
    expect(inputMileageToKm(100_000, false)).toBe(160_934);
  });
});
