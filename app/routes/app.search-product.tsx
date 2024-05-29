import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import {
  GetReleaseManageProducts,
  SearchProductShopify,
} from "~/helpers/products";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const titleForm = formData.get("title");
  const typeForm = formData.get("typeSearch");
  const title = titleForm ? titleForm : "";
  const type = typeForm ? typeForm : "";
  if (type === "get product") {
    const searchTypeF = formData.get("searchType");
    const reverseF = formData.get("reverse");
    const nextCursor = formData.get("nextCursor");
    const prevCursor = formData.get("prevCursor");
    const searchType =
      searchTypeF && typeof searchTypeF === "string" && searchTypeF.length
        ? searchTypeF
        : "TITLE";
    const reverse = reverseF === "desc";
    return await GetReleaseManageProducts(
      admin,
      searchType,
      reverse,
      nextCursor ? nextCursor.toString() : null,
      prevCursor ? prevCursor.toString() : null,
    );
  } else if (title) {
    return await SearchProductShopify(admin, title.toString());
  } else return null;
};

export default function SearchProductRoute() {}
