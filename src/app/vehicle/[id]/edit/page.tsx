import { notFound } from "next/navigation";
import { EditVehicleForm } from "@/components/edit-vehicle-form";
import { getVehicleById } from "@/lib/garage-data";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = await getVehicleById(id);

  if (!vehicle) {
    notFound();
  }

  return <EditVehicleForm vehicle={vehicle} />;
}
