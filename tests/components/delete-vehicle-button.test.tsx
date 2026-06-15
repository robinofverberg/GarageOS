import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteVehicleButton } from "@/components/delete-vehicle-button";

const deleteVehicleMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/garage/actions", () => ({
  deleteVehicle: deleteVehicleMock,
}));

describe("DeleteVehicleButton", () => {
  beforeEach(() => {
    deleteVehicleMock.mockReset();
  });

  it("opens and cancels the confirmation dialog", () => {
    render(<DeleteVehicleButton vehicleId="veh_1" vehicleLabel="1994 Toyota Supra" />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Vehicle" }));
    expect(screen.getByRole("heading", { name: "Delete vehicle?" })).toBeInTheDocument();
    expect(screen.getByText(/1994 Toyota Supra/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("heading", { name: "Delete vehicle?" })).not.toBeInTheDocument();
  });

  it("calls the delete action after confirmation", async () => {
    deleteVehicleMock.mockResolvedValue(undefined);
    render(<DeleteVehicleButton vehicleId="veh_1" vehicleLabel="1994 Toyota Supra" />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Vehicle" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteVehicleMock).toHaveBeenCalledWith("veh_1"));
  });
});
