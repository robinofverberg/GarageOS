import { notFound } from "next/navigation";
import { getVehicleById, vehicles } from "@/lib/mock-data";
import { EditVehicleForm } from "@/components/edit-vehicle-form";

export function generateStaticParams() {
  return vehicles.map((v) => ({ id: v.id }));
}

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = getVehicleById(id);

  if (!vehicle) {
    notFound();
  }

  return <EditVehicleForm vehicle={vehicle} />;
}
