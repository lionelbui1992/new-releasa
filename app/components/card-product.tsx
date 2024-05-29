import type { RELEASE_PRODUCT } from "~/interfaces/products.interface";
import { Box, Card, Text, Bleed, Grid } from "@shopify/polaris";
import moment from "moment";

export function CardProducts({
  data,
  title,
}: {
  data: RELEASE_PRODUCT[];
  title: string;
}) {
  return (
    <Card roundedAbove="sm">
      <Text as="h2" variant="headingSm">
        {title}
      </Text>
      <Box paddingBlockStart="200">
        <Grid>
          {data.map((item, index) => (
            <Grid.Cell
              key={index}
              columnSpan={{ xs: 6, sm: 3, md: 2, lg: 3, xl: 2 }}
            >
              {item && (
                <Card roundedAbove="sm" key={index}>
                  <Bleed marginInline="200" marginBlock="200">
                    <img
                      alt={item.title ? item.title : ""}
                      width="100%"
                      height="100%"
                      style={{
                        objectFit: "cover",
                        objectPosition: "center",
                      }}
                      src={
                        item.featuredImage && item.featuredImage.url
                          ? item.featuredImage.url
                          : "https://placehold.co/320x320"
                      }
                    />
                    <Box padding="400">
                      <Text as="p" variant="bodyMd" fontWeight={"bold"}>
                        {item.title ? item.title : ""}
                      </Text>
                      <Text as="p" variant="bodyMd">
                        ${item.priceRange?.minVariantPrice?.amount}
                      </Text>
                      <Text as="p" variant="bodyMd" fontWeight={"bold"}>
                        {moment(item.start).format("M/D/YYYY")}
                      </Text>
                    </Box>
                  </Bleed>
                </Card>
              )}
            </Grid.Cell>
          ))}
        </Grid>
      </Box>
    </Card>
  );
}
