import type { ReleaseProduct } from "@prisma/client";
import db from "~/db.server";
import type {
  META_FIELD,
  RELEASE_MANAGE_INTERFACE,
  RELEASE_PRODUCT,
} from "~/interfaces/products.interface";
import moment from "moment/moment";
import { QUERIES } from "~/helpers/queries";

export function GetItems(pageCursor?: ReleaseProduct) {
  return db.releaseProduct.findMany({
    take: 10,
    skip: pageCursor ? 1 : 0,
    cursor: pageCursor
      ? { id: pageCursor.id, createdAt: pageCursor.createdAt }
      : undefined,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export function GetReleaseProductOverview(): Promise<ReleaseProduct[]> {
  return db.releaseProduct.findMany({
    where: {
      start: {
        gte: new Date(
          `${moment().subtract("2", "months").format("YYYY-MM")}-01T00:00:00`,
        ),
      },
      release_status: true,
    },
    select: {
      id: true,
      start: true,
      end: true,
      release_status: true,
      start_id: true,
      end_id: true,
      status_id: true,
      createdAt: true,
    },
  });
}

export function ParserReleaseProduct(el: ReleaseProduct): {
  createdAt: Date;
  status_id: string;
  start_id: string;
  start: Date;
  end_id: string;
  end: Date;
  id: string;
  release_status: boolean;
} {
  return {
    id: el.id.toString(),
    start: el.start,
    end: el.end,
    release_status: el.release_status,
    createdAt: el.createdAt,
    status_id: el.status_id.toString(),
    end_id: el.end_id.toString(),
    start_id: el.start_id.toString(),
  };
}

export async function GetDetailProductsFromShopify(
  admin: any,
  releaseProducts: ReleaseProduct[],
): Promise<RELEASE_PRODUCT[]> {
  try {
    const obj = releaseProducts.map((el: ReleaseProduct) => {
      return ParserReleaseProduct(el);
    });
    return await Promise.all(
      obj.map(async (el) => {
        return await GetDetailProductFromShopify(admin, el);
      }),
    );
  } catch (e) {
    throw new Response("Oh no! Something went wrong!", {
      status: 500,
    });
  }
}

export async function GetDetailProductFromShopify(
  admin: any,
  product: {
    createdAt: Date;
    status_id: string;
    start_id: string;
    start: Date;
    end_id: string;
    end: Date;
    id: string;
    release_status: boolean;
  },
): Promise<RELEASE_PRODUCT> {
  try {
    const rs = await admin.graphql(QUERIES.DETAIL_PRODUCT(product.id));
    const productRS = await rs.json();
    return {
      start: product.start,
      end: product.end,
      release_status: product.release_status,
      start_id: product.start_id,
      end_id: product.end_id,
      status_id: product.status_id,
      ...productRS.data.product,
    };
  } catch (e) {
    throw new Response("Oh no! Something went wrong!", {
      status: 500,
    });
  }
}

export async function UpdateStatusReleaseProduct(
  admin: any,
  idProduct: string,
  idReleaseStatus: string,
  status: boolean,
) {
  const optionVar: any = {
    variables: {
      input: {
        metafields: {
          namespace: "custom",
          key: "release_status",
          value: status ? "true" : "false",
          id: `${idReleaseStatus}`,
        },
        id: `${idProduct}`,
      },
    },
  };
  const response = await admin.graphql(
    `#graphql
  mutation updateProductMetafields($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        metafields(first: 10, namespace: "custom") {
          edges {
            node {
              id
              namespace
              key
              value
              legacyResourceId
            }
          }
        }
      }
      userErrors {
        message
        field
      }
    }
  }`,
    optionVar,
  );

  const rs = await response.json();
  return rs.data;
}

export async function GetDetailProductViaShopifyId(admin: any, id: string) {
  try {
    const rs = await admin.graphql(QUERIES.DETAIL_PRODUCT(id));
    const product = await rs.json();
    return product.data.product;
  } catch (e) {
    throw new Response(`Error when get product ID: ${id}`, {
      status: 500,
    });
  }
}

export async function UpdateProductShopify(
  admin: any,
  data: { variables: { input: any } },
) {
  try {
    const response = await admin.graphql(QUERIES.UPDATE_PRODUCT, data);
    const rs = await response.json();
    return rs.data.productUpdate.product;
  } catch (e) {
    throw new Response(
      `Error when get update product ID: ${data.variables.input.id}`,
      {
        status: 500,
      },
    );
  }
}

export async function SearchProductShopify(
  admin: any,
  title: string,
): Promise<RELEASE_MANAGE_INTERFACE> {
  try {
    const response = await admin.graphql(
      QUERIES.SEARCH_PRODUCTS_BY_NAME(title),
    );
    const rs = await response.json();
    return execProductsShopifyApiProduct(rs);
  } catch (e) {
    throw new Response(`Error when search product name: ${title}`, {
      status: 500,
    });
  }
}

export async function GetReleaseManageProducts(
  admin: any,
  searchType?: string,
  reserve?: boolean,
  nextCursor?: string | null,
  prevCursor?: string | null,
): Promise<RELEASE_MANAGE_INTERFACE> {
  try {
    const response = await admin.graphql(
      QUERIES.GET_RELEASE_MANAGE_PRODUCTS(
        searchType ? searchType : "TITLE",
        reserve,
        nextCursor,
        prevCursor,
      ),
    );
    const rs = await response.json();
    return execProductsShopifyApiProduct(rs.data);
  } catch (e) {
    throw new Response(`Error when get products release manage`, {
      status: 500,
    });
  }
}

const execProductsShopifyApiProduct = (data: any) => {
  return {
    products: data.products.edges.map((el: any) => {
      const start = el.node.metafields.edges.find(
        (item: META_FIELD) => item.node.key === "release_start_date",
      );
      const release_status = el.node.metafields.edges.find(
        (item: META_FIELD) => item.node.key === "release_status",
      );
      return {
        ...el.node,
        start: start ? start.node.value : moment().format(),
        release_status: !!(
          release_status && release_status.node.value === "true"
        ),
        status_id: release_status ? release_status.node.id : "",
      };
    }),
    nextCursor: data.products.pageInfo.hasNextPage
      ? data.products.edges[data.products.edges.length - 1].cursor
      : undefined,
    prevCursor: data.products.pageInfo.hasPreviousPage
      ? data.products.edges[0].cursor
      : undefined,
    hasNext: data.products.pageInfo.hasNextPage,
    hasPrev: data.products.pageInfo.hasPreviousPage,
  };
};

export async function SyncDataShopifyToPrisma(admin: any) {
  const allProducts = await getAllProductsReleaseShopify(admin);
  if (allProducts && allProducts.length) {
    for (const item of allProducts) {
      const start = item.metafields.edges.find(
        (el) => el.node.key === "release_start_date",
      );
      const end = item.metafields.edges.find(
        (el) => el.node.key === "release_end_date",
      );
      const release_status = item.metafields.edges.find(
        (el) => el.node.key === "release_status",
      );
      await db.releaseProduct.upsert({
        where: {
          id: BigInt(item.id.replace("gid://shopify/Product/", "")),
        },
        update: {
          start: start ? start.node.value : moment().format(),
          end: end ? end.node.value : moment().format(),
          release_status: release_status
            ? release_status.node.value === "true"
            : false,
          start_id: start ? BigInt(start.node.legacyResourceId) : 0,
          end_id: end ? BigInt(end.node.legacyResourceId) : 0,
          status_id: release_status
            ? BigInt(release_status.node.legacyResourceId)
            : 0,
        },
        create: {
          id: BigInt(item.id.replace("gid://shopify/Product/", "")),
          start: start ? start.node.value : moment().format(),
          end: end ? end.node.value : moment().format(),
          release_status: release_status
            ? release_status.node.value === "true"
            : false,
          start_id: start ? BigInt(start.node.legacyResourceId) : 0,
          end_id: end ? BigInt(end.node.legacyResourceId) : 0,
          status_id: release_status
            ? BigInt(release_status.node.legacyResourceId)
            : 0,
        },
      });
    }
  }
}

const getAllProductsReleaseShopify = async (
  admin: any,
  cursor?: string,
): Promise<RELEASE_PRODUCT[]> => {
  let products: RELEASE_PRODUCT[] = [];
  const response = await admin.graphql(
    QUERIES.GET_RELEASE_MANAGE_PRODUCTS("TITLE", undefined, cursor),
  );
  const rs = await response.json();
  if (rs.data.products && rs.data.products.edges)
    products = products.concat(
      rs.data.products.edges.map((el: { node: RELEASE_PRODUCT }) => el.node),
    );
  if (rs.data.products.pageInfo.hasNext) {
    const cursor = rs.data.products.edges[products.length - 1].cursor;
    const nextRs = await getAllProductsReleaseShopify(admin, cursor);
    products = products.concat(nextRs);
  }
  return products;
};

export async function DelProductPrismaViaId(id: string) {
  await db.releaseProduct.delete({
    where: {
      id: BigInt(id.replace("gid://shopify/Product/", "")),
    },
  });
}
