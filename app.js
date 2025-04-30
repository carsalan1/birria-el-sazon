// --- Parte 1: Configuración de Firebase y Variables ---
const firebaseConfig = {
    apiKey: "", // Tu API key
    authDomain: "",
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
  let confirmedOrder = JSON.parse(localStorage.getItem('confirmedOrder') || "[]");
  let currentOrder = JSON.parse(localStorage.getItem('currentOrder') || "[]");
  let totalConfirmed = parseFloat(localStorage.getItem('totalConfirmed')) || 0;
  let totalCurrent = parseFloat(localStorage.getItem('totalCurrent')) || 0;
  let quantities = {};
  let clientPassword = "";
  
  const groupedMenu = [
    { image: 'imagenes/taco-birria.jpg', options: [{ name: 'Taco de birria', price: 28 }, { name: 'Orden de 4 pzs. con consomé individual', price: 100 }] },
    { image: 'imagenes/consome.jpg', options: [{ name: 'Vaso individual de consomé', price: 20 }, { name: 'Medio litro de consomé', price: 50 }, { name: 'Litro de consomé', price: 90 }] },
    { image: 'imagenes/taco-cochinita.jpg', options: [{ name: 'Taco de cochinita', price: 28 }, { name: 'Orden de 4 tacos de cochinita', price: 100 }] },
    { image: 'imagenes/quesadilla-sesos.jpg', options: [{ name: 'Quesadilla de seso', price: 13 }] },
    { image: 'imagenes/agua.jpg', options: [{ name: 'Agua de sabor medio litro', price: 15 }, { name: 'Agua de sabor litro', price: 30 }] },
    { image: 'imagenes/refresco.jpg', options: [{ name: 'Refresco', price: 25 }] },
    { image: 'imagenes/flan.jpg', options: [{ name: 'Flan', price: 20 }] }
  ];
  
  firebase.database().ref('configuracion/passwordCliente').get().then(snapshot => {
    if (snapshot.exists()) {
      clientPassword = snapshot.val();
    } else {
      clientPassword = "1234";
      firebase.database().ref('configuracion').set({ passwordCliente: clientPassword });
    }
  });
  
  if (clientName && ticketNumber) {
    showWelcome();
    renderMenu();
    document.getElementById('login').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    document.getElementById('order-summary').style.display = 'block';
    updateOrder();
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
  
  // Botón cancelar entrada
  function cancelEntry() {
    localStorage.clear();
    window.location.href = "https://www.google.com"; // O página principal
  }
  
  // Botón salir después del ticket
  function exitSite() {
    localStorage.clear();
    window.location.href = "https://www.google.com";
  }
// --- Parte 2: Menú y control de pedido ---

// Renderizar el menú
function renderMenu() {
    const menuDiv = document.getElementById('menu');
    menuDiv.innerHTML = '';
    groupedMenu.forEach(group => {
      let menuHtml = `<div class="menu-item"><img src="${group.image}" alt="${group.options[0].name}">`;
      group.options.forEach(item => {
        quantities[item.name] = 0;
        menuHtml += `
          <div class="option-line">
            <span class='product-name'>${item.name} - $${item.price}</span>
            <div class="controls">
              <button class="button-small" onclick="decreaseQuantity('${item.name}')">-</button>
              <span id="qty-${item.name.replace(/\s+/g, '-')}">0</span>
              <button class="button-small" onclick="increaseQuantity('${item.name}', ${item.price})">+</button>
            </div>
          </div>
        `;
      });
      menuHtml += `</div>`;
      menuDiv.innerHTML += menuHtml;
    });
  }
  
  // Aumentar cantidad
  function increaseQuantity(name, price) {
    quantities[name]++;
    document.getElementById('qty-' + name.replace(/\s+/g, '-')).innerText = quantities[name];
    currentOrder.push({ producto: name, cantidad: 1, subtotal: price });
    totalCurrent += price;
    updateOrder();
    saveSession();
  }
  
  // Disminuir cantidad
  function decreaseQuantity(name) {
    if (quantities[name] > 0) {
      quantities[name]--;
      document.getElementById('qty-' + name.replace(/\s+/g, '-')).innerText = quantities[name];
  
      let index = currentOrder.findIndex(item => item.producto === name);
      if (index !== -1) {
        totalCurrent -= currentOrder[index].subtotal;
        currentOrder.splice(index, 1);
        updateOrder();
        saveSession();
      }
    }
  }
  
  // Agrupar productos iguales
  function groupProducts(order) {
    const grouped = {};
    order.forEach(item => {
      if (!grouped[item.producto]) {
        grouped[item.producto] = { cantidad: 0, subtotal: 0 };
      }
      grouped[item.producto].cantidad += item.cantidad;
      grouped[item.producto].subtotal += item.subtotal;
    });
    return grouped;
  }
  
  // Actualizar el resumen de pedido
  function updateOrder() {
    const list = document.getElementById('order-list');
    list.innerHTML = "<strong>Confirmados:</strong><br>";
  
    const confirmedGrouped = groupProducts(confirmedOrder);
    const currentGrouped = groupProducts(currentOrder);
  
    for (const product in confirmedGrouped) {
      list.innerHTML += `<li>${product} x ${confirmedGrouped[product].cantidad} = $${confirmedGrouped[product].subtotal}</li>`;
    }
  
    if (Object.keys(currentGrouped).length > 0) {
      list.innerHTML += "<hr><strong>En edición:</strong><br>";
      for (const product in currentGrouped) {
        list.innerHTML += `<li>${product} x ${currentGrouped[product].cantidad} = $${currentGrouped[product].subtotal}</li>`;
      }
    }
  
    document.getElementById('total').textContent = (totalConfirmed + totalCurrent).toFixed(2);
  }
  
  // Confirmar el pedido actual
  function confirmCurrentOrder() {
    if (currentOrder.length === 0) {
      alert("No hay productos para confirmar.");
      return;
    }
  
    confirmedOrder = confirmedOrder.concat(currentOrder);
    totalConfirmed += totalCurrent;
    currentOrder = [];
    totalCurrent = 0;
  
    // Resetear cantidades a cero
    for (let producto in quantities) {
      quantities[producto] = 0;
      const spanQty = document.getElementById('qty-' + producto.replace(/\s+/g, '-'));
      if (spanQty) {
        spanQty.innerText = '0';
      }
    }
  
    updateOrder();
    saveSession();
    alert("Pedido confirmado. Puedes seguir agregando más productos si deseas.");
  }
// --- Parte 3: Confirmar pago y mostrar ticket ---

// Preparar el checkout (pedir cuenta)
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
  
    const now = new Date();
    const fechaHoy = now.toISOString().split('T')[0];
    const horaRegistro = now.toLocaleTimeString();
  
    let pedido = {
      cliente: clientName,
      ticket: ticketNumber,
      fecha: fechaHoy,
      hora: horaRegistro,
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
  
  // Mostrar el ticket final
  function showTicket(pedido) {
    const ticket = document.getElementById('ticket');
    ticket.innerHTML = `<h2>Ticket #${pedido.ticket}</h2>
      <p>Cliente: ${pedido.cliente}<br>Fecha: ${pedido.fecha} ${pedido.hora}<br>Método de pago: ${pedido.metodoPago}</p><ul>`;
    pedido.orden.forEach(item => {
      ticket.innerHTML += `<li>${item.cantidad} x ${item.producto} - $${item.subtotal}</li>`;
    });
    ticket.innerHTML += `</ul><h3>Total: $${pedido.total}</h3><br><h2 style="font-size: 1.5em; font-weight: bold;">Gracias por su preferencia, vuelva pronto, ${pedido.cliente}.</h2><br><button onclick="exitSite()" class="button-exit">Salir</button>`;
  
    document.getElementById('welcome').innerHTML = "";
    document.getElementById('menu').style.display = 'none';
    document.getElementById('order-summary').style.display = 'none';
    ticket.style.display = 'block';
  }
      // --- Parte 4: Funciones de Administrador ---

// Mostrar tickets del día
function showTodayTickets() {
    const today = new Date().toISOString().split('T')[0];
    firebase.database().ref('ventas').orderByChild('fecha').equalTo(today).once('value')
      .then(snapshot => {
        const resultDiv = document.getElementById('admin-results');
        resultDiv.innerHTML = "<h3>Tickets del Día</h3>";
        snapshot.forEach(ticket => {
          const data = ticket.val();
          resultDiv.innerHTML += `
            <div style="margin-bottom:20px;">
              <strong>Ticket #${data.ticket}</strong><br>
              Cliente: ${data.cliente}<br>
              Fecha: ${data.fecha} ${data.hora}<br>
              Método de Pago: ${data.metodoPago}<br>
              Total: $${data.total}<br>
            </div><hr>`;
        });
      });
  }
  
  // Mostrar venta del día agrupada
  function showTodaySales() {
    const today = new Date().toISOString().split('T')[0];
    firebase.database().ref('ventas').orderByChild('fecha').equalTo(today).once('value')
      .then(snapshot => {
        const productos = {};
        let totalDia = 0;
  
        snapshot.forEach(ticket => {
          const data = ticket.val();
          totalDia += parseFloat(data.total);
  
          data.orden.forEach(item => {
            if (!productos[item.producto]) {
              productos[item.producto] = { cantidad: 0, subtotal: 0 };
            }
            productos[item.producto].cantidad += item.cantidad;
            productos[item.producto].subtotal += item.subtotal;
          });
        });
  
        const resultDiv = document.getElementById('admin-results');
        resultDiv.innerHTML = "<h3>Venta del Día</h3><ul>";
  
        for (const producto in productos) {
          resultDiv.innerHTML += `<li>${producto}: ${productos[producto].cantidad} piezas = $${productos[producto].subtotal.toFixed(2)}</li>`;
        }
  
        resultDiv.innerHTML += `</ul><h3>Total Vendido: $${totalDia.toFixed(2)}</h3>`;
      });
  }
  
  // Mostrar venta por rango de fechas
  function showSalesByDateRange() {
    const inicio = document.getElementById('fechaInicio').value;
    const fin = document.getElementById('fechaFin').value;
  
    if (!inicio || !fin) {
      alert("Selecciona ambas fechas");
      return;
    }
  
    firebase.database().ref('ventas').once('value')
      .then(snapshot => {
        let totalRango = 0;
        const resultDiv = document.getElementById('admin-results');
        resultDiv.innerHTML = "<h3>Venta por Rango de Fechas</h3>";
  
        snapshot.forEach(ticket => {
          const data = ticket.val();
          if (data.fecha >= inicio && data.fecha <= fin) {
            totalRango += parseFloat(data.total);
  
            resultDiv.innerHTML += `
              <div style="margin-bottom:20px;">
                <strong>Ticket #${data.ticket}</strong><br>
                Cliente: ${data.cliente}<br>
                Fecha: ${data.fecha} ${data.hora}<br>
                Método de Pago: ${data.metodoPago}<br>
                <ul>
            `;
  
            data.orden.forEach(item => {
              resultDiv.innerHTML += `<li>${item.cantidad} x ${item.producto} - $${item.subtotal}</li>`;
            });
  
            resultDiv.innerHTML += `</ul><strong>Total del Ticket: $${data.total}</strong><br><hr></div>`;
          }
        });
  
        resultDiv.innerHTML += `<h3>Total Vendido en Rango: $${totalRango.toFixed(2)}</h3>`;
      });
  }
  
  // Cambiar contraseña de cliente
  function updateClientPassword() {
    const newPassword = document.getElementById('newClientPassword').value.trim();
    if (newPassword.length < 3) {
      alert("La nueva contraseña debe tener al menos 3 caracteres");
      return;
    }
  
    firebase.database().ref('configuracion/passwordCliente').set(newPassword)
      .then(() => {
        clientPassword = newPassword;
        alert("Contraseña actualizada correctamente.");
      })
      .catch(error => {
        console.error("Error al actualizar contraseña:", error);
      });
  }
  