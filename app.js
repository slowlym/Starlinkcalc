const pagoMensual = 115;
const vecinosBase = 5; // actualizado: ahora 5 vecinos (se agregó Sr. Hector)
let precioUSDT = null;
const nombres = [
    "Sra. America",
    "Sra. Carolina",
    "Sr. Jesus",
    "Sr. Jose Gregorio",
    "Sr. Hector"
];

async function fetchCriptoYa() {
    const url = "https://criptoya.com/api/binancep2p/usdt/ves/1";
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CriptoYa HTTP ${res.status}`);
    return res.json();
}

async function fetchCoinGeckoUSDTtoUSD() {
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd";
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
    return res.json();
}

async function fetchUSDToVES() {
    // exchangerate.host permite CORS y devuelve rates
    const url = "https://api.exchangerate.host/latest?base=USD&symbols=VES";
    const res = await fetch(url);
    if (!res.ok) throw new Error(`exchangerate.host HTTP ${res.status}`);
    return res.json();
}

async function obtenerPrecioUSDT() {
    try {
        // Intento 1: CriptoYa (agregador que consulta Binance P2P)
        const cy = await fetchCriptoYa();
        if (cy && cy.ask) {
            precioUSDT = parseFloat(String(cy.ask).replace(/,/g, ''));
            mostrarPrecioUSDT("CriptoYa (Binance P2P)");
            console.log("Precio obtenido desde CriptoYa:", precioUSDT, "VES");
            calcular();
            return;
        }
        throw new Error("CriptoYa no devolvió ask");
    } catch (errCy) {
        console.warn("CriptoYa falló o no válido:", errCy.message);
        // Intento 2: CoinGecko (USDT -> USD) + exchangerate.host (USD -> VES)
        try {
            const cg = await fetchCoinGeckoUSDTtoUSD();
            const ex = await fetchUSDToVES();
            const usdtUsd = parseFloat(cg?.tether?.usd ?? NaN);
            const usdToVes = parseFloat(ex?.rates?.VES ?? NaN);
            if (!Number.isFinite(usdtUsd) || !Number.isFinite(usdToVes)) {
                throw new Error("Datos inválidos de CoinGecko o exchangerate");
            }
            precioUSDT = usdtUsd * usdToVes;
            mostrarPrecioUSDT("CoinGecko + exchangerate.host (fallback)");
            console.log("Precio calculado desde CoinGecko+exchangerate:", precioUSDT, "VES (usdtUsd:", usdtUsd, "usdToVes:", usdToVes, ")");
            calcular();
            return;
        } catch (errFallback) {
            console.error("Fallback falló:", errFallback.message);
            // Si todo falla, indicar error y calcular sin Bs
            precioUSDT = null;
            document.getElementById("usdt-info").style.display = "none";
            const errEl = document.getElementById("error");
            errEl.style.display = "block";
            errEl.textContent = "No se pudo obtener el precio del USDT (intente F5 o abra la consola).";
            calcular();
        }
    }
}

function mostrarPrecioUSDT(fuente = "") {
    if (!precioUSDT && precioUSDT !== 0) return;
    const ahora = new Date();
    const fechaStr = ahora.toLocaleString("es-VE");
    const fuenteTxt = fuente ? ` - ${fuente}` : "";
    const info = document.getElementById("usdt-info");
    info.style.display = "block";
    info.innerHTML =
        `<b>Precio actual del USDT${fuenteTxt}:</b> ${precioUSDT.toLocaleString("es-VE", {minimumFractionDigits:2, maximumFractionDigits:2})} Bs<br>
         <b>Última actualización:</b> ${fechaStr}`;
    document.getElementById("error").style.display = "none";
}

function calcular() {
    const costoPorVecino = pagoMensual / vecinosBase;
    let vecinosDiv = "";

    nombres.forEach((nombre) => {
        const costoBs = precioUSDT ? (costoPorVecino * precioUSDT).toLocaleString("es-VE", {minimumFractionDigits:2, maximumFractionDigits:2}) : "-";
        vecinosDiv += `<div class="vecino"><b>${nombre}:</b> ${costoPorVecino.toFixed(2)} USDT ≈ ${costoBs} Bs</div>`;
    });

    document.getElementById("vecinos").innerHTML = vecinosDiv;

    const totalBs = precioUSDT ? (pagoMensual * precioUSDT).toLocaleString("es-VE", {minimumFractionDigits:2, maximumFractionDigits:2}) : "-";
    document.getElementById("total").innerHTML = `<b>Monto total del wifi:</b> ${pagoMensual.toFixed(2)} USDT ≈ ${totalBs} Bs`;
}

obtenerPrecioUSDT();