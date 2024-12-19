# Demo
[Video Demo](https://screenshot.click/19-02-4z9vc-lky5q.mp4) (3 mins)

[Live store](https://plustestpcoch.myshopify.com/)

# Why build custom?

Checkout Blocks but Upsell components are now legacy.
Apps like https://apps.shopify.com/anvil-checkout which support upsells, but they don’t have functionality to set custom logic like “only render if customer metafield = x"

# How this app works

Checkout UI extension queries API to pull in a specific VIP product
Checkout UI checks customer metafield for total credit value
Switch toggle component updates UI to show credit and toggles a line item attribute on the gift
Cart Transform Function reads the attribute and runs update operation to reduce price to $0

# Things this MVP omits

- No skeleton loading
- Doesn't deduct from customer metafied is credit used (this is doable though)
- No UI for removing gift once added - this could easily be fixed with Checkout Blocks (it can add in qty selectors)
- Some react bugs with credit value updating need fixing...
- Setting for user to select which VIP product is queries and rendered (currently hard coded)
- Feedback messages when credits are applied/removed (Disable the "Add" button if customer doesn't have enough credits)
- Probably other things I haven't considered!

# More features to add

Error Handling & Validation:
What happens if the VIP product is out of stock? 2. What if a customer tries to add multiple VIP products? 3. Should we validate that the customer has enough credits before allowing the toggle?
Error handling for failed API calls or cart updates

User Experience:
Add loading states for API calls and cart updates
Feedback messages when credits are applied/removed
Disable the "Add" button if customer doesn't have enough credits
Confirmation dialog before using credits

Data Integrity:
Prevent applying credits multiple times to the same product
Handle race conditions if customer rapidly toggles the switch
Validate credit balance before each operation
Ensure credits can't go negative

Business Logic:
Should there be a limit on how many VIP products per order?
What happens if customer removes and re-adds the product?
Should credits be reserved when applied and released if order cancelled?
Handle cases where product price changes after credits applied

Technical Improvements:
Add TypeScript interfaces for all data structures
Add error boundaries for React components

#### Local Development

[The Shopify CLI](https://shopify.dev/docs/apps/tools/cli) connects to an app in your Partners dashboard. It provides environment variables and runs commands in parallel.

You can develop locally using your preferred package manager. Run one of the following commands from the root of your app.

Using yarn:

```shell
yarn dev
```

Using npm:

```shell
npm run dev
```

Using pnpm:

```shell
pnpm run dev
```

Open the URL generated in your console. Once you grant permission to the app, you can start development (such as generating extensions).

## Developer resources

- [Introduction to Shopify apps](https://shopify.dev/docs/apps/getting-started)
- [App extensions](https://shopify.dev/docs/apps/build/app-extensions)
- [Extension only apps](https://shopify.dev/docs/apps/build/app-extensions/build-extension-only-app)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
