const siteName = "https://www.app.marcotest.it"; // Inserisci il nome del sito qui
const consumerKey = "ck_d4415be39317b7450d26142e2e2bca9a7769cf23"; // Inserisci la tua consumer key qui
const consumerSecret = "cs_9cc71c4a56cced29f6266f7c809489c03874e389"; // Inserisci la tua consumer secret qui

const placeholderImage = "https://via.placeholder.com/150"; // URL dell'immagine placeholder online

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/service-worker.js").then(
      function (registration) {
        console.log(
          "ServiceWorker registration successful with scope: ",
          registration.scope
        );
      },
      function (error) {
        console.log("ServiceWorker registration failed: ", error);
      }
    );
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const productsContainer = document.getElementById("products");
  const productDetailContainer = document.getElementById("product-detail");
  const productDetailContent = document.getElementById(
    "product-detail-content"
  );
  const backButton = document.getElementById("back-button");
  const cartIcon = document.getElementById("cart-icon");
  const cartContainer = document.getElementById("cart");
  const cartContent = document.getElementById("cart-content");
  const checkoutButton = document.getElementById("checkout-button");
  const backToProductsButton = document.getElementById(
    "back-to-products-button"
  );
  const checkoutContainer = document.getElementById("checkout");
  const backToCartButton = document.getElementById("back-to-cart-button");
  const checkoutForm = document.getElementById("checkout-form");

  try {
    const response = await fetch(
      `${siteName}/wp-json/wc/v3/products?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const products = await response.json();
    console.log("Fetched products:", products);

    products.forEach((product) => {
      const productElement = document.createElement("div");
      productElement.className = "product col-md-6";
      const productImage =
        product.images.length > 0 ? product.images[0].src : placeholderImage;
      productElement.innerHTML = `
                <img src="${productImage}" alt="${product.name}">
                <h2>${product.name}</h2>
                <p>${product.price}</p>
            `;
      productElement.addEventListener("click", () => {
        console.log("Product clicked:", product);
        showProductDetail(product);
      });
      productsContainer.appendChild(productElement);
    });
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  backButton.addEventListener("click", () => {
    console.log("Back button clicked");
    productDetailContainer.classList.add("d-none");
    productsContainer.classList.remove("d-none");
  });

  cartIcon.addEventListener("click", () => {
    console.log("Cart icon clicked");
    showCart();
  });

  checkoutButton.addEventListener("click", () => {
    console.log("Checkout button clicked");
    cartContainer.classList.add("d-none");
    checkoutContainer.classList.remove("d-none");
  });

  backToProductsButton.addEventListener("click", () => {
    console.log("Back to products button clicked");
    cartContainer.classList.add("d-none");
    productsContainer.classList.remove("d-none");
  });

  backToCartButton.addEventListener("click", () => {
    console.log("Back to cart button clicked");
    checkoutContainer.classList.add("d-none");
    cartContainer.classList.remove("d-none");
  });

  checkoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log("Checkout form submitted");

    const formData = new FormData(checkoutForm);
    const orderData = {
      payment_method: "bacs",
      payment_method_title: "Direct Bank Transfer",
      set_paid: false,
      billing: {
        first_name: formData.get("first-name"),
        last_name: formData.get("last-name"),
        address_1: formData.get("address"),
        city: formData.get("city"),
        postcode: formData.get("postcode"),
        country: formData.get("country"),
        email: formData.get("email"),
      },
      line_items: [],
    };

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.forEach((item) => {
      orderData.line_items.push({
        product_id: item.id,
        quantity: item.quantity,
      });
    });

    try {
      const response = await fetch(`${siteName}/wp-json/wc/v3/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa(consumerKey + ":" + consumerSecret),
        },
        body: JSON.stringify(orderData),
      });

      const order = await response.json();
      console.log("Order created:", order);

      alert("Order placed successfully!");
      localStorage.removeItem("cart");
      checkoutContainer.classList.add("d-none");
      productsContainer.classList.remove("d-none");
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to place order. Please try again.");
    }
  });

  async function showProductDetail(product) {
    console.log("Showing product detail for:", product);

    // Recupera le varianti del prodotto
    let variants = [];
    try {
      const response = await fetch(
        `${siteName}/wp-json/wc/v3/products/${product.id}/variations?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      variants = await response.json();
      console.log("Fetched product variants:", variants);
    } catch (error) {
      console.error("Error fetching product variants:", error);
    }

    const productImages =
      product.images.length > 0
        ? product.images
            .map((image) => `<img src="${image.src}" alt="${product.name}">`)
            .join("")
        : `<img src="${placeholderImage}" alt="Placeholder">`;
    let variantOptions = "";

    if (variants.length > 0) {
      const sizes = [
        ...new Set(
          variants
            .map((variant) => {
              const sizeAttr = variant.attributes.find(
                (attr) => attr.name.toLowerCase() === "taglia"
              );
              return sizeAttr ? sizeAttr.option : null;
            })
            .filter((option) => option)
        ),
      ];

      const colors = [
        ...new Set(
          variants
            .map((variant) => {
              const colorAttr = variant.attributes.find(
                (attr) => attr.name.toLowerCase() === "colore"
              );
              return colorAttr ? colorAttr.option : null;
            })
            .filter((option) => option)
        ),
      ];

      variantOptions = `
                <div class="form-group">
                    <label for="size">Taglia:</label>
                    <select id="size" name="size" class="form-control">
                        ${sizes
                          .map(
                            (size) => `<option value="${size}">${size}</option>`
                          )
                          .join("")}
                    </select>
                </div>
                <div class="form-group">
                    <label for="color">Colore:</label>
                    <select id="color" name="color" class="form-control">
                        ${colors
                          .map(
                            (color) =>
                              `<option value="${color}">${color}</option>`
                          )
                          .join("")}
                    </select>
                </div>
            `;
    }

    productDetailContent.innerHTML = `
            ${productImages}
            <h2>${product.name}</h2>
            <p>${product.price}</p>
            <p>${product.short_description}</p>
            ${variantOptions}
            <button id="add-to-cart-button" class="btn btn-primary">Add to Cart</button>
        `;

    document
      .getElementById("add-to-cart-button")
      .addEventListener("click", () => addToCart(product, variants));
    productDetailContainer.classList.remove("d-none");
    productsContainer.classList.add("d-none");

    if (variants.length > 0) {
      document
        .getElementById("size")
        .addEventListener("change", updateVariantImage);
      document
        .getElementById("color")
        .addEventListener("change", updateVariantImage);
    }

    function updateVariantImage() {
      const selectedSize = document.getElementById("size").value;
      const selectedColor = document.getElementById("color").value;
      const selectedVariant = variants.find((variant) => {
        return (
          variant.attributes.find(
            (attr) => attr.name.toLowerCase() === "taglia"
          )?.option === selectedSize &&
          variant.attributes.find(
            (attr) => attr.name.toLowerCase() === "colore"
          )?.option === selectedColor
        );
      });

      if (
        selectedVariant &&
        selectedVariant.image &&
        selectedVariant.image.src
      ) {
        productDetailContent.querySelector("img").src =
          selectedVariant.image.src;
      } else {
        productDetailContent.querySelector("img").src =
          product.images.length > 0 ? product.images[0].src : placeholderImage;
      }
    }
  }

  function showCart() {
    console.log("Showing cart");
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cartContent.innerHTML = "";
    if (cart.length === 0) {
      cartContent.innerHTML = "<p>Your cart is empty.</p>";
    } else {
      cart.forEach((item) => {
        cartContent.innerHTML += `
                    <div class="cart-item">
                        <h3>${item.name}</h3>
                        <p>Quantity: ${item.quantity}</p>
                        <p>Price: ${item.price}</p>
                    </div>
                `;
      });
    }
    cartContainer.classList.remove("d-none");
    productsContainer.classList.add("d-none");
    productDetailContainer.classList.add("d-none");
  }

  function addToCart(product, variants) {
    const selectedSize = document.getElementById("size")?.value;
    const selectedColor = document.getElementById("color")?.value;
    const selectedVariant = variants.find((variant) => {
      return (
        variant.attributes.find((attr) => attr.name.toLowerCase() === "taglia")
          ?.option === selectedSize &&
        variant.attributes.find((attr) => attr.name.toLowerCase() === "colore")
          ?.option === selectedColor
      );
    });

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const productInCart = cart.find(
      (item) => item.id === (selectedVariant ? selectedVariant.id : product.id)
    );
    if (productInCart) {
      productInCart.quantity += 1;
    } else {
      cart.push({
        ...product,
        id: selectedVariant ? selectedVariant.id : product.id,
        name: `${product.name} - ${selectedSize}/${selectedColor}`,
        quantity: 1,
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    alert("Product added to cart!");
  }
});
