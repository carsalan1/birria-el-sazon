// Configuración de Firebase
const firebaseConfig = {
    apiKey: "", // <-- Tu apiKey aquí
    authDomain: "", // <-- Tu authDomain aquí
    databaseURL: "https://birria-c2b8a-default-rtdb.firebaseio.com/",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  };
  
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
  
  let clientName = localStorage.getItem('clientName') || "";
  let ticketNumber = localStorage.getItem('ticketNumber') || "";
  let order = JSON.parse(localStorage.getItem('order') || "[]");
  let total = parseFloat(localStorage.getItem('total')) || 0;
  let quantities = {};
  
  let groupedMenu = [
    { image: 'imagenes/taco-birria.jpg', options: [{ name: 'Taco de birria', price: 28 }, { name: 'Orden de 4 pzs. con consomé individual', price: 100 }] },
    { image: 'imagenes/consome.jpg', options: [{ name: 'Vaso individual de consomé', price: 20 }, { name: 'Medio litro de consomé', price: 50 }, { name: 'Litro de consomé', price: 90 }] },
    { image: 'imagenes/taco-cochinita.jpg', options: [{ name: 'Taco de cochinita', price: 28 }, { name: 'Orden de 4 tacos de cochinita', price: 100 }] },
    { image: 'imagenes/quesadilla-sesos.jpg', options: [{ name: 'Quesadilla de seso', price: 13 }] },
    { image: 'imagenes/agua.jpg', options: [{ name: 'Agua de sabor medio litro', price: 15 }, { name: 'Agua de sabor litro', price: 30 }] },
    { image: 'imagenes/refresco.jpg', options: [{ name: 'Refresco', price: 25 }] },
    { image: 'imagenes/flan.jpg', options: [{ name: 'Flan', price: 20 }] }
  ];
  
  // Verificar si ya había sesión activa
  if (clientName && ticketNumber) {
    showWelcome();
    renderMenu();
    document.getElementById('login').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    document.getElementById('order-summary').style.display = 'block';
    updateOrder();
  }
  
  function registerName() {
    clientName = document.getElementById('name').value.trim();
  
    if (clientName.toLowerCase() === "admin") {
      let password = prompt("Introduce la contraseña de administrador:");
      if (password === "12345") {
        document.getElementById('login').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
      } else {
        alert("Contraseña incorrecta");
      }
    } else if (clientName !== "") {
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
    localStorage.setItem('order', JSON.stringify(order));
    localStorage.setItem('total', total.toString());
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
              <button onclick="decreaseQuantity('${item.name}')">-</button>
              <span id="qty-${item.name.replace(/\s+/g, '-')}">0</span>
              <button onclick="increaseQuantity('${item.name}')">+</button>
              <button onclick="addItem('${item.name}', ${item.price})">Agregar</button>
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
      order.push({ producto: name, cantidad: qty, subtotal: price * qty });
      total += price * qty;
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
    list.innerHTML = "";
    order.forEach(item => {
      let li = document.createElement('li');
      li.textContent = `${item.cantidad} x ${item.producto} - $${item.subtotal}`;
      list.appendChild(li);
    });
    document.getElementById('total').textContent = total;
  }
  
  function saveOrder() {
    const method = document.getElementById('method-payment').value;
    if (method === "-- Selecciona --") {
      alert("Selecciona un método de pago.");
      return;
    }
  
    const fechaHoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let pedido = {
      cliente: clientName,
      ticket: ticketNumber,
      fecha: fechaHoy,
      metodoPago: method,
      total: total,
      orden: order
    };
  
    firebase.database().ref('ventas/ticket-' + ticketNumber).set(pedido)
      .then(() => {
        showTicket(pedido);
        localStorage.clear();
        order = [];
        total = 0;
        updateOrder();
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
  
    document.getElementById('welcome').innerHTML = ""; // Quitamos mensaje de Bienvenido
    document.getElementById('menu').style.display = 'none';
    document.getElementById('order-summary').style.display = 'none';
    ticket.style.display = 'block';
  }
  
  // FUNCIONES ADMINISTRADOR
  
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
              <strong>Productos:</strong><br>
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
          totalVentas += data.total;
          data.orden.forEach(item => {
            if (!resumen[item.producto]) {
              resumen[item.producto] = {cantidad: 0, subtotal: 0};
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
          totalVentas += data.total;
          data.orden.forEach(item => {
            if (!resumen[item.producto]) {
              resumen[item.producto] = {cantidad: 0, subtotal: 0};
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
  