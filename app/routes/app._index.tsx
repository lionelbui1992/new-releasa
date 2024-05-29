import { useCallback, useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { BlockStack, Button, Layout, Page, Tabs } from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import moment from "moment";
import type { RELEASE_PRODUCT } from "~/interfaces/products.interface";
import { CardProducts } from "~/components/card-product";
import { TableProducts } from "~/components/table-products";
import styles from "../styles/shared.css?url";
import {
  GetDetailProductsFromShopify,
  GetReleaseManageProducts,
  GetReleaseProductOverview,
  GetItems,
  SyncDataShopifyToPrisma,
  GetDetailProductViaShopifyId,
  DelProductPrismaViaId,
} from "~/helpers/products";
export const links = () => [{ rel: "stylesheet", href: styles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const allReleaseProd = await GetItems();
  if (!allReleaseProd || !allReleaseProd.length) {
    await SyncDataShopifyToPrisma(admin);
  } else {
    for (const prod of allReleaseProd) {
      const shopifyProd = await GetDetailProductViaShopifyId(
        admin,
        prod.id.toString(),
      );
      if (!shopifyProd) await DelProductPrismaViaId(prod.id.toString());
      await SyncDataShopifyToPrisma(admin);
    }
  }

  const releaseProducts = await GetReleaseProductOverview();
  let allProd: RELEASE_PRODUCT[] = [];
  if (releaseProducts && releaseProducts.length) {
    allProd = await GetDetailProductsFromShopify(admin, releaseProducts);
  }
  const comingSoon: RELEASE_PRODUCT[] = [];
  const months: RELEASE_PRODUCT[] = [];
  if (allProd.length) {
    for (const item of allProd) {
      if (moment(item.start) > moment()) comingSoon.push(item);
      else months.push(item);
    }
  }

  const detailProd = await GetReleaseManageProducts(admin);
  return {
    coming: comingSoon,
    released: months.reduce(
      (
        acc: {
          [key: string]: RELEASE_PRODUCT[];
        },
        prod,
      ) => {
        const monthYear = moment(prod.start).format("YYYY-MM");
        if (!acc[monthYear]) {
          acc[monthYear] = [];
        }
        acc[monthYear].push(prod);
        return acc;
      },
      {},
    ),
    all: detailProd,
  };
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const { coming, released, all } = data;
  const releaseKey = Object.keys(released);
  const navigate = useNavigate();
  const [selected, setSelected] = useState(0);
  const handleTabChange = useCallback(
    (selectedTabIndex: number) => setSelected(selectedTabIndex),
    [],
  );
  const tabs = [
    {
      id: "overview",
      content: "Releases Overview",
      panelID: "overview",
    },
    {
      id: "manage",
      content: "Manage Releases",
      panelID: "manage",
    },
  ];

  return (
    <Page fullWidth title={"New Release Manager"}>
      <Layout>
        <Layout.Section>
          <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}>
            <Layout.Section>
              {selected === 0 && (
                <BlockStack gap={"400"}>
                  {data && data.coming && data.coming.length > 0 && (
                    <CardProducts data={coming} title={"Coming Soon"} />
                  )}
                  {released &&
                    releaseKey.map((key: string, index: number) => (
                      <CardProducts
                        key={index}
                        title={moment(key).format("MMM YYYY")}
                        data={released[key].map((el) => el)}
                      />
                    ))}
                </BlockStack>
              )}
              {selected === 1 && (
                <BlockStack gap={"200"}>
                  <div style={{ display: "flex", justifyContent: "end" }}>
                    <Button
                      onClick={() => navigate("/app/add-release")}
                      variant="primary"
                      tone={"success"}
                    >
                      Add New Release
                    </Button>
                  </div>
                  {all && <TableProducts data={all} />}
                </BlockStack>
              )}
            </Layout.Section>
          </Tabs>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
