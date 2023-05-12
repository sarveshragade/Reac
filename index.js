const API = (() => {
  const URL = "http://localhost:3000";

  const getInventory = () => {
    return fetch(`${URL}/inventory`).then((data) => data.json());
  };

  const getCart = () => {
    return fetch(`${URL}/cart`).then((data) => data.json());
  };

  const addToCart = (item) => {
    return fetch(`${URL}/cart`, {
      method: "POST",
      body: JSON.stringify(item),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((data) => data.json());
  };

  const updateCart = (id, item) => {
    return fetch(`${URL}/cart/${id}`, {
      method: "PUT",
      body: JSON.stringify(item),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((data) => data.json());
  };

  const deleteFromCart = (id) => {
    return fetch(`${URL}/cart/${id}`, {
      method: "DELETE",
    }).then((data) => data.json());
  };

  const checkout = () => {
    return fetch(`${URL}/cart`, {
      method: "DELETE",
    }).then((data) => data.json());
  };

  return {
    getInventory,
    getCart,
    addToCart,
    updateCart,
    deleteFromCart,
    checkout,
  };
})();

const Model = (() => {
  class State {
    #onChange;
    #inventory;
    #cart;

    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }

    get inventory() {
      return this.#inventory;
    }

    set inventory(newInventory) {
      this.#inventory = newInventory;
      this.#onChange();
    }

    get cart() {
      return this.#cart;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }

  const state = new State();

  const initialize = async () => {
    try {
      state.inventory = await API.getInventory();
      state.cart = await API.getCart();
    } catch (error) {
      console.error("Fail", error);
    }
  };

  const addToCart = async (item, amount) => {
    try {
      const existingItem = state.cart.find((cartItem) => cartItem.id === item.id);

      if (existingItem) {
        existingItem.amount += amount;
        await API.updateCart(existingItem.id, existingItem);
      } else {
        const newItem = { ...item, amount };
        await API.addToCart(newItem);
        state.cart.push(newItem);
      }
    } catch (error) {
      console.error("Failedtoadd", error);
    }
  };

  const deleteFromCart = async (id) => {
    try {
      await API.deleteFromCart(id);
      state.cart = state.cart.filter((item) => item.id !== id);
    } catch (error) {
      console.error("Failedtodel", error);
    }
  };

  const checkout = async () => {
    try {
      await API.checkout();
      state.cart = [];
    } catch (error) {
      console.error("Failedtoch", error);
    }
  };

  return {
    State,
    initialize,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const View = (() => {
  const inventoryListEl = document.querySelector(".inventory-list");
  const cartListEl = document.querySelector(".cart-list");
  const checkoutBtnEl = document.querySelector(".checkout-btn");

  const renderInventoryList = (inventory) => {
    inventoryListEl.innerHTML = "";
    inventory.forEach((item) => {
      const itemEl = document.createElement("li");
      itemEl.innerHTML = `
        <span>${item.name}</span>
        <div class="quantity">
          <button class="minus-btn" data-id="${item.id}">-</button>
          <span>${item.amount}</span>
          <button class="plus-btn" data-id="${item.id}">+</button>
        </div>
        <button class="add-to-cart-btn" data-id="${item.id}">Add to Cart</button>
      `;
      inventoryListEl.appendChild(itemEl);
    });
  };

  const renderCartList = (cart) => {
    cartListEl.innerHTML = "";
    cart.forEach((item) => {
      const itemEl = document.createElement("li");
      itemEl.innerHTML = `
        <span>${item.name}</span>
        <div class="quantity">
          <button class="minus-btn" data-id="${item.id}">-</button>
          <span>${item.amount}</span>
          <button class="plus-btn" data-id="${item.id}">+</button>
        </div>
        <button class="delete-btn" data-id="${item.id}">Delete</button>
      `;
      cartListEl.appendChild(itemEl);
    });
  };

  const disableCheckoutButton = () => {
    checkoutBtnEl.disabled = true;
  };

  const enableCheckoutButton = () => {
    checkoutBtnEl.disabled = false;
  };

  return {
    renderInventoryList,
    renderCartList,
    disableCheckoutButton,
    enableCheckoutButton,
  };
})();

const Controller = ((model, view) => {
  const state = new model.State();

  const init = () => {
    state.subscribe(() => {
      view.renderInventoryList(state.inventory);
      view.renderCartList(state.cart);
    });
    view.disableCheckoutButton();
    model.initialize();
  };

  const handleUpdateAmount = (event) => {
    const itemId = parseInt(event.target.dataset.id);
    const amount = event.target.classList.contains("minus-btn") ? -1 : 1;
    const item = state.inventory.find((item) => item.id === itemId);

    if (item) {
      const updatedAmount = item.amount + amount;
      if (updatedAmount >= 0) {
        item.amount = updatedAmount;
        state.inventory = [...state.inventory];
      }
    }
  };

  const handleAddToCart = (event) => {
    const itemId = parseInt(event.target.dataset.id);
    const item = state.inventory.find((item) => item.id === itemId);

    if (item) {
      model.addToCart(item, item.amount);
    }
  };

  const handleDelete = (event) => {
    const itemId = parseInt(event.target.dataset.id);
    model.deleteFromCart(itemId);
  };

  const handleCheckout = () => {
    model.checkout();
  };

  const bootstrap = () => {
    init();

    inventoryListEl.addEventListener("click", handleUpdateAmount);
    inventoryListEl.addEventListener("click", handleAddToCart);
    cartListEl.addEventListener("click", handleUpdateAmount);
    cartListEl.addEventListener("click", handleDelete);
    checkoutBtnEl.addEventListener("click", handleCheckout);
  };

  return {
    bootstrap,
  };
})(Model, View);

Controller.bootstrap();


