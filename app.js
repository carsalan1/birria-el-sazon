// Configuración de Firebase
const firebaseConfig = {
    apiKey: "", // <-- Coloca tu apiKey
    authDomain: "", // <-- Coloca tu authDomain
    databaseURL: "https://birria-c2b8a-default-rtdb.firebaseio.com/",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  };
  
  // Inicializar Firebase
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
  
  // Variables de sesión
  let clientName = localStorage.getItem('clientName') || "";
  let ticketNumber = localStorage.getItem('ticketNumber') || "";
  let confirmedOrder = JSON.parse(localStorage.getItem('confirmedOrder') || "[]");
  let currentOrder = JSON.parse(localStorage.getItem('currentOrder') || "[]");
  let totalConfirmed = parseFloat(localStorage.getItem('totalConfirmed')) || 0;
  let totalCurrent = parseFloat(localStorage.getItem('totalCurrent')) || 0;
  let quantities = {};
  let clientPassword = "";
  
  // Cargar contraseña de cliente
  firebase.database().ref('configuracion/passwordCliente').get().then(snapshot => {
    if (snapshot.exists()) {
      clientPassword = snapshot.val();
    } else {
      clientPassword = "1234";
      firebase.database().ref('configuracion').set({ passwordCliente: clientPassword });
    }
  });
  
  // Menú de productos
  const groupedMenu = [
    {
      image: 'imagenes/taco-birria.jpg',
      options: [
        { name: 'Taco de birria', price: 28 },
        { name: 'Orden de 4 pzs. con consomé individual', price: 100 }
      ]
    },
    {
      image: 'imagenes/consome.jpg',
      options: [
        { name: 'Vaso individual de consomé', price: 20 },
        { name: 'Medio litro de consomé', price: 50 },
        { name: 'Litro de consomé', price: 90 }
      ]
    },
    {
      image: 'imagenes/taco-cochinita.jpg',
      options: [
        { name: 'Taco de cochinita', price: 28 },
        { name: 'Orden de 4 tacos de cochinita', price: 100 }
      ]
    },
    {
      image: 'imagenes/quesadilla-sesos.jpg',
      options: [
        { name: 'Quesadilla de seso', price: 13 }
      ]
    },
    {
      image: 'imagenes/agua.jpg',
      options: [
        { name: 'Agua de sabor medio litro', price: 15 },
        { name: 'Agua de sabor litro', price: 30 }
      ]
    },
    {
      image: 'imagenes/refresco.jpg',
      options: [
        { name: 'Refresco', price: 25 }
      ]
    },
    {
      image: 'imagenes/flan.jpg',
      options: [
        { name: 'Flan', price: 20 }
      ]
    }
  ];
  
  // Recuperar sesión activa
  if (clientName && ticketNumber) {
    showWelcome();

    renderMenu();
    document.getElementById('login').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    document.getElementById('order-summary').style.display = 'block';
    updateOrder();
  }
  
  // Funciones principales
  function registerName() {
    clientName = document.getElementById('name').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
  
    if (clientName.toLowerCase() === "admin") {
      let password = prompt("Introduce la contraseña de administrador:");
      if (password === "12345") {
        document.getElementById('login').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
      } else {
        alert("Contraseña de administrador incorrecta");
      }
    } else if (clientName !== "") {
      if (passwordInput !== clientPassword) {
        alert("Contraseña de cliente incorrecta");
        return;
      }
  
      if (!ticketNumber) {
        database.ref('contador/ultimoTicket').get().then(snapshot => {
          let ultimo = snapshot.exists() ? snapshot.val() : 0;
          ticketNumber = (ultimo + 1).toString().padStart(4, '0');
          database.ref('contador').set({ ultimoTicket: parseInt(ticketNumber) });
          saveSession();
          showWelcome();
          document.getElementById('login').style.display = 'none';
          renderMenu();
          document.getElementById('menu').style.display = 'block';
          document.getElementById('order-summary').style.display = 'block';
        });
      } else {
        showWelcome();
        renderMenu();
        document.getElementById('login').style.display = 'none';
        document.getElementById('menu').style.display = 'block';
        document.getElementById('order-summary').style.display = 'block';
      }
    }
  }
  
  function saveSession() {
    localStorage.setItem('clientName', clientName);
    localStorage.setItem('ticketNumber', ticketNumber);
    localStorage.setItem('confirmedOrder', JSON.stringify(confirmedOrder));
    localStorage.setItem('currentOrder', JSON.stringify(currentOrder));
    localStorage.setItem('totalConfirmed', totalConfirmed.toString());
    localStorage.setItem('totalCurrent', totalCurrent.toString());
  }
  
  function showWelcome() {
    let now = new Date();
    document.getElementById('welcome').innerHTML = `<h2>Bienvenido, ${clientName}!<br><small>Tu número de ticket es #${ticketNumber}<br>${now.toLocaleDateString()} ${now.toLocaleTimeString()}</small></h2>`;
  }
  
  function renderMenu() {
    const menuDiv = document.getElementById('menu');
    menuDiv.innerHTML = '';
    groupedMenu.forEach(group => {
      let menuHtml = `<div class="menu-item"><img src="${group.image}" alt="${group.options[0].name}">`;
      group.options.forEach(item => {
        quantities[item.name] = 0;
        menuHtml += `
          <div class="option-item">
            <span>${item.name} - $${item.price}</span>
            <div class="controls">
              <button class="button-small" onclick="decreaseQuantity('${item.name}')">-</button>
              <span id="qty-${item.name.replace(/\s+/g, '-')}">0</span>
              <button class="button-small" onclick="increaseQuantity('${item.name}')">+</button>
              <button class="button" onclick="addItem('${item.name}', ${item.price})">Agregar</button>
            </div>
          </div>
        `;
      });
      menuHtml += `</div>`;
      menuDiv.innerHTML += menuHtml;
    });
  }
  

 
  
  function increaseQuantity(name) {
    quantities[name]++;
    document.getElementById('qty-' + name.replace(/\s+/g, '-')).innerText = quantities[name];
  }
  
  function decreaseQuantity(name) {
    if (quantities[name] > 0) {
      quantities[name]--;
      document.getElementById('qty-' + name.replace(/\s+/g, '-')).innerText = quantities[name];
    }
  }
  
  function addItem(name, price) {
    let qty = quantities[name];
    if (qty > 0) {
      currentOrder.push({ producto: name, cantidad: qty, subtotal: price * qty });
      totalCurrent += price * qty;
      quantities[name] = 0;
      document.getElementById('qty-' + name.replace(/\s+/g, '-')).innerText = 0;
      updateOrder();
      saveSession();
    } else {
      alert("Selecciona una cantidad mayor a 0");
    }
  }
  
  function updateOrder() {
    const list = document.getElementById('order-list');
    list.innerHTML = "<strong>Confirmados:</strong><br>";
    confirmedOrder.forEach(item => {
      let li = document.createElement('li');
      li.textContent = `${item.cantidad} x ${item.producto} - $${item.subtotal}`;
      list.appendChild(li);
    });
  
    list.innerHTML += "<hr><strong>En edición:</strong><br>";
    currentOrder.forEach((item, index) => {
      let li = document.createElement('li');
      li.innerHTML = `${item.cantidad} x ${item.producto} - $${item.subtotal} <button onclick="removeCurrentItem(${index})">Eliminar</button>`;
      list.appendChild(li);
    });
  
    document.getElementById('total').textContent = (totalConfirmed + totalCurrent).toFixed(2);
  }
  
  function removeCurrentItem(index) {
    totalCurrent -= currentOrder[index].subtotal;
    currentOrder.splice(index, 1);
    updateOrder();
    saveSession();
  }
  
  function confirmCurrentOrder() {
    if (currentOrder.length === 0) {
      alert("No hay productos para confirmar.");
      return;
    }
    confirmedOrder = confirmedOrder.concat(currentOrder);
    totalConfirmed += totalCurrent;
    currentOrder = [];
    totalCurrent = 0;
    updateOrder();
    saveSession();
    alert("Pedido confirmado. Puedes seguir agregando más productos si deseas.");
  }
  
  function editOrder() {
    alert("Puedes eliminar los productos que aún no has confirmado.");
  }
  
  function prepareCheckout() {
    if (confirmedOrder.length === 0) {
      alert("Debes confirmar al menos un producto antes de pedir la cuenta.");
      return;
    }
    const method = document.getElementById('method-payment').value;
    if (method === "-- Selecciona --") {
      alert("Selecciona un método de pago.");
      return;
    }
  
    const fechaHoy = new Date().toISOString().split('T')[0];
    let pedido = {
      cliente: clientName,
      ticket: ticketNumber,
      fecha: fechaHoy,
      metodoPago: method,
      total: totalConfirmed.toFixed(2),
      orden: confirmedOrder
    };
  
    firebase.database().ref('ventas/ticket-' + ticketNumber).set(pedido)
      .then(() => {
        showTicket(pedido);
        localStorage.clear();
      })
      .catch(error => {
        console.error("Error al guardar pedido:", error);
      });
  }
  
  function showTicket(pedido) {
    const ticket = document.getElementById('ticket');
    ticket.innerHTML = `<h2>Ticket #${pedido.ticket}</h2>
      <p>Cliente: ${pedido.cliente}<br>Fecha: ${pedido.fecha}<br>Método de pago: ${pedido.metodoPago}</p><ul>`;
    pedido.orden.forEach(item => {
      ticket.innerHTML += `<li>${item.cantidad} x ${item.producto} - $${item.subtotal}</li>`;
    });
    ticket.innerHTML += `</ul><h3>Total: $${pedido.total}</h3><br><h2 style="font-size: 1.5em; font-weight: bold;">Gracias por su preferencia, vuelva pronto, ${pedido.cliente}.</h2>`;
  
    document.getElementById('welcome').innerHTML = "";
    document.getElementById('menu').style.display = 'none';
    document.getElementById('order-summary').style.display = 'none';
    ticket.style.display = 'block';
  }
  // Funciones de Administración

// Mostrar tickets del día
function showTodayTickets() {
    const today = new Date().toISOString().split('T')[0];
    const resultsDiv = document.getElementById('admin-results');
    resultsDiv.innerHTML = "<h3>Tickets del día:</h3>";
  
    firebase.database().ref('ventas').once('value', snapshot => {
      snapshot.forEach(ticketSnap => {
        let data = ticketSnap.val();
        if (data.fecha === today) {
          resultsDiv.innerHTML += `
            <div style="border-bottom:1px solid #ccc; margin-bottom:10px; padding-bottom:10px;">
              <strong>Ticket #${data.ticket}</strong><br>
              <strong>Fecha:</strong> ${data.fecha}<br>
              <strong>Cliente:</strong> ${data.cliente}<br>
              <ul>
                ${data.orden.map(item => `<li>${item.cantidad} x ${item.producto} - $${item.subtotal}</li>`).join('')}
              </ul>
              <strong>Total:</strong> $${data.total}
            </div>
          `;
        }
      });
    });
  }
  
  // Mostrar venta total del día
  function showTodaySales() {
    const today = new Date().toISOString().split('T')[0];
    const resultsDiv = document.getElementById('admin-results');
    resultsDiv.innerHTML = "<h3>Venta del día:</h3>";
  
    let resumen = {};
    let totalVentas = 0;
  
    firebase.database().ref('ventas').once('value', snapshot => {
      snapshot.forEach(ticketSnap => {
        let data = ticketSnap.val();
        if (data.fecha === today) {
          totalVentas += parseFloat(data.total);
          data.orden.forEach(item => {
            if (!resumen[item.producto]) {
              resumen[item.producto] = { cantidad: 0, subtotal: 0 };
            }
            resumen[item.producto].cantidad += item.cantidad;
            resumen[item.producto].subtotal += item.subtotal;
          });
        }
      });
  
      for (let producto in resumen) {
        resultsDiv.innerHTML += `<p>${producto}: ${resumen[producto].cantidad} piezas - $${resumen[producto].subtotal}</p>`;
      }
      resultsDiv.innerHTML += `<h3>Total Vendido: $${totalVentas}</h3>`;
    });
  }
  
  // Mostrar venta por rango de fechas
  function showSalesByDateRange() {
    const inicio = document.getElementById('fechaInicio').value;
    const fin = document.getElementById('fechaFin').value;
    const resultsDiv = document.getElementById('admin-results');
    resultsDiv.innerHTML = "<h3>Venta por rango de fechas:</h3>";
  
    if (!inicio || !fin) {
      alert("Selecciona ambas fechas");
      return;
    }
  
    let resumen = {};
    let totalVentas = 0;
  
    firebase.database().ref('ventas').once('value', snapshot => {
      snapshot.forEach(ticketSnap => {
        let data = ticketSnap.val();
        if (data.fecha >= inicio && data.fecha <= fin) {
          totalVentas += parseFloat(data.total);
          data.orden.forEach(item => {
            if (!resumen[item.producto]) {
              resumen[item.producto] = { cantidad: 0, subtotal: 0 };
            }
            resumen[item.producto].cantidad += item.cantidad;
            resumen[item.producto].subtotal += item.subtotal;
          });
        }
      });
  
      for (let producto in resumen) {
        resultsDiv.innerHTML += `<p>${producto}: ${resumen[producto].cantidad} piezas - $${resumen[producto].subtotal}</p>`;
      }
      resultsDiv.innerHTML += `<h3>Total Vendido: $${totalVentas}</h3>`;
    });
  }
  
  