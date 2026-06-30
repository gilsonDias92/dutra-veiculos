"use strict";

const vehicles = Array.isArray(window.VEHICLES_DATA) ? window.VEHICLES_DATA : [];
const initialBusinessData = window.BUSINESS_DATA && Array.isArray(window.BUSINESS_DATA.records)
  ? window.BUSINESS_DATA
  : { records: [] };
const businessData = structuredClone(initialBusinessData);

let selectedVehicleId = vehicles[0] ? vehicles[0].id : "";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const vehicleList = document.querySelector("#dashboard-vehicle-list");
const dashboardCount = document.querySelector("#dashboard-count");
const statusMessage = document.querySelector("#dashboard-status");
const expensesList = document.querySelector("#expenses-list");
const expensesEmpty = document.querySelector("#expenses-empty");

const fields = {
  detailBrand: document.querySelector("#detail-brand"),
  detailTitle: document.querySelector("#detail-title"),
  detailSubtitle: document.querySelector("#detail-subtitle"),
  detailProfit: document.querySelector("#detail-profit"),
  summaryInvested: document.querySelector("#summary-invested"),
  summaryExpenses: document.querySelector("#summary-expenses"),
  summarySales: document.querySelector("#summary-sales"),
  summaryProfit: document.querySelector("#summary-profit"),
  metricPurchase: document.querySelector("#metric-purchase"),
  metricExpenses: document.querySelector("#metric-expenses"),
  metricCost: document.querySelector("#metric-cost"),
  metricSale: document.querySelector("#metric-sale"),
  purchaseDate: document.querySelector("#purchase-date"),
  purchaseValue: document.querySelector("#purchase-value"),
  purchasePayment: document.querySelector("#purchase-payment"),
  purchaseSeller: document.querySelector("#purchase-seller"),
  purchaseNotes: document.querySelector("#purchase-notes"),
  expenseDate: document.querySelector("#expense-date"),
  expenseCategory: document.querySelector("#expense-category"),
  expenseValue: document.querySelector("#expense-value"),
  expensePayment: document.querySelector("#expense-payment"),
  expenseDescription: document.querySelector("#expense-description"),
  saleDate: document.querySelector("#sale-date"),
  saleValue: document.querySelector("#sale-value"),
  salePayment: document.querySelector("#sale-payment"),
  saleBuyer: document.querySelector("#sale-buyer"),
  saleNotes: document.querySelector("#sale-notes")
};

function money(value) {
  return Number.isFinite(value) ? currencyFormatter.format(value) : "R$ 0";
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function emptyPurchase() {
  return { data: "", valor: null, formaPagamento: "", fornecedor: "", observacoes: "" };
}

function emptySale() {
  return { data: "", valor: null, formaPagamento: "", comprador: "", observacoes: "" };
}

function recordForVehicle(vehicleId) {
  let record = businessData.records.find((item) => item.vehicleId === vehicleId);

  if (!record) {
    record = {
      vehicleId,
      compra: emptyPurchase(),
      despesas: [],
      venda: emptySale()
    };
    businessData.records.push(record);
  }

  record.compra = { ...emptyPurchase(), ...(record.compra || {}) };
  record.venda = { ...emptySale(), ...(record.venda || {}) };
  record.despesas = Array.isArray(record.despesas) ? record.despesas : [];
  return record;
}

function expenseTotal(record) {
  return record.despesas.reduce((total, expense) => total + (Number(expense.valor) || 0), 0);
}

function purchaseValue(record) {
  return Number(record.compra.valor) || 0;
}

function saleValue(record) {
  return Number(record.venda.valor) || 0;
}

function costTotal(record) {
  return purchaseValue(record) + expenseTotal(record);
}

function profit(record) {
  return saleValue(record) ? saleValue(record) - costTotal(record) : 0;
}

function vehicleName(vehicle) {
  return `${vehicle.marca} ${vehicle.modelo}`;
}

function setStatus(message, type = "success") {
  statusMessage.textContent = message;
  statusMessage.className = `form-status ${type}`;
}

function renderSummary() {
  const totals = vehicles.reduce((acc, vehicle) => {
    const record = recordForVehicle(vehicle.id);
    acc.invested += purchaseValue(record);
    acc.expenses += expenseTotal(record);
    acc.sales += saleValue(record);
    acc.profit += profit(record);
    return acc;
  }, { invested: 0, expenses: 0, sales: 0, profit: 0 });

  fields.summaryInvested.textContent = money(totals.invested);
  fields.summaryExpenses.textContent = money(totals.expenses);
  fields.summarySales.textContent = money(totals.sales);
  fields.summaryProfit.textContent = money(totals.profit);
  fields.summaryProfit.classList.toggle("negative", totals.profit < 0);
}

function renderVehicleList() {
  vehicleList.replaceChildren();
  dashboardCount.textContent = vehicles.length;

  vehicles.forEach((vehicle) => {
    const record = recordForVehicle(vehicle.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dashboard-vehicle-button";
    button.classList.toggle("active", vehicle.id === selectedVehicleId);
    button.addEventListener("click", () => {
      selectedVehicleId = vehicle.id;
      render();
    });

    const title = document.createElement("strong");
    title.textContent = vehicleName(vehicle);

    const details = document.createElement("span");
    details.textContent = `${vehicle.versao} | ${vehicle.ano}`;

    const result = document.createElement("em");
    result.textContent = saleValue(record) ? `Lucro: ${money(profit(record))}` : `Custo: ${money(costTotal(record))}`;
    result.classList.toggle("negative", profit(record) < 0 && saleValue(record) > 0);

    button.append(title, details, result);
    vehicleList.append(button);
  });
}

function fillForms(record) {
  fields.purchaseDate.value = record.compra.data || "";
  fields.purchaseValue.value = Number.isFinite(record.compra.valor) ? record.compra.valor : "";
  fields.purchasePayment.value = record.compra.formaPagamento || "";
  fields.purchaseSeller.value = record.compra.fornecedor || "";
  fields.purchaseNotes.value = record.compra.observacoes || "";

  fields.saleDate.value = record.venda.data || "";
  fields.saleValue.value = Number.isFinite(record.venda.valor) ? record.venda.valor : "";
  fields.salePayment.value = record.venda.formaPagamento || "";
  fields.saleBuyer.value = record.venda.comprador || "";
  fields.saleNotes.value = record.venda.observacoes || "";
}

function renderExpenses(record) {
  expensesList.replaceChildren();
  expensesEmpty.hidden = record.despesas.length > 0;

  record.despesas.forEach((expense) => {
    const item = document.createElement("article");
    item.className = "expense-item";

    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = `${expense.categoria || "Despesa"} - ${money(Number(expense.valor) || 0)}`;
    const details = document.createElement("span");
    details.textContent = [expense.data, expense.descricao, expense.formaPagamento].filter(Boolean).join(" | ");
    copy.append(title, details);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "button button-ghost button-small";
    removeButton.textContent = "Remover";
    removeButton.addEventListener("click", () => {
      record.despesas = record.despesas.filter((itemExpense) => itemExpense.id !== expense.id);
      setStatus("Despesa removida em memória. Exporte o controle para salvar.");
      render();
    });

    item.append(copy, removeButton);
    expensesList.append(item);
  });
}

function renderDetail() {
  const vehicle = vehicles.find((item) => item.id === selectedVehicleId) || vehicles[0];
  if (!vehicle) return;

  selectedVehicleId = vehicle.id;
  const record = recordForVehicle(vehicle.id);
  const expenses = expenseTotal(record);
  const cost = costTotal(record);
  const sale = saleValue(record);
  const currentProfit = profit(record);

  fields.detailBrand.textContent = vehicle.marca;
  fields.detailTitle.textContent = vehicleName(vehicle);
  fields.detailSubtitle.textContent = `${vehicle.versao} | ${vehicle.ano}`;
  fields.detailProfit.textContent = sale ? money(currentProfit) : "Venda pendente";
  fields.detailProfit.classList.toggle("negative", currentProfit < 0 && sale > 0);

  fields.metricPurchase.textContent = money(purchaseValue(record));
  fields.metricExpenses.textContent = money(expenses);
  fields.metricCost.textContent = money(cost);
  fields.metricSale.textContent = money(sale);

  fillForms(record);
  renderExpenses(record);
}

function render() {
  renderSummary();
  renderVehicleList();
  renderDetail();
}

document.querySelector("#purchase-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const record = recordForVehicle(selectedVehicleId);
  record.compra = {
    data: fields.purchaseDate.value,
    valor: numberOrNull(fields.purchaseValue.value),
    formaPagamento: text(fields.purchasePayment.value),
    fornecedor: text(fields.purchaseSeller.value),
    observacoes: text(fields.purchaseNotes.value)
  };
  setStatus("Compra atualizada em memória. Exporte o controle para salvar.");
  render();
});

document.querySelector("#expense-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const value = numberOrNull(fields.expenseValue.value);
  if (!value) {
    setStatus("Informe o valor da despesa.", "error");
    fields.expenseValue.focus();
    return;
  }

  const record = recordForVehicle(selectedVehicleId);
  record.despesas.push({
    id: `expense-${Date.now()}`,
    data: fields.expenseDate.value,
    categoria: fields.expenseCategory.value,
    descricao: text(fields.expenseDescription.value),
    valor: value,
    formaPagamento: text(fields.expensePayment.value)
  });

  event.target.reset();
  setStatus("Despesa adicionada em memória. Exporte o controle para salvar.");
  render();
});

document.querySelector("#sale-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const record = recordForVehicle(selectedVehicleId);
  record.venda = {
    data: fields.saleDate.value,
    valor: numberOrNull(fields.saleValue.value),
    formaPagamento: text(fields.salePayment.value),
    comprador: text(fields.saleBuyer.value),
    observacoes: text(fields.saleNotes.value)
  };
  setStatus("Venda atualizada em memória. Exporte o controle para salvar.");
  render();
});

document.querySelector("#export-business-button").addEventListener("click", async () => {
  const output = `"use strict";\n\nwindow.BUSINESS_DATA = ${JSON.stringify(businessData, null, 2)};\n`;

  try {
    await navigator.clipboard.writeText(output);
    setStatus("Controle copiado. Substitua business-data.js por esse conteúdo para salvar.");
  } catch (error) {
    setStatus(output);
  }
});

render();
