"use strict";

const COMPLETE_OPTIONALS = [
  "Ar condicionado",
  "Direção Hidráulica",
  "Vidros Elétricos",
  "Travas Elétricas"
];

let adminVehicles = Array.isArray(window.VEHICLES_DATA) ? structuredClone(window.VEHICLES_DATA) : [];

const adminForm = document.querySelector("#vehicle-form");
const adminStatus = document.querySelector("#admin-status");
const adminList = document.querySelector("#admin-list");
const adminEmpty = document.querySelector("#admin-empty");
const vehicleCount = document.querySelector("#vehicle-count");
const clearButton = document.querySelector("#clear-button");
const exportButton = document.querySelector("#export-button");
const discardDraftButton = document.querySelector("#discard-draft-button");

const fields = {
  id: document.querySelector("#vehicle-id"),
  marca: document.querySelector("#marca"),
  modelo: document.querySelector("#modelo"),
  versao: document.querySelector("#versao"),
  ano: document.querySelector("#ano"),
  quilometragem: document.querySelector("#quilometragem"),
  preco: document.querySelector("#preco"),
  cambio: document.querySelector("#cambio"),
  combustivel: document.querySelector("#combustivel"),
  cor: document.querySelector("#cor"),
  descricao: document.querySelector("#descricao"),
  opcionais: document.querySelector("#opcionais"),
  imagens: document.querySelector("#imagens"),
  destaque: document.querySelector("#destaque"),
  vendido: document.querySelector("#vendido"),
  completo: document.querySelector("#completo")
};

function loadStoredVehicles() {
  return adminVehicles;
}

function saveVehicles(vehicles) {
  adminVehicles = vehicles;
}

function loadPublishedVehicles() {
  return Array.isArray(window.VEHICLES_DATA) ? window.VEHICLES_DATA : [];
}

function loadVehicles() {
  return loadStoredVehicles();
}

function linesToArray(value) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function arrayToLines(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptional(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

function applyCompleteOptionals() {
  const completeOptionals = new Set(COMPLETE_OPTIONALS.map(normalizeOptional));
  const customOptionals = linesToArray(fields.opcionais.value).filter((option) => {
    return !completeOptionals.has(normalizeOptional(option));
  });

  fields.opcionais.value = arrayToLines([...customOptionals, ...COMPLETE_OPTIONALS]);
}

function syncCompleteCheckbox() {
  const optionals = new Set(linesToArray(fields.opcionais.value).map(normalizeOptional));
  fields.completo.checked = COMPLETE_OPTIONALS.every((option) => optionals.has(normalizeOptional(option)));
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function setStatus(message, type = "success") {
  adminStatus.textContent = message;
  adminStatus.className = `form-status field-full ${type}`;
}

function clearForm() {
  adminForm.reset();
  fields.id.value = "";
  document.querySelector("#save-button").textContent = "Salvar veículo";
  adminStatus.textContent = "";
  fields.marca.focus();
}

function vehicleFromForm() {
  if (fields.completo.checked) applyCompleteOptionals();

  return {
    id: fields.id.value || `admin-${Date.now()}`,
    marca: fields.marca.value.trim(),
    modelo: fields.modelo.value.trim(),
    versao: fields.versao.value.trim(),
    ano: fields.ano.value.trim(),
    quilometragem: numberOrNull(fields.quilometragem.value),
    cambio: fields.cambio.value.trim(),
    combustivel: fields.combustivel.value.trim(),
    cor: fields.cor.value.trim(),
    preco: numberOrNull(fields.preco.value),
    descricao: fields.descricao.value.trim(),
    opcionais: linesToArray(fields.opcionais.value),
    imagens: linesToArray(fields.imagens.value),
    completo: fields.completo.checked,
    destaque: fields.destaque.checked,
    vendido: fields.vendido.checked
  };
}

function fillForm(vehicle) {
  fields.id.value = vehicle.id;
  fields.marca.value = vehicle.marca || "";
  fields.modelo.value = vehicle.modelo || "";
  fields.versao.value = vehicle.versao || "";
  fields.ano.value = vehicle.ano || "";
  fields.quilometragem.value = Number.isFinite(vehicle.quilometragem) ? vehicle.quilometragem : "";
  fields.preco.value = Number.isFinite(vehicle.preco) ? vehicle.preco : "";
  fields.cambio.value = vehicle.cambio || "";
  fields.combustivel.value = vehicle.combustivel || "";
  fields.cor.value = vehicle.cor || "";
  fields.descricao.value = vehicle.descricao || "";
  fields.opcionais.value = arrayToLines(vehicle.opcionais);
  fields.imagens.value = arrayToLines(vehicle.imagens);
  fields.completo.checked = Boolean(vehicle.completo);
  fields.destaque.checked = Boolean(vehicle.destaque);
  fields.vendido.checked = Boolean(vehicle.vendido);
  document.querySelector("#save-button").textContent = "Atualizar veículo";
  window.scrollTo({ top: 0, behavior: "smooth" });
  fields.marca.focus();
}

function validateVehicle(vehicle) {
  const requiredFields = ["marca", "modelo", "versao", "ano", "cambio", "combustivel", "cor", "descricao"];
  return requiredFields.every((field) => vehicle[field]);
}

function renderVehicles() {
  const vehicles = loadVehicles();
  adminList.replaceChildren();
  vehicleCount.textContent = vehicles.length;
  adminEmpty.hidden = vehicles.length > 0;

  vehicles.forEach((vehicle) => {
    const item = document.createElement("article");
    item.className = "admin-list-item";

    const title = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = `${vehicle.marca} ${vehicle.modelo}`;
    const details = document.createElement("span");
    details.textContent = `${vehicle.versao} | ${vehicle.ano}`;
    title.append(name, details);

    const actions = document.createElement("div");
    actions.className = "admin-item-actions";

    const editButton = document.createElement("button");
    editButton.className = "button button-ghost button-small";
    editButton.type = "button";
    editButton.textContent = "Editar";
    editButton.addEventListener("click", () => fillForm(vehicle));

    const removeButton = document.createElement("button");
    removeButton.className = "button button-ghost button-small";
    removeButton.type = "button";
    removeButton.textContent = "Excluir";
    removeButton.addEventListener("click", () => {
      const confirmed = window.confirm(`Excluir ${vehicle.marca} ${vehicle.modelo}?`);
      if (!confirmed) return;
      saveVehicles(loadStoredVehicles().filter((currentVehicle) => currentVehicle.id !== vehicle.id));
      renderVehicles();
      setStatus("Veículo excluído.");
      if (fields.id.value === vehicle.id) clearForm();
    });

    actions.append(editButton, removeButton);
    item.append(title, actions);
    adminList.append(item);
  });
}

adminForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const vehicle = vehicleFromForm();

  if (!validateVehicle(vehicle)) {
    setStatus("Preencha os campos obrigatórios antes de salvar.", "error");
    return;
  }

  const vehicles = loadStoredVehicles();
  const vehicleIndex = vehicles.findIndex((currentVehicle) => currentVehicle.id === vehicle.id);
  if (vehicleIndex >= 0) {
    vehicles[vehicleIndex] = vehicle;
  } else {
    vehicles.unshift(vehicle);
  }

  saveVehicles(vehicles);
  renderVehicles();
  clearForm();
  setStatus("Veículo atualizado em memória. Exporte os dados e substitua vehicles-data.js para publicar.");
});

clearButton.addEventListener("click", clearForm);

discardDraftButton.addEventListener("click", () => {
  const confirmed = window.confirm("Descartar alterações em memória e recarregar os veículos publicados em vehicles-data.js?");
  if (!confirmed) return;

  saveVehicles(structuredClone(loadPublishedVehicles()));
  clearForm();
  renderVehicles();
  setStatus("Alterações em memória descartadas. Os veículos publicados foram recarregados.");
});

fields.completo.addEventListener("change", () => {
  if (fields.completo.checked) applyCompleteOptionals();
});

fields.opcionais.addEventListener("input", syncCompleteCheckbox);

exportButton.addEventListener("click", async () => {
  const data = `"use strict";\n\nwindow.VEHICLES_DATA = ${JSON.stringify(loadStoredVehicles(), null, 2)};\n`;
  try {
    await navigator.clipboard.writeText(data);
    setStatus("Dados copiados. Substitua o conteúdo de vehicles-data.js por esse texto para publicar.");
  } catch (error) {
    setStatus(data, "success");
  }
});

renderVehicles();
