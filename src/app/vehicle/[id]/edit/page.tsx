import { notFound } from "next/navigation";
import { EditVehicleForm } from "@/components/edit-vehicle-form";
import { getVehicleById } from "@/lib/garage-data";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const result = await getVehicleById(id, user.sub);

  if (!result) {
    notFound();
  }

  return <EditVehicleForm vehicle={result.vehicle} unitSystem={result.unitSystem} />;
}
