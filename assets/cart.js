class CartRemoveButton extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("click", (event) => {
      event.preventDefault();
      const cartItems = this.closest("cart-items");
      if (cartItems) {
        cartItems.updateQuantity(this.dataset.index, 0);
      }
    });
  }
}

customElements.define("cart-remove-button", CartRemoveButton);

// QuantityInput is defined in global.js and used here
// Removed duplicate definition to avoid confusion

class CartItems extends HTMLElement {
  constructor() {
    super();

    this.lineItemStatusElement = document.getElementById(
      "shopping-cart-line-item-status",
    );

    this.currentItemCount = Array.from(
      this.querySelectorAll('[name="updates[]"]'),
    ).reduce(
      (total, quantityInput) => total + parseInt(quantityInput.value),
      0,
    );

    this.debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, 300);

    this.addEventListener("change", this.debouncedOnChange.bind(this));
  }

  onChange(event) {
    this.updateQuantity(
      event.target.dataset.index,
      event.target.value,
      document.activeElement.getAttribute("name"),
    );
  }

  getSectionsToRender() {
    const sections = [];

    // Main cart items
    const cartItems = document.getElementById("main-cart-items");
    if (cartItems && cartItems.dataset.id) {
      sections.push({
        id: "main-cart-items",
        section: cartItems.dataset.id,
        selector: ".js-contents",
      });
    }

    // Cart icon bubble
    sections.push({
      id: "cart-icon-bubble",
      section: "cart-icon-bubble",
      selector: ".shopify-section",
    });

    // Cart notification
    sections.push({
      id: "cart-notification",
      section: "cart-notification-product",
      selector: ".shopify-section",
    });

    // Cart live region
    sections.push({
      id: "cart-live-region-text",
      section: "cart-live-region-text",
      selector: ".shopify-section",
    });

    // Main cart footer
    const cartFooter = document.getElementById("main-cart-footer");
    if (cartFooter && cartFooter.dataset.id) {
      sections.push({
        id: "main-cart-footer",
        section: cartFooter.dataset.id,
        selector: ".js-contents",
      });
    }

    return sections;
  }

  updateQuantity(line, quantity, name) {
    this.enableLoading(line);

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
    });

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);

        this.classList.toggle("is-empty", parsedState.item_count === 0);
        const cartFooter = document.getElementById("main-cart-footer");

        if (cartFooter)
          cartFooter.classList.toggle("is-empty", parsedState.item_count === 0);

        this.getSectionsToRender().forEach((section) => {
          const element = document.getElementById(section.id);
          if (!element) {
            return;
          }

          const elementToReplace =
            element.querySelector(section.selector) || element;

          const sectionHTML = parsedState.sections[section.section];
          if (!sectionHTML) {
            return;
          }

          const newHTML = this.getSectionInnerHTML(
            sectionHTML,
            section.selector,
          );
          elementToReplace.innerHTML = newHTML;
        });

        this.updateLiveRegions(line, parsedState.item_count);
        const lineItem = document.getElementById(`CartItem-${line}`);
        if (lineItem) {
          const focusElement = lineItem.querySelector(`[name="${name}"]`);
          if (focusElement) focusElement.focus();
        }
        this.disableLoading();
      })
      .catch((error) => {
        this.querySelectorAll(".loading-overlay").forEach((overlay) =>
          overlay.classList.add("hidden"),
        );
        document.getElementById("cart-errors").textContent =
          window.cartStrings.error;
        this.disableLoading();
      });
  }

  updateLiveRegions(line, itemCount) {
    if (this.currentItemCount === itemCount) {
      document
        .getElementById(`Line-item-error-${line}`)
        .querySelector(".cart-item__error-text").innerHTML =
        window.cartStrings.quantityError.replace(
          "[quantity]",
          document.getElementById(`Quantity-${line}`).value,
        );
    }

    this.currentItemCount = itemCount;
    this.lineItemStatusElement.setAttribute("aria-hidden", true);

    const cartStatus = document.getElementById("cart-live-region-text");
    cartStatus.setAttribute("aria-hidden", false);

    setTimeout(() => {
      cartStatus.setAttribute("aria-hidden", true);
    }, 1000);
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    document
      .getElementById("main-cart-items")
      .classList.add("cart__items--disabled");
    this.querySelectorAll(`#CartItem-${line} .loading-overlay`).forEach(
      (overlay) => overlay.classList.remove("hidden"),
    );
    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute("aria-hidden", false);
  }

  disableLoading() {
    document
      .getElementById("main-cart-items")
      .classList.remove("cart__items--disabled");
  }
}

customElements.define("cart-items", CartItems);
