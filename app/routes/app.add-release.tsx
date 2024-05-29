import type { ResourceListProps } from "@shopify/polaris";
import {
  Card,
  Page,
  Text,
  Box,
  FormLayout,
  TextField,
  Icon,
  Combobox,
  Listbox,
  BlockStack,
  Button,
  InlineGrid,
  Frame,
  Modal,
  Divider,
  ResourceList,
  Avatar,
  ResourceItem,
  ContextualSaveBar,
  DatePicker,
  Popover,
} from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import {
  CalendarIcon,
  ClockIcon,
  FilterIcon,
  SearchIcon,
} from "@shopify/polaris-icons";
import type {
  ProductInterface,
  NodeProduct,
  META_FIELD,
} from "~/interfaces/products.interface";
import moment from "moment";
import db from "~/db.server";
import type { ActionFunctionArgs } from "@remix-run/node";
import { useFetcher, useNavigate } from "@remix-run/react";
import styles from "../styles/shared.css?url";
import { authenticate } from "~/shopify.server";
import {
  GetDetailProductViaShopifyId,
  UpdateProductShopify,
} from "~/helpers/products";

function generateTimeOptions(): { label: string; value: string }[] {
  const times = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0); // Bắt đầu từ 00:00

  for (let i = 0; i < 24 * 2; i++) {
    const hours = start.getHours();
    const minutes = start.getMinutes();
    const timeString = formatTime(hours, minutes);
    times.push({ label: timeString, value: timeString });

    // Tăng thời gian lên 30 phút
    start.setMinutes(start.getMinutes() + 30);
  }

  return times;
}

function formatTime(hours: number, minutes: number) {
  const period = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12; // Chuyển đổi 0 thành 12
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${formattedHours}:${formattedMinutes} ${period} ET`;
}
export const links = () => [{ rel: "stylesheet", href: styles }];
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const ids = formData.get("ids");
  const startF =
    formData.get("start") && typeof formData.get("start") === "string"
      ? formData.get("start")
      : moment().format();
  const endF =
    formData.get("end") && typeof formData.get("end") === "string"
      ? formData.get("end")
      : moment().format();
  const start =
    startF && typeof startF === "string" ? startF : moment().format();
  const end = endF && typeof endF === "string" ? endF : moment().format();
  if (ids && typeof ids === "string" && ids.length && start && end) {
    for (const item of ids.split(";")) {
      const arrField: {
        key: string;
        namespace: string;
        type: string;
        value: any;
        id?: string;
      }[] = [
        {
          key: "release_end_date",
          namespace: "custom",
          type: "date_time",
          value: end,
        },
        {
          namespace: "custom",
          key: "release_start_date",
          type: "date_time",
          value: start,
        },
        {
          namespace: "custom",
          key: "release_status",
          type: "boolean",
          value: "true",
        },
      ];
      const shopifyProd = await GetDetailProductViaShopifyId(admin, item);
      const statusId = shopifyProd.metafields.edges.find(
        (el: META_FIELD) => el.node.key === "release_status",
      );
      const startId = shopifyProd.metafields.edges.find(
        (el: META_FIELD) => el.node.key === "release_start_date",
      );
      const endId = shopifyProd.metafields.edges.find(
        (el: META_FIELD) => el.node.key === "release_end_date",
      );
      for (const item of arrField) {
        if (item.key === "release_status" && statusId)
          item.id = statusId.node.id;
        if (item.key === "release_start_date" && startId)
          item.id = startId.node.id;
        if (item.key === "release_end_date" && endId) item.id = endId.node.id;
      }

      let optionVar: any = {
        variables: {
          input: {
            metafields: arrField,
            id: shopifyProd.id,
          },
        },
      };

      let updateResult = await UpdateProductShopify(admin, optionVar);

      const isInReleaseTag = shopifyProd.tags.indexOf("new-release") > -1;
      if (!isInReleaseTag) shopifyProd.tags.push("new-release");

      optionVar.variables.input = {
        id: shopifyProd.id,
        tags: shopifyProd.tags,
      };

      updateResult = await UpdateProductShopify(admin, optionVar);
      const metaFields = updateResult.metafields.edges;

      await db.releaseProduct.upsert({
        where: { id: parseInt(item) },
        update: { start, end },
        create: {
          id: parseInt(item),
          start,
          end,
          start_id: metaFields.find(
            (el: any) => el.node.key === "release_start_date",
          ).node.legacyResourceId,
          end_id: metaFields.find(
            (el: any) => el.node.key === "release_end_date",
          ).node.legacyResourceId,
          status_id: metaFields.find(
            (el: any) => el.node.key === "release_status",
          ).node.legacyResourceId,
        },
      });
    }
  }
  return { success: true, ids, start, end };
};

export default function AddRelease() {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  useEffect(() => {
    if (
      fetcher.state &&
      fetcher.state === "idle" &&
      fetcher.data &&
      // @ts-ignore
      fetcher.data.success
    ) {
      shopify.toast.show("Products added");
      navigate("/app");
    }
  }, [fetcher, navigate]);
  const escapeSpecialRegExCharacters = useCallback(
    (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    [],
  );
  const [showModal, setShowModal] = useState<boolean>(false);
  const [publishStartTime, setPublishStartTime] = useState("12:00 AM ET");
  const [publishEndTime, setPublishEndTime] = useState("12:00 AM ET");
  const [selectedTimeStartOption, setSelectedTimeStartOption] = useState<
    string | undefined
  >();
  const [selectedTimeEndOption, setSelectedTimeEndOption] = useState<
    string | undefined
  >();
  const deselectedOptions = generateTimeOptions();
  const [options, setOptions] = useState(deselectedOptions);
  const [keywordProduct, setKeywordProduct] = useState<string>("");
  const [arrFindedProducts, setArrFindedProducts] = useState<NodeProduct[]>([]);

  // Start Date Picker
  const [visibleStartDatePicker, setVisibleStartDatePicker] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(new Date());
  const [{ startMonth, startYear }, setStartDate] = useState({
    startMonth: selectedStartDate.getMonth(),
    startYear: selectedStartDate.getFullYear(),
  });
  const formattedStartValue = moment(selectedStartDate).format("YYYY-MM-DD");

  function handleInputValueChange() {
    console.log("handleInputValueChange");
  }

  function handleOnCloseStartDatePicker() {
    setVisibleStartDatePicker(false);
  }
  // @ts-ignore
  function handleStartMonthChange(month, year) {
    setStartDate({ startMonth: month, startYear: year });
  }

  // @ts-ignore
  function handleStartDateSelection({ end: newSelectedStartDate }) {
    setSelectedStartDate(newSelectedStartDate);
    setVisibleStartDatePicker(false);
  }

  useEffect(() => {
    if (selectedStartDate) {
      setStartDate({
        startMonth: selectedStartDate.getMonth(),
        startYear: selectedStartDate.getFullYear(),
      });
    }
  }, [selectedStartDate]);

  // End Date Picker
  const [visibleEndDatePicker, setVisibleEndDatePicker] = useState(false);
  const [selectedEndDate, setSelectedEndDate] = useState(new Date());
  const [{ endMonth, endYear }, setEndDate] = useState({
    endMonth: selectedEndDate.getMonth(),
    endYear: selectedEndDate.getFullYear(),
  });
  const formattedEndValue = moment(selectedEndDate).format("YYYY-MM-DD");

  function handleOnCloseEndDatePicker() {
    setVisibleEndDatePicker(false);
  }

  // @ts-ignore
  function handleEndMonthChange(month, year) {
    setEndDate({ endMonth: month, endYear: year });
  }

  // @ts-ignore
  function handleEndDateSelection({ end: newSelectedEndDate }) {
    setSelectedEndDate(newSelectedEndDate);
    setVisibleEndDatePicker(false);
  }

  useEffect(() => {
    if (selectedEndDate) {
      setEndDate({
        endMonth: selectedEndDate.getMonth(),
        endYear: selectedEndDate.getFullYear(),
      });
    }
  }, [selectedEndDate]);
  // End Date Picker

  const updateSelection = useCallback(
    (selected: string) => {
      const matchedOption = options.find((option) => {
        return option.value.match(selected);
      });

      setSelectedTimeStartOption(selected);
      setPublishStartTime((matchedOption && matchedOption.label) || "");
    },
    [options],
  );

  const updateTimeSelection = (selected: string, type: string) => {
    const matchedOption = options.find((option) => {
      return option.value.match(selected);
    });

    if (type === "end") {
      setSelectedTimeEndOption(selected);
      setPublishEndTime((matchedOption && matchedOption.label) || "");
    } else {
      setSelectedTimeStartOption(selected);
      setPublishStartTime((matchedOption && matchedOption.label) || "");
    }
  };

  const optionsStartMarkup = options.map((option) => {
    const { label, value } = option;
    return (
      <Listbox.Option
        key={`${value}`}
        value={value}
        selected={selectedTimeStartOption === value}
        accessibilityLabel={label}
      >
        {label}
      </Listbox.Option>
    );
  });

  const optionsEndMarkup = options.map((option) => {
    const { label, value } = option;
    return (
      <Listbox.Option
        key={`${value}`}
        value={value}
        selected={selectedTimeEndOption === value}
        accessibilityLabel={label}
      >
        {label}
      </Listbox.Option>
    );
  });
  const updateText = useCallback(
    (value: string) => {
      setPublishStartTime(value);

      if (value === "") {
        setOptions(deselectedOptions);
        return;
      }

      const filterRegex = new RegExp(escapeSpecialRegExCharacters(value), "i");
      const resultOptions = deselectedOptions.filter((option) =>
        option.label.match(filterRegex),
      );
      setOptions(resultOptions);
    },
    [deselectedOptions, escapeSpecialRegExCharacters],
  );

  const updateTextTime = (value: string, type: string) => {
    if (type === "end") setPublishEndTime(value);
    else setPublishStartTime(value);
    if (value === "") {
      setOptions(deselectedOptions);
      return;
    }

    const filterRegex = new RegExp(escapeSpecialRegExCharacters(value), "i");
    const resultOptions = deselectedOptions.filter((option) =>
      option.label.match(filterRegex),
    );
    setOptions(resultOptions);
  };
  const [selectedProducts, setSelectedProducts] = useState<NodeProduct[]>([]);
  const handleModal = useCallback(() => setShowModal(!showModal), [showModal]);
  const openModal = <Button onClick={handleModal}>Browse</Button>;
  // const searchProducts = async (key: string) => {};
  const handleSearchProduct = useCallback((newValue: string) => {
    setKeywordProduct(newValue);
    getProductSuggest(newValue).then();
  }, []);
  const getProductSuggest = async (key: string) => {
    const res = await fetch("shopify:admin/api/graphql.json", {
      method: "POST",
      body: JSON.stringify({
        query: `{
  products(
    first: 100
    query: "title:*${key}*"
  ) {
    edges {
      node {
        id
        title
        defaultCursor
        featuredImage {
          url
        }
      }
    }
  }
}`,
      }),
    });
    const { data } = await res.json();
    if (
      data &&
      data["products"] &&
      data["products"].edges &&
      data["products"].edges.length
    )
      return setArrFindedProducts(
        data["products"].edges.map((el: ProductInterface) => {
          return {
            id: el.node.id.replace("gid://shopify/Product/", ""),
            title: el.node.title,
            featuredImage: el.node.featuredImage,
            defaultCursor: el.node.defaultCursor,
          };
        }),
      );
  };
  const [selectedItems, setSelectedItems] = useState<
    ResourceListProps["selectedItems"]
  >([]);

  const bulkActions = [
    {
      content: "",
      onAction: () => console.log(selectedItems, "selectedItems"),
    },
  ];

  function resolveItemIds({ id }: { id: string }) {
    return id;
  }

  useEffect(() => {
    if (!showModal && selectedItems) {
      const currentSelected: NodeProduct[] = [];
      for (const selectedItem of selectedItems) {
        if (!currentSelected.some((el) => el.id === selectedItem)) {
          const newSelected = arrFindedProducts.find(
            (el) => el.id === selectedItem,
          );
          if (newSelected) currentSelected.push(newSelected);
        }
      }
      setSelectedProducts(currentSelected);
    }
  }, [showModal]);
  const updateReleaseDate = async () => {
    const formData = new FormData();
    formData.append("ids", selectedProducts.map((el) => el.id).join(";"));
    formData.append(
      "start",
      moment(
        `${formattedStartValue} ${publishStartTime.replace("ET", "").trim()}`,
      ).format(),
    );
    formData.append(
      "end",
      moment(
        `${formattedEndValue} ${publishEndTime.replace("ET", "").trim()}`,
      ).format(),
    );
    fetcher.submit(formData, { method: "post", action: "/app/add-release" });
  };

  return (
    <>
      <div style={{ height: "56px" }} className="test-class">
        <Frame>
          <ContextualSaveBar
            fullWidth
            message="Unsaved changes"
            saveAction={{
              onAction: () => {
                updateReleaseDate().then();
              },
              loading: fetcher.state === "submitting",
              disabled: fetcher.state === "submitting",
            }}
            discardAction={{
              onAction: () => console.log("add clear form logic"),
            }}
          />
        </Frame>
      </div>
      <Page
        title={"New Release"}
        backAction={{ content: "Settings", url: "/app" }}
        secondaryActions={[{ content: "Delete", destructive: false }]}
      >
        <BlockStack gap="200">
          <Card>
            <BlockStack gap="200">
              <InlineGrid columns="1fr auto">
                <Text as="h2" variant="headingSm">
                  Products
                </Text>
                <Button
                  url={"shopify:admin/products/new"}
                  variant="plain"
                  accessibilityLabel="Add new product"
                >
                  Add new product
                </Button>
              </InlineGrid>
              <TextField
                label="Products"
                type="text"
                labelHidden
                value={""}
                placeholder={"Search products"}
                autoComplete="off"
                prefix={<Icon source={SearchIcon} tone={"base"} />}
                connectedRight={openModal}
              />
            </BlockStack>
            <BlockStack gap="200">
              {selectedProducts && (
                <ResourceList
                  items={selectedProducts}
                  renderItem={(item) => {
                    const { id, title, featuredImage } = item;
                    return (
                      <ResourceItem
                        id={id}
                        media={
                          <Avatar
                            customer
                            size="md"
                            name={title}
                            source={
                              featuredImage && featuredImage.url
                                ? featuredImage.url
                                : ""
                            }
                          />
                        }
                        verticalAlignment="center"
                        accessibilityLabel={title}
                        name={title}
                        onClick={() => {}}
                      >
                        <Text variant="bodyMd" fontWeight="bold" as="h3">
                          {title}
                        </Text>
                      </ResourceItem>
                    );
                  }}
                />
              )}
            </BlockStack>
          </Card>
          <Card roundedAbove="sm">
            <Text as="h2" variant="headingSm">
              Publish date
            </Text>
            <Box paddingBlock="200">
              <FormLayout>
                <FormLayout.Group>
                  <Popover
                    active={visibleStartDatePicker}
                    autofocusTarget="none"
                    preferredAlignment="left"
                    fullWidth
                    preferInputActivator={false}
                    preferredPosition="below"
                    preventCloseOnChildOverlayClick
                    onClose={handleOnCloseStartDatePicker}
                    activator={
                      <TextField
                        role="combobox"
                        label={"Start date"}
                        suffix={<Icon source={CalendarIcon} />}
                        value={formattedStartValue}
                        onFocus={() => setVisibleStartDatePicker(true)}
                        onChange={handleInputValueChange}
                        autoComplete="off"
                      />
                    }
                  >
                    <Card>
                      <DatePicker
                        month={startMonth}
                        year={startYear}
                        selected={selectedStartDate}
                        onMonthChange={handleStartMonthChange}
                        onChange={handleStartDateSelection}
                      />
                    </Card>
                  </Popover>
                  <Combobox
                    activator={
                      <Combobox.TextField
                        suffix={<Icon source={ClockIcon} />}
                        onChange={updateText}
                        label="&nbsp;"
                        value={publishStartTime}
                        placeholder="Time"
                        autoComplete="off"
                      />
                    }
                  >
                    {options.length > 0 ? (
                      <Listbox onSelect={updateSelection}>
                        {optionsStartMarkup}
                      </Listbox>
                    ) : null}
                  </Combobox>
                </FormLayout.Group>
              </FormLayout>
            </Box>
            <Box paddingBlockStart="200">
              <FormLayout>
                <FormLayout.Group>
                  <Popover
                    active={visibleEndDatePicker}
                    autofocusTarget="none"
                    preferredAlignment="left"
                    fullWidth
                    preferInputActivator={false}
                    preferredPosition="below"
                    preventCloseOnChildOverlayClick
                    onClose={handleOnCloseEndDatePicker}
                    activator={
                      <TextField
                        role="combobox"
                        label={"End date"}
                        suffix={<Icon source={CalendarIcon} />}
                        value={formattedEndValue}
                        onFocus={() => setVisibleEndDatePicker(true)}
                        onChange={handleInputValueChange}
                        autoComplete="off"
                      />
                    }
                  >
                    <Card>
                      <DatePicker
                        month={endMonth}
                        year={endYear}
                        selected={selectedEndDate}
                        onMonthChange={handleEndMonthChange}
                        onChange={handleEndDateSelection}
                      />
                    </Card>
                  </Popover>
                  <Combobox
                    activator={
                      <Combobox.TextField
                        suffix={<Icon source={ClockIcon} />}
                        onChange={(value) => updateTextTime(value, "end")}
                        label="&nbsp;"
                        value={publishEndTime}
                        placeholder="Time"
                        autoComplete="off"
                      />
                    }
                  >
                    {options.length > 0 ? (
                      <Listbox
                        onSelect={(value) => updateTimeSelection(value, "end")}
                      >
                        {optionsEndMarkup}
                      </Listbox>
                    ) : null}
                  </Combobox>
                </FormLayout.Group>
              </FormLayout>
            </Box>
          </Card>
        </BlockStack>
        <div style={{ height: "70vh" }}>
          <Frame>
            <Modal
              open={showModal}
              onClose={handleModal}
              title="All Products"
              primaryAction={{
                content: "Add",
                onAction: handleModal,
              }}
              secondaryActions={[
                {
                  content: "Cancel",
                  onAction: handleModal,
                },
              ]}
            >
              <Modal.Section>
                <BlockStack gap="300">
                  <TextField
                    label="Products"
                    type="text"
                    labelHidden
                    value={keywordProduct}
                    onChange={handleSearchProduct}
                    placeholder={"Search products"}
                    autoComplete="off"
                    prefix={<Icon source={SearchIcon} tone={"base"} />}
                    connectedRight={<Button icon={FilterIcon}>Filter</Button>}
                  />
                  <Divider />
                  <Text variant="headingSm" as="h6">
                    Products
                  </Text>
                  <Divider />
                  <ResourceList
                    resourceName={{ singular: "product", plural: "products" }}
                    items={arrFindedProducts}
                    selectedItems={selectedItems}
                    onSelectionChange={setSelectedItems}
                    bulkActions={bulkActions}
                    resolveItemId={resolveItemIds}
                    renderItem={(item) => {
                      // @ts-ignore
                      const { id, title, featuredImage } = item;
                      return (
                        <ResourceItem
                          id={id}
                          media={
                            <Avatar
                              customer
                              size="md"
                              name={title}
                              source={
                                featuredImage && featuredImage.url
                                  ? featuredImage.url
                                  : ""
                              }
                            />
                          }
                          verticalAlignment="center"
                          accessibilityLabel={title}
                          name={title}
                          onClick={(e) => {
                            console.log(e, "event");
                          }}
                        >
                          <Text variant="bodyMd" fontWeight="bold" as="h3">
                            {title}
                          </Text>
                        </ResourceItem>
                      );
                    }}
                  />
                </BlockStack>
              </Modal.Section>
            </Modal>
          </Frame>
        </div>
        )
      </Page>
    </>
  );
}
