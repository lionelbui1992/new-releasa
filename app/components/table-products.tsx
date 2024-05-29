import {
  IndexTable,
  IndexFilters,
  useSetIndexFiltersMode,
  Text,
  ChoiceList,
  Avatar,
  Card,
} from "@shopify/polaris";
import type { IndexFiltersProps, TabProps } from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import type {
  RELEASE_MANAGE_INTERFACE,
  RELEASE_PRODUCT,
} from "~/interfaces/products.interface";
import moment from "moment";
import { useFetcher } from "@remix-run/react";

export function TableProducts({ data }: { data: RELEASE_MANAGE_INTERFACE }) {
  const [listProd, setListProd] = useState<RELEASE_PRODUCT[]>(data.products);
  const fetcher = useFetcher();
  const [loading, setLoading] = useState<boolean>(false);
  const [hasNext, setHasNext] = useState<boolean>(data.hasNext);
  const [hasPrev, setHasPrev] = useState<boolean>(data.hasPrev);
  const [nextCursor, setNextCursor] = useState<string>(data.nextCursor);
  const [prevCursor, setPrevCursor] = useState<string>(data.prevCursor);
  const setStatusProduct = (product: {
    id: string;
    release_status: boolean;
    status_id?: string;
  }) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("id", product.id);
    formData.append(
      "release_status",
      product.release_status ? "false" : "true",
    );
    formData.append("status_id", product.status_id ? product.status_id : "");
    fetcher.submit(formData, { method: "post", action: "/app/active-product" });
  };
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  const [itemStrings, setItemStrings] = useState([
    "All",
    "Current Month",
    "Next Month",
    "Previous 2 Months",
  ]);

  const tabs: TabProps[] = itemStrings.map((item, index) => ({
    content: item,
    index,
    onAction: () => {},
    id: `${item}-${index}`,
    actions:
      index !== 0
        ? []
        : [
            {
              type: "rename",
              onAction: () => {},
              onPrimaryAction: async (value: string): Promise<boolean> => {
                const newItemsStrings = tabs.map((item, idx) => {
                  if (idx === index) {
                    return value;
                  }
                  return item.content;
                });
                await sleep(1);
                setItemStrings(newItemsStrings);
                return true;
              },
            },
          ],
  }));
  const [selected, setSelected] = useState(0);
  const sortOptions: IndexFiltersProps["sortOptions"] = [
    { label: "Name", value: "TITLE asc", directionLabel: "A-Z" },
    { label: "Name", value: "TITLE desc", directionLabel: "Z-A" },
    {
      label: "Publish",
      value: "PUBLISHED_AT asc",
      directionLabel: "Ascending",
    },
    {
      label: "Publish",
      value: "PUBLISHED_AT desc",
      directionLabel: "Descending",
    },
  ];
  const [sortSelected, setSortSelected] = useState(["TITLE asc"]);
  const { mode, setMode } = useSetIndexFiltersMode();
  const onHandleCancel = () => {
    setListProd(data.products);
  };

  const [accountStatus, setAccountStatus] = useState<string[] | undefined>(
    undefined,
  );
  const [moneySpent, setMoneySpent] = useState<[number, number] | undefined>(
    undefined,
  );
  const [taggedWith, setTaggedWith] = useState("");
  const [queryValue, setQueryValue] = useState("");

  const handleAccountStatusChange = useCallback(
    (value: string[]) => setAccountStatus(value),
    [],
  );
  const handleFiltersQueryChange = useCallback(
    (value: string) => setQueryValue(value),
    [],
  );
  const handleAccountStatusRemove = useCallback(
    () => setAccountStatus(undefined),
    [],
  );
  const handleMoneySpentRemove = useCallback(
    () => setMoneySpent(undefined),
    [],
  );
  const handleTaggedWithRemove = useCallback(() => setTaggedWith(""), []);
  const handleFiltersClearAll = useCallback(() => {}, []);

  const filters = [
    {
      key: "accountStatus",
      label: "Account status",
      filter: (
        <ChoiceList
          title="Account status"
          titleHidden
          choices={[
            { label: "Enabled", value: "enabled" },
            { label: "Not invited", value: "not invited" },
            { label: "Invited", value: "invited" },
            { label: "Declined", value: "declined" },
          ]}
          selected={accountStatus || []}
          onChange={handleAccountStatusChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
  ];

  const appliedFilters: IndexFiltersProps["appliedFilters"] = [];
  if (accountStatus && !isEmpty(accountStatus)) {
    const key = "accountStatus";
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, accountStatus),
      onRemove: handleAccountStatusRemove,
    });
  }
  if (moneySpent) {
    const key = "moneySpent";
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, moneySpent),
      onRemove: handleMoneySpentRemove,
    });
  }
  if (!isEmpty(taggedWith)) {
    const key = "taggedWith";
    appliedFilters.push({
      key,
      label: disambiguateLabel(key, taggedWith),
      onRemove: handleTaggedWithRemove,
    });
  }

  const rowMarkup = listProd.map(
    (
      {
        id,
        featuredImage,
        variants,
        publishedAt,
        title,
        start,
        release_status,
        status_id,
      },
      index,
    ) => (
      <IndexTable.Row id={id ? `${id}` : `${index}`} key={id} position={index}>
        <IndexTable.Cell>
          <label className={"switch"}>
            <input
              onChange={() =>
                setStatusProduct({ id, release_status, status_id })
              }
              type="checkbox"
              checked={release_status}
            />
            <span className={"slider"} />
          </label>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Avatar
            size={"xl"}
            source={
              featuredImage ? featuredImage.url : "https://placehold.co/40x40"
            }
            name={title ? title : ""}
          />
        </IndexTable.Cell>
        <IndexTable.Cell>{title}</IndexTable.Cell>
        <IndexTable.Cell>
          {variants.edges.map((el: any) => el.node.title).join(" | ")}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" alignment="end" numeric>
            {""}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {`${moment(start).format("M/DD/YYYY")}`}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {publishedAt ? moment(publishedAt).format("M/DD/YYYY") : "Unknown"}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {publishedAt
            ? `${moment(publishedAt).format("h:mm A")} ET`
            : "Unknown"}
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );
  useEffect(() => {
    if (
      fetcher.state &&
      fetcher.state === "idle" &&
      fetcher.data &&
      // @ts-ignore
      fetcher.data.productUpdate &&
      // @ts-ignore
      fetcher.data["productUpdate"].product
    ) {
      const formData = new FormData();
      formData.append("searchType", sortSelected[0].split(" ")[0]);
      formData.append("reverse", sortSelected[0].split(" ")[1]);
      formData.append("typeSearch", "get product");
      setLoading(true);
      fetcher.submit(formData, {
        method: "post",
        action: "/app/search-product",
      });
      setTimeout(() => {
        shopify.toast.show("Product update");
      }, 3500);
    }
    if (
      fetcher.state &&
      fetcher.state === "idle" &&
      fetcher.data &&
      // @ts-ignore
      fetcher.data.products &&
      // @ts-ignore
      fetcher.data.hasOwnProperty("hasNext")
    ) {
      // @ts-ignore
      setListProd(fetcher.data.products);
      // @ts-ignore
      setHasNext(fetcher.data.hasNext);
      // @ts-ignore
      setNextCursor(fetcher.data.nextCursor);
      // @ts-ignore
      setHasPrev(fetcher.data.hasPrev);
      // @ts-ignore
      setPrevCursor(fetcher.data.prevCursor);
    }
    if (fetcher.state && fetcher.state === "idle") {
      setLoading(false);
    }
    console.log(fetcher.data, "fetcher");
  }, [fetcher]);
  useEffect(() => {
    const formData = new FormData();
    formData.append("title", queryValue);
    setLoading(true);
    fetcher.submit(formData, { method: "post", action: "/app/search-product" });
  }, [queryValue]);
  useEffect(() => {
    const formData = new FormData();
    formData.append("searchType", sortSelected[0].split(" ")[0]);
    formData.append("reverse", sortSelected[0].split(" ")[1]);
    formData.append("typeSearch", "get product");
    setLoading(true);
    fetcher.submit(formData, { method: "post", action: "/app/search-product" });
  }, [sortSelected]);
  return (
    <div className={"release_manage"}>
      <Card padding={"0"}>
        <IndexFilters
          sortOptions={sortOptions}
          sortSelected={sortSelected}
          queryValue={queryValue}
          queryPlaceholder="Searching product name"
          onQueryChange={handleFiltersQueryChange}
          onQueryClear={() => setQueryValue("")}
          onSort={setSortSelected}
          cancelAction={{
            onAction: onHandleCancel,
            disabled: false,
            loading: false,
          }}
          tabs={tabs}
          selected={selected}
          onSelect={setSelected}
          filters={filters}
          onClearAll={handleFiltersClearAll}
          mode={mode}
          setMode={setMode}
          loading={loading}
        />
        {listProd && listProd.length > 0 && (
          <IndexTable
            itemCount={listProd.length}
            selectable={false}
            headings={[
              { title: "" },
              { title: "  ", alignment: "center" },
              { title: "Product" },
              { title: "Color" },
              { title: "Style", alignment: "end" },
              { title: "Release Date" },
              { title: "Publish Date" },
              { title: "Publish Time" },
            ]}
            pagination={{
              hasNext: hasNext,
              onNext: () => {
                console.log(nextCursor, "table");
                const formData = new FormData();
                formData.append("searchType", sortSelected[0].split(" ")[0]);
                formData.append("reverse", sortSelected[0].split(" ")[1]);
                formData.append("nextCursor", nextCursor);
                formData.append("typeSearch", "get product");
                setLoading(true);
                fetcher.submit(formData, {
                  method: "post",
                  action: "/app/search-product",
                });
              },
              hasPrevious: hasPrev,
              onPrevious: () => {
                const formData = new FormData();
                formData.append("searchType", sortSelected[0].split(" ")[0]);
                formData.append("reverse", sortSelected[0].split(" ")[1]);
                formData.append("prevCursor", prevCursor);
                formData.append("typeSearch", "get product");
                setLoading(true);
                fetcher.submit(formData, {
                  method: "post",
                  action: "/app/search-product",
                });
              },
            }}
          >
            {rowMarkup}
          </IndexTable>
        )}
      </Card>
    </div>
  );

  function disambiguateLabel(key: string, value: string | any[]): string {
    switch (key) {
      case "moneySpent":
        return `Money spent is between $${value[0]} and $${value[1]}`;
      case "taggedWith":
        return `Tagged with ${value}`;
      case "accountStatus":
        return (value as string[]).map((val) => `Customer ${val}`).join(", ");
      default:
        return value as string;
    }
  }

  function isEmpty(value: string | string[]): boolean {
    if (Array.isArray(value)) {
      return value.length === 0;
    } else {
      return value === "" || value == null;
    }
  }
}
