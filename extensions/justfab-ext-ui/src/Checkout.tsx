import {
  reactExtension,
  Switch,
  Heading,
  InlineLayout,
  Image,
  Button,
  Text,
  useApi,
  BlockStack,
  useAppMetafields,
  useApplyCartLinesChange,
  SkeletonText,
  SkeletonImage,
  Banner,
  useCustomer,
} from "@shopify/ui-extensions-react/checkout";

import { useEffect, useState } from "react";

interface ProductQueryResponse {
  product: {
    id: string;
    title: string;
    images: {
      nodes: { url: string }[];
    };
    variants: {
      nodes: {
        id: string;
        price: { amount: string };
      }[];
    };
    metafields: {
      value: string;
      key: string;
      namespace: string;
    }[];
  };
}

export default reactExtension("purchase.checkout.block.render", () => <App />);

function App() {
  const { query } = useApi();
  const applyCartLinesChange = useApplyCartLinesChange();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vipCredit, setVipCredit] = useState(0);
  const [vipCreditCost, setVipCreditCost] = useState(0);
  const [isVipCreditApplied, setIsVipCreditApplied] = useState(false);
  const [adding, setAdding] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isTogglingCredit, setIsTogglingCredit] = useState(false);

  const appMetafields = useAppMetafields();
  const customer = useCustomer();

  useEffect(() => {
    if (appMetafields.length > 0) {
      // Get VIP credit balance
      const creditBalance = appMetafields.find(
        (m) => m.metafield.key === "vip_credit"
      );

      if (creditBalance) {
        setVipCredit(Number(creditBalance.metafield.value));
      }

      // Get VIP credit cost
      const creditCost = appMetafields.find(
        (m) => m.metafield.key === "vip_credit_cost"
      );

      try {
        if (creditCost) {
          const parsedCost = Number(creditCost.metafield.value);
          setVipCreditCost(parsedCost);
        } else {
          console.error("VIP credit cost metafield not found");
        }
      } catch (error) {
        console.error("Error parsing credit cost:", error);
      }
    }
  }, [appMetafields]);

  useEffect(() => {
    async function fetchProduct() {
      setIsLoadingProduct(true);
      try {
        const response = await query<ProductQueryResponse>(
          `query {
            product(id: "gid://shopify/Product/9582176567613") {
              id
              title
              images(first:1){
                nodes {
                  url
                }
              }
              variants(first: 1) {
                nodes {
                  id
                  price {
                    amount
                  }
                }
              }
              metafields(identifiers: [
                {
                  namespace: "custom",
                  key: "vip_credit_cost"
                }
              ]) {
                value
                key
                namespace
              }
            }
          }`
        );

        if (!response.data) {
          console.error("No data in response");
          return;
        }

        if (!response.data.product) {
          console.error("No product found");
          return;
        }

        setProduct(response.data.product);

        // Find and set the VIP credit cost from product metafields
        const creditCostMetafield = response.data.product.metafields[0];

        if (creditCostMetafield) {
          setVipCreditCost(Number(creditCostMetafield.value));
        } else {
          console.error("VIP credit cost metafield not found on product");
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching product:", error.message);
        setLoading(false);
        setShowError(true);
      } finally {
        setIsLoadingProduct(false);
      }
    }

    fetchProduct();
  }, []);

  useEffect(() => {
    console.log("VIP Credit Applied:", isVipCreditApplied);

    if (isVipCreditApplied) {
      setVipCredit((prevCredit) => prevCredit - vipCreditCost);
    } else if (!isVipCreditApplied && vipCreditCost > 0) {
      setVipCredit((prevCredit) => prevCredit + vipCreditCost);
    }
  }, [isVipCreditApplied]);

  async function handleAddToCart() {
    setIsUpdatingCart(true);
    setAdding(true);
    try {
      const result = await applyCartLinesChange({
        type: "addCartLine",
        merchandiseId: product.variants.nodes[0].id,
        quantity: 1,
        attributes: [
          {
            key: "_vip_credit_applied",
            value: isVipCreditApplied.toString(),
          },
        ],
      });

      if (result.type === "error") {
        setShowError(true);
      }
    } catch (error) {
      setShowError(true);
    } finally {
      setAdding(false);
      setIsUpdatingCart(false);
    }
  }

  const handleCreditToggle = async (newValue: boolean) => {
    setIsTogglingCredit(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsVipCreditApplied(newValue);
    setIsTogglingCredit(false);
  };

  if (!customer?.id) {
    return null;
  }

  if (isLoadingProduct) {
    return <LoadingSkeleton />;
  }

  if (loading) return null;
  if (!product) return null;

  const hasNoCredits = vipCredit <= 0;

  return (
    <BlockStack spacing="loose">
      <Heading level={2}>Your VIP Gift</Heading>
      <InlineLayout
        border="base"
        borderRadius="loose"
        padding="base"
        spacing="base"
        columns={["fill"]}
        inlineAlignment="start"
        background="subdued">
        <Text
          emphasis="bold"
          appearance={hasNoCredits ? "subdued" : "info"}
          size="base">
          {hasNoCredits
            ? "You have no VIP Credits remaining"
            : `✨ You have ${vipCredit} VIP Credits Remaining`}
        </Text>
      </InlineLayout>
      <BlockStack spacing="loose">
        <InlineLayout
          spacing="base"
          columns={[74, "fill", "auto"]}
          blockAlignment="center">
          <Image
            border="base"
            borderWidth="base"
            borderRadius="loose"
            source={product.images.nodes[0].url}
            accessibilityDescription={product.title}
            aspectRatio={1}
          />
          <BlockStack spacing="none">
            <Text size="medium" emphasis="bold">
              {product.title}
            </Text>
            {isTogglingCredit ? (
              <PriceLoadingSkeleton />
            ) : (
              <>
                <Text
                  size="base"
                  appearance={isVipCreditApplied ? "success" : "subdued"}>
                  {isVipCreditApplied
                    ? "Free - Credit Applied ✓"
                    : `$${product.variants.nodes[0].price.amount}`}
                </Text>
                <Text size="base" appearance="accent">
                  Required Credits: {vipCreditCost}
                </Text>
              </>
            )}
          </BlockStack>
          <Button
            kind="secondary"
            loading={adding}
            onPress={handleAddToCart}
            disabled={
              hasNoCredits ||
              adding ||
              !isVipCreditApplied ||
              vipCredit < vipCreditCost
            }>
            Add
          </Button>
        </InlineLayout>
      </BlockStack>
      <InlineLayout
        spacing="base"
        columns={["90%", "fill"]}
        inlineAlignment="start">
        <BlockStack spacing="none">
          {isTogglingCredit ? (
            <Text size="base" emphasis="italic">
              <SkeletonText inlineSize="small" />
            </Text>
          ) : (
            <Text size="base" emphasis="italic">
              {isVipCreditApplied ? "VIP Credit Applied" : "Apply VIP Credit?"}
            </Text>
          )}
        </BlockStack>
        <Switch
          accessibilityLabel="my-switch"
          checked={isVipCreditApplied}
          onChange={handleCreditToggle}
          disabled={
            hasNoCredits || vipCredit < vipCreditCost || isTogglingCredit
          }
        />
      </InlineLayout>
      {showError && (
        <Banner status="critical">There was an issue. Please try again.</Banner>
      )}
    </BlockStack>
  );
}

function LoadingSkeleton() {
  return (
    <BlockStack spacing="loose">
      <Heading level={2}>Your VIP Gift</Heading>
      <InlineLayout
        border="base"
        borderRadius="loose"
        padding="base"
        spacing="base"
        columns={["fill"]}
        inlineAlignment="start"
        background="subdued">
        <SkeletonText inlineSize="large" />
      </InlineLayout>
      <BlockStack spacing="loose">
        <InlineLayout
          spacing="base"
          columns={[74, "fill", "auto"]}
          blockAlignment="center">
          <SkeletonImage aspectRatio={1} />
          <BlockStack spacing="none">
            <SkeletonText inlineSize="large" />
            <SkeletonText inlineSize="base" />
            <SkeletonText inlineSize="small" />
          </BlockStack>
          <SkeletonText inlineSize="small" />
        </InlineLayout>
      </BlockStack>
      <InlineLayout
        spacing="base"
        columns={["90%", "auto"]}
        inlineAlignment="start">
        <BlockStack spacing="none">
          <SkeletonText inlineSize="base" />
        </BlockStack>
        <SkeletonText inlineSize="small" />
      </InlineLayout>
    </BlockStack>
  );
}

function PriceLoadingSkeleton() {
  return (
    <>
      <Text size="base">
        <SkeletonText inlineSize="small" />
      </Text>
      <Text size="base" appearance="accent">
        <SkeletonText inlineSize="small" />
      </Text>
    </>
  );
}
