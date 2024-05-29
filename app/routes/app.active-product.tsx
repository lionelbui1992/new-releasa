import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import db from "~/db.server";
import { UpdateStatusReleaseProduct } from "~/helpers/products";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const idForm = formData.get("id");
  const releaseForm = formData.get("release_status");
  const releaseId = formData.get("status_id");
  const id = idForm ? idForm : 0;
  if (id && releaseForm && releaseId) {
    await db.releaseProduct.update({
      where: {
        id: BigInt(id.toString().replace("gid://shopify/Product/", "")),
      },
      data: {
        release_status: releaseForm.toString() === "true",
      },
    });
    return await UpdateStatusReleaseProduct(
      admin,
      id.toString(),
      releaseId.toString(),
      releaseForm.toString() === "true",
    );
  }
  return null;
};

export default function ActiveProductRoute() {}
