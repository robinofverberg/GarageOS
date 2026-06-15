import { notFound } from "next/navigation";
import { EditVehicleForm } from "@/components/edit-vehicle-form";
import { getVehicleById } from "@/lib/garage-data";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getVehicleById(id);

  if (!result) {
    notFound();
  }

  return <EditVehicleForm vehicle={result.vehicle} />;
}
