  const API = (() => {
  const URL = "http://localhost:3000";
  
  const getCart = () => {
    return fetch(URL + '/cart').then(response => response.json());
  };

  const getInventory = () => {
    return fetch(URL + '/inventory').then(response => response.json());
  };

  const addToCart = (item) => {
    return fetch(URL + '/cart', {
      method: "POST",
      body: JSON.stringify(item),
      headers: {
        "Content-Type": "application/json",
      },
    }).then(response => response.json());
  };

  const updateCart = (id, newAmount) => {
    return fetch(URL + '/cart/' + id, {
      method: "PUT",
      body: JSON.stringify({ amount: newAmount }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then(response => response.json());
  };

  const deleteFromCart = (id) => {
    return fetch(URL + "/cart/" + id, {
      method: "DELETE"
    }).then(response => response.json());
  };

  const checkout = () => {
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
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

    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }

    set inventory(newInventory) {
      this.#inventory = newInventory;
      this.#onChange();
    }

    updateInventory(id, updateAmount) {
      const itemIndex = this.#inventory.findIndex(item => item.id === id);
      if (itemIndex !== -1) {
        this.#inventory[itemIndex].count = Math.max(0, this.#inventory[itemIndex].count + updateAmount);
      }
      this.#onChange();
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }

  const {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  } = API;

  return {
    State,
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const View = (() => {
  const inventoryEl = document.querySelector('.inventory-container ul');
  const cartEl = document.querySelector('.cart-wrapper ul');
  const checkoutBtn = document.querySelector('.checkout-btn');

  const renderCartItems = (cartItems) => {
    let cartItemsTemp = "";
    cartItems.forEach((cartItem) => {
      const liTemp = `<li cartItem-id="${cartItem.id}">
        <span>${cartItem.content}</span>
        <span> X ${cartItem.count}</span>
        <button class="delete-btn">Delete</button>
      </li>`;
      cartItemsTemp += liTemp;
    });
    cartEl.innerHTML = cartItemsTemp;
  };

  const renderInventoryItems = (inventoryItems) => {
    let inventoryItemsTemp = "";
    inventoryItems.forEach((inventoryItem) => {
      const liTemp = `<li inventoryItem-id="${inventoryItem.id}">
        <span>${inventoryItem.content}</span>
        <button class="reduce-btn">-</button>
        <span>${inventoryItem.count}</span>
        <button class="add-btn">+</button>
        <button class="add-to-cart-btn">add to cart</button>
      </li>`;
      inventoryItemsTemp += liTemp;
    });
    inventoryEl.innerHTML = inventoryItemsTemp;
  };

  return {
    renderInventoryItems,
    renderCartItems,
    inventoryEl,
    cartEl,
    checkoutBtn
  };
})();

const Controller = ((model, view) => {
  const state = new model.State();

  const init = () => {
    model.getCart().then((data) => {
      const cartItems = data.map((item) => {
        if ('count' in item) {
          return item;
        } else {
          return { ...item, count: 0 };
        }
      });
      state.cart = cartItems;
    });

    model.getInventory().then((data) => {
      const inventoryItems = data.map((item) => ({ ...item, count: 0 }));
      state.inventory = inventoryItems;
    });
  };

  const handleUpdateAmount = () => {
    view.inventoryEl.addEventListener("click", (event) => {
      if (event.target.className !== "reduce-btn") return;
      const id = parseInt(event.target.parentNode.getAttribute("inventoryItem-id"));
      state.updateInventory(id, -1);
    });

    view.inventoryEl.addEventListener("click", (event) => {
      if (event.target.className !== "add-btn") return;
      const id = parseInt(event.target.parentNode.getAttribute("inventoryItem-id"));
      state.updateInventory(id, 1);
    });
  };

  const handleAddToCart = () => {
    view.inventoryEl.addEventListener("click", (event) => {
      if (event.target.className !== "add-to-cart-btn") return;
      const id = parseInt(event.target.parentNode.getAttribute("inventoryItem-id"));
      const item = state.inventory.find((item) => item.id === id);
      model.addToCart(item).then((data) => {
        const updatedCart = [...state.cart, data];
        state.cart = updatedCart;
        state.updateInventory(id, -Infinity);
      });
    });
  };

  const handleDelete = () => {
    view.cartEl.addEventListener("click", (event) => {
      if (event.target.className !== "delete-btn") return;
      const id = parseInt(event.target.parentNode.getAttribute("cartItem-id"));
      model.deleteFromCart(id).then(() => {
        const updatedCart = state.cart.filter((item) => item.id !== id);
        state.cart = updatedCart;
      });
    });
  };

  const handleCheckout = () => {
    view.checkoutBtn.addEventListener("click", () => {
      model.checkout().then(() => {
        state.cart = [];
        console.log("Checkout successful");
      });
    });
  };

  const bootstrap = () => {
    handleAddToCart();
    handleDelete();
    handleUpdateAmount();
    handleCheckout();
    init();
    state.subscribe(() => {
      view.renderInventoryItems(state.inventory);
      view.renderCartItems(state.cart);
    });
  };

  return {
    bootstrap,
  };
})(Model, View);

Controller.bootstrap();


