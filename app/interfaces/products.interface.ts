export interface ProductInterface {
  node: NodeProduct;
}

export interface NodeProduct {
  defaultCursor?: string;
  featuredImage: FeatureImage;
  title: string;
  id: string;
}

export interface FeatureImage {
  url?: string;
}

export interface RELEASE_PRODUCT {
  id: string;
  start: string;
  end: string;
  release_status: boolean;
  start_id?: string;
  end_id?: string;
  status_id?: string;
  title?: string | null;
  body_html?: string | null;
  vendor?: string | null;
  product_type?: string | null;
  created_at?: string | null;
  handle?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
  template_suffix?: string | null;
  published_scope?: string | null | null;
  tags?: string | string[] | null;
  status?: string | null;
  admin_graphql_api_id?: string | null;
  variants?: any | null;
  options?: any | null;
  images?: any | null;
  image?: any | null;
  featuredImage?: {
    id: string;
    url: string;
  };
  publishedAt: string;
  priceRange?: {
    maxVariantPrice?: {
      amount: string;
    };
    minVariantPrice?: {
      amount: string;
    };
  };
  metafields: { edges: META_FIELD[] };
}

export interface META_FIELD {
  node: {
    key: string;
    id: string;
    value: string;
    legacyResourceId: string;
  };
}

export interface RELEASE_MANAGE_INTERFACE {
  products: RELEASE_PRODUCT[];
  nextCursor: string;
  prevCursor: string;
  hasNext: boolean;
  hasPrev: boolean;
}
