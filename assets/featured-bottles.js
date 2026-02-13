/**
 * Featured Bottles Add to Cart Handler
 * Handles adding products to cart from the featured bottles section
 */

document.addEventListener("DOMContentLoaded", function () {
  // Find all add to cart buttons in featured bottles section
  const addToCartButtons = document.querySelectorAll(
    ".featured-bottle-card__button--add-to-cart",
  );

  addToCartButtons.forEach((button) => {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation(); // Prevent the link from navigating

      const variantId = this.getAttribute("data-product-id");

      if (!variantId) {
        console.error("No variant ID found for this product");
        return;
      }

      // Add loading state
      const originalText = this.textContent;
      this.textContent = "Adding...";
      this.style.pointerEvents = "none";

      // Prepare the cart add request
      const formData = {
        items: [
          {
            id: variantId,
            quantity: 1,
          },
        ],
      };

      // Send request to add to cart
      fetch("/cart/add.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Product added to cart:", data);

          // Update button text
          this.textContent = "Added!";

          // Update cart count if cart icon exists
          updateCartCount();

          // Open cart drawer if it exists
          if (typeof openCartDrawer === "function") {
            openCartDrawer();
          }

          // Reset button after 2 seconds
          setTimeout(() => {
            this.textContent = originalText;
            this.style.pointerEvents = "auto";
          }, 2000);
        })
        .catch((error) => {
          console.error("Error adding to cart:", error);
          this.textContent = "Error - Try Again";
          this.style.pointerEvents = "auto";

          // Reset button after 2 seconds
          setTimeout(() => {
            this.textContent = originalText;
          }, 2000);
        });
    });
  });

  /**
   * Update cart count in header
   */
  function updateCartCount() {
    fetch("/cart.js")
      .then((response) => response.json())
      .then((cart) => {
        // Update cart count bubble if it exists
        const cartCountBubble = document.querySelector(".cart-count-bubble");
        if (cartCountBubble) {
          cartCountBubble.textContent = cart.item_count;

          // Show bubble if hidden
          if (cart.item_count > 0) {
            cartCountBubble.style.display = "block";
          }
        }

        // Update any other cart count elements
        const cartCounts = document.querySelectorAll("[data-cart-count]");
        cartCounts.forEach((element) => {
          element.textContent = cart.item_count;
        });
      })
      .catch((error) => {
        console.error("Error updating cart count:", error);
      });
  }
});
