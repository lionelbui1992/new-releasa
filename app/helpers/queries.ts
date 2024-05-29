export const QUERIES = {
  DETAIL_PRODUCT(
    id: string,
    sumMetafields?: number,
    nameSpaceMetafields?: number,
    sumCollections?: number,
    sumImages?: number,
    sumVariants?: number,
  ) {
    return `query {
        product(id: "gid://shopify/Product/${id}") {
          collections(first: ${sumCollections ? sumCollections : "25"}) {
            edges {
              node {
                handle
              }
            }
          }
          createdAt
          defaultCursor
          description
          descriptionHtml
          featuredImage {
            id
            url
          }
          feedback {
            details {
              messages {
                message
              }
            }
          }
          giftCardTemplateSuffix
          handle
          hasOnlyDefaultVariant
          hasOutOfStockVariants
          id
          images(first: ${sumImages ? sumImages : "5"}) {
            edges {
              node {
                id
              }
            }
          }
          isGiftCard
          legacyResourceId
          metafields(first: ${sumMetafields ? sumMetafields : "25"}, namespace: ${nameSpaceMetafields ? `"${nameSpaceMetafields}"` : `"custom"`}) {
            edges {
              node {
                key
                id
                value
              }
            }
          }
          onlineStorePreviewUrl
          onlineStoreUrl
          options {
            name
          }
          priceRange {
            maxVariantPrice {
              amount
            }
            minVariantPrice {
              amount
            }
          }
          productType
          resourcePublicationsCount {
            count
          }
          availablePublicationsCount {
            count
          }
          publishedAt
          resourcePublications(first: 5) {
            edges {
              node {
                isPublished
              }
            }
          }
          resourcePublicationOnCurrentPublication {
            publication {
              name
              id
            }
            publishDate
            isPublished
          }
          seo {
            title
          }
          storefrontId
          tags
          templateSuffix
          title
          totalInventory
          tracksInventory
          unpublishedPublications(first: 5) {
            edges {
              node {
                name
              }
            }
          }
          updatedAt
          variants(first: ${sumVariants ? sumVariants : "20"}) {
            edges {
              node {
                displayName
                title
                availableForSale
                sku
              }
            }
          }
          variantsCount {
            count
          }
          vendor
        }
      }`;
  },
  UPDATE_PRODUCT: `mutation updateProductMetafields($input: ProductInput!) {
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
  SEARCH_PRODUCTS_BY_NAME(
    title: string,
    sumMetafields?: number,
    nameSpaceMetafields?: string,
    sumVariants?: string,
  ) {
    return `query {
    products(first: 25, reverse: true, query: "title:*${title}* AND tag:new-release") {
      edges {
        node {
          id
          title
          handle
          featuredImage {
            id
            url
          }
          metafields(first: ${sumMetafields ? sumMetafields : "25"}, namespace: ${nameSpaceMetafields ? `"${nameSpaceMetafields}"` : `"custom"`}) {
            edges {
              node {
                key
                id
                value
              }
            }
          }
          publishedAt
          variants(first: ${sumVariants ? sumVariants : "20"}) {
            edges {
              node {
                displayName
                title
                availableForSale
                sku
              }
            }
          }
          variantsCount {
            count
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
      }
    }
  }`;
  },
  GET_RELEASE_MANAGE_PRODUCTS(
    searchType?: string,
    reverse?: boolean,
    after?: string | null,
    before?: string | null,
    order?: number,
    sumMetafields?: number,
    nameSpaceMetafields?: string,
    sumVariants?: string,
  ) {
    return `query {
    products(${before ? "last" : "first"}: ${order ? `${order}` : "10"}, reverse: ${reverse ? "true" : "false"}, query: "tag:new-release", sortKey: ${searchType}${after ? `, after: "${after}"` : ""}${before ? `, before: "${before}"` : ""}) {
      edges {
        node {
          id
          title
          handle
          featuredImage {
            id
            url
          }
          metafields(first: ${sumMetafields ? sumMetafields : "25"}, namespace: ${nameSpaceMetafields ? `"${nameSpaceMetafields}"` : `"custom"`}) {
            edges {
              node {
                key
                id
                value
                legacyResourceId
              }
            }
          }
          publishedAt
          variants(first: ${sumVariants ? sumVariants : "20"}) {
            edges {
              node {
                displayName
                title
                availableForSale
                sku
              }
            }
          }
          variantsCount {
            count
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }`;
  },
};
