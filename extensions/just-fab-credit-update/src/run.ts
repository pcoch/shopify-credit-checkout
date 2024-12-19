import type { RunInput, FunctionRunResult } from "../generated/api";

export function run(input: RunInput): FunctionRunResult {
  console.log("Cart transform function running", input);
  const { lines } = input.cart;

  // Check each line for VIP credit attribute
  const linesToUpdate = lines.filter(
    (line) => line.attribute?.value === "true"
  );

  if (linesToUpdate.length === 0) {
    return { operations: [] };
  }

  // Create update operations for lines with VIP credit
  return {
    operations: linesToUpdate.map((line) => ({
      update: {
        cartLineId: line.id,
        price: {
          adjustment: {
            fixedPricePerUnit: {
              amount: "0",
            },
          },
        },
      },
    })),
  };
}
