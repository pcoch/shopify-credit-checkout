import {
  reactExtension,
  Switch,
  Heading,
  InlineLayout,
  Image,
  Button,
  Text,
  useApi,
  Badge,
  BlockStack,
  useAppMetafields,
  useApplyCartLinesChange,
  Icon,
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

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const { query } = useApi();
  const applyCartLinesChange = useApplyCartLinesChange();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vipCredit, setVipCredit] = useState(0);
  const [vipCreditCost, setVipCreditCost] = useState(0);
  const [isVipCreditApplied, setIsVipCreditApplied] = useState(false);
  const [adding, setAdding] = useState(false);

  const appMetafields = useAppMetafields();
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
    setAdding(true);
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
    setAdding(false);

    if (result.type === "error") {
      console.error(result.message);
    }
  }

  if (loading) return null;
  if (!product) return null;

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
        <Text emphasis="bold" appearance="info" size="base">
          ✨ You have {vipCredit} VIP Credits Remaining
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
          </BlockStack>
          <Button kind="secondary" loading={adding} onPress={handleAddToCart}>
            Add
          </Button>
        </InlineLayout>
      </BlockStack>
      <InlineLayout
        spacing="base"
        columns={["90%", "fill"]}
        inlineAlignment="start">
        <BlockStack spacing="none">
          <Text size="base" emphasis="italic">
            Apply VIP Credit?
          </Text>
        </BlockStack>
        <Switch
          accessibilityLabel="my-switch"
          checked={isVipCreditApplied}
          onChange={setIsVipCreditApplied}
          disabled={vipCredit < vipCreditCost}
        />
      </InlineLayout>
    </BlockStack>
  );
}
