"use strict";

const WHATSAPP_NUMBER = "359877992014";
const GENERAL_MESSAGE = "Olá, visitei o site da Dutra Veículos e gostaria de mais informações.";
const PLACEHOLDER_IMAGE = "assets/images/car-placeholder.svg";

let vehicles = [];

function normalizeText(value, fallback = "A confirmar") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}

function normalizeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function normalizeList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeText(item, "")).filter(Boolean);
}

function normalizeVehicle(vehicle, index) {
  return {
    id: vehicle.id || `vehicle-${index + 1}`,
    marca: normalizeText(vehicle.marca),
    modelo: normalizeText(vehicle.modelo),
    versao: normalizeText(vehicle.versao),
    ano: normalizeText(vehicle.ano),
    quilometragem: normalizeNumber(vehicle.quilometragem),
    cambio: normalizeText(vehicle.cambio),
    combustivel: normalizeText(vehicle.combustivel),
    cor: normalizeText(vehicle.cor),
    preco: normalizeNumber(vehicle.preco),
    descricao: normalizeText(vehicle.descricao, "Veículo cadastrado pelo painel administrativo. Informações e condições sujeitas à confirmação no atendimento."),
    opcionais: normalizeList(vehicle.opcionais),
    imagens: normalizeList(vehicle.imagens),
    completo: Boolean(vehicle.completo),
    destaque: Boolean(vehicle.destaque),
    vendido: Boolean(vehicle.vendido)
  };
}

function loadVehiclesFromData() {
  const data = Array.isArray(window.VEHICLES_DATA) ? window.VEHICLES_DATA : [];
  return data.map(normalizeVehicle);
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0
});
const numberFormatter = new Intl.NumberFormat("pt-BR");

const inventory = document.querySelector("#inventory");
const emptyState = document.querySelector("#empty-state");
const searchFilter = document.querySelector("#search-filter");
const filtersForm = document.querySelector("#filters-form");
const vehicleInterest = document.querySelector("#vehicle-interest");

function buildWhatsAppUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function formatPrice(value) {
  return Number.isFinite(value) ? currencyFormatter.format(value) : "Preço sob consulta";
}

function formatMileage(value) {
  return Number.isFinite(value) ? `${numberFormatter.format(value)} km` : "Quilometragem a confirmar";
}

function safeImages(vehicle) {
  return Array.isArray(vehicle.imagens) && vehicle.imagens.length ? vehicle.imagens : [PLACEHOLDER_IMAGE];
}

function createVehicleCard(vehicle) {
  const article = document.createElement("article");
  article.className = "vehicle-card reveal";
  const images = safeImages(vehicle);
  let cardImageIndex = 0;

  const imageWrap = document.createElement("div");
  imageWrap.className = "vehicle-image-wrap";

  const image = document.createElement("img");
  image.className = "vehicle-image";
  image.src = images[cardImageIndex];
  image.alt = `Foto do ${vehicle.marca} ${vehicle.modelo}`;
  image.loading = "lazy";
  image.width = 720;
  image.height = 450;
  image.onerror = () => { image.src = PLACEHOLDER_IMAGE; };
  imageWrap.append(image);

  if (images.length > 1) {
    const counter = document.createElement("span");
    counter.className = "vehicle-image-counter";

    const updateCardImage = (direction) => {
      cardImageIndex = (cardImageIndex + direction + images.length) % images.length;
      image.src = images[cardImageIndex];
      image.alt = `Foto ${cardImageIndex + 1} do ${vehicle.marca} ${vehicle.modelo}`;
      counter.textContent = `${cardImageIndex + 1}/${images.length}`;
    };

    const prevImage = document.createElement("button");
    prevImage.type = "button";
    prevImage.className = "vehicle-image-control vehicle-image-prev";
    prevImage.setAttribute("aria-label", "Foto anterior");
    prevImage.textContent = "‹";
    prevImage.addEventListener("click", (event) => {
      event.stopPropagation();
      updateCardImage(-1);
    });

    const nextImage = document.createElement("button");
    nextImage.type = "button";
    nextImage.className = "vehicle-image-control vehicle-image-next";
    nextImage.setAttribute("aria-label", "Próxima foto");
    nextImage.textContent = "›";
    nextImage.addEventListener("click", (event) => {
      event.stopPropagation();
      updateCardImage(1);
    });

    counter.textContent = `${cardImageIndex + 1}/${images.length}`;
    imageWrap.append(prevImage, nextImage, counter);
  }

  if (vehicle.destaque || vehicle.vendido) {
    const badge = document.createElement("span");
    badge.className = `vehicle-badge${vehicle.vendido ? " sold" : ""}`;
    badge.textContent = vehicle.vendido ? "Vendido" : "Destaque";
    imageWrap.append(badge);
  }

  const body = document.createElement("div");
  body.className = "vehicle-body";

  const brand = document.createElement("p");
  brand.className = "vehicle-brand";
  brand.textContent = vehicle.marca;

  const title = document.createElement("h3");
  title.className = "vehicle-title";
  title.textContent = vehicle.modelo;

  const version = document.createElement("p");
  version.className = "vehicle-version";
  version.textContent = vehicle.versao;

  const meta = document.createElement("div");
  meta.className = "vehicle-meta";
  const metaItems = [vehicle.ano, formatMileage(vehicle.quilometragem), vehicle.cambio];
  if (vehicle.completo) metaItems.push("Completo");

  metaItems.forEach((value) => {
    const item = document.createElement("span");
    item.textContent = value;
    meta.append(item);
  });

  const footer = document.createElement("div");
  footer.className = "vehicle-footer";

  const price = document.createElement("div");
  price.className = "vehicle-price";
  const priceLabel = document.createElement("small");
  priceLabel.textContent = Number.isFinite(vehicle.preco) ? "A partir de" : "Valor";
  const priceValue = document.createElement("strong");
  priceValue.textContent = formatPrice(vehicle.preco);
  price.append(priceLabel, priceValue);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "button button-primary";
  button.textContent = "Ver detalhes";
  button.disabled = vehicle.vendido;
  button.addEventListener("click", () => openVehicleModal(vehicle.id));

  footer.append(price, button);
  body.append(brand, title, version, meta, footer);
  article.append(imageWrap, body);

  return article;
}

function observeReveals(root = document) {
  const elements = root.querySelectorAll(".reveal:not(.visible)");
  if (!elements.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elements.forEach((element) => element.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  elements.forEach((element) => observer.observe(element));
}

function renderVehicles(list = vehicles.filter((vehicle) => !vehicle.vendido)) {
  inventory.replaceChildren();
  list.forEach((vehicle) => inventory.append(createVehicleCard(vehicle)));
  emptyState.hidden = list.length > 0;
  observeReveals(inventory);
}

function populateFiltersAndForm() {
  while (vehicleInterest.options.length > 1) {
    vehicleInterest.remove(1);
  }

  vehicles.filter((vehicle) => !vehicle.vendido).forEach((vehicle) => {
    const option = document.createElement("option");
    option.value = `${vehicle.marca} ${vehicle.modelo} ${vehicle.versao}`;
    option.textContent = `${vehicle.marca} ${vehicle.modelo} — ${vehicle.versao}`;
    vehicleInterest.append(option);
  });
}

function filterVehicles() {
  const term = searchFilter.value.trim().toLocaleLowerCase("pt-BR");

  const result = vehicles.filter((vehicle) => {
    if (vehicle.vendido) return false;
    const searchText = `${vehicle.marca} ${vehicle.modelo} ${vehicle.versao}`.toLocaleLowerCase("pt-BR");
    return !term || searchText.includes(term);
  });

  renderVehicles(result);
}

searchFilter.addEventListener("input", filterVehicles);
filtersForm.addEventListener("reset", () => window.setTimeout(() => renderVehicles(), 0));

// Menu mobile
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");

function closeMenu() {
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Abrir menu");
  document.body.classList.remove("menu-open");
}

menuToggle.addEventListener("click", () => {
  const willOpen = !mainNav.classList.contains("open");
  mainNav.classList.toggle("open", willOpen);
  menuToggle.setAttribute("aria-expanded", String(willOpen));
  menuToggle.setAttribute("aria-label", willOpen ? "Fechar menu" : "Abrir menu");
  document.body.classList.toggle("menu-open", willOpen);
});
mainNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
window.addEventListener("resize", () => { if (window.innerWidth >= 900) closeMenu(); });

// Header e WhatsApp
const siteHeader = document.querySelector(".site-header");
const heroSection = document.querySelector(".hero");

function updateHeaderState() {
  if (!heroSection) {
    siteHeader.classList.add("scrolled");
    return;
  }

  const headerHeight = siteHeader.offsetHeight;
  const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
  const isOverHero = window.scrollY + headerHeight < heroBottom;

  document.body.classList.toggle("header-over-hero", isOverHero);
  siteHeader.classList.toggle("scrolled", !isOverHero);
}

updateHeaderState();
window.addEventListener("scroll", updateHeaderState, { passive: true });
window.addEventListener("resize", updateHeaderState);
document.querySelectorAll('[data-whatsapp="general"]').forEach((link) => {
  link.href = buildWhatsAppUrl(GENERAL_MESSAGE);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
});

// Modal e galeria
const modal = document.querySelector("#vehicle-modal");
const modalMainImage = document.querySelector("#modal-main-image");
const modalBrand = document.querySelector("#modal-brand");
const modalTitle = document.querySelector("#modal-title");
const modalVersion = document.querySelector("#modal-version");
const modalPrice = document.querySelector("#modal-price");
const modalSpecs = document.querySelector("#modal-specs");
const modalDescription = document.querySelector("#modal-description");
const modalOptions = document.querySelector("#modal-options");
const modalInterest = document.querySelector("#modal-interest");
const galleryThumbs = document.querySelector("#gallery-thumbs");
const galleryCounter = document.querySelector("#gallery-counter");
const galleryPrev = document.querySelector(".gallery-prev");
const galleryNext = document.querySelector(".gallery-next");
let activeVehicle = null;
let activeImageIndex = 0;
let lastFocusedElement = null;
let touchStartX = 0;

function updateGallery() {
  const images = safeImages(activeVehicle);
  const imagePath = images[activeImageIndex];
  modalMainImage.src = imagePath;
  modalMainImage.alt = `Foto ${activeImageIndex + 1} do ${activeVehicle.marca} ${activeVehicle.modelo}`;
  modalMainImage.onerror = () => { modalMainImage.src = PLACEHOLDER_IMAGE; };
  galleryCounter.textContent = `${activeImageIndex + 1} de ${images.length}`;
  galleryPrev.disabled = images.length < 2;
  galleryNext.disabled = images.length < 2;
  galleryThumbs.querySelectorAll(".gallery-thumb").forEach((thumb, index) => {
    thumb.classList.toggle("active", index === activeImageIndex);
    thumb.setAttribute("aria-current", index === activeImageIndex ? "true" : "false");
  });
}

function addSpec(label, value) {
  const group = document.createElement("div");
  const term = document.createElement("dt");
  const description = document.createElement("dd");
  term.textContent = label;
  description.textContent = value;
  group.append(term, description);
  modalSpecs.append(group);
}

function openVehicleModal(id) {
  activeVehicle = vehicles.find((vehicle) => vehicle.id === id);
  if (!activeVehicle) return;

  activeImageIndex = 0;
  lastFocusedElement = document.activeElement;
  modalBrand.textContent = activeVehicle.marca;
  modalTitle.textContent = activeVehicle.modelo;
  modalVersion.textContent = activeVehicle.versao;
  modalPrice.textContent = formatPrice(activeVehicle.preco);
  modalDescription.textContent = activeVehicle.descricao;

  modalSpecs.replaceChildren();
  addSpec("Ano", activeVehicle.ano);
  addSpec("Quilometragem", formatMileage(activeVehicle.quilometragem));
  addSpec("Câmbio", activeVehicle.cambio);
  addSpec("Combustível", activeVehicle.combustivel);
  addSpec("Cor", activeVehicle.cor);

  modalOptions.replaceChildren();
  activeVehicle.opcionais.forEach((option) => {
    const item = document.createElement("li");
    item.textContent = option;
    modalOptions.append(item);
  });

  galleryThumbs.replaceChildren();
  safeImages(activeVehicle).forEach((imagePath, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gallery-thumb";
    button.setAttribute("aria-label", `Mostrar foto ${index + 1}`);
    button.addEventListener("click", () => {
      activeImageIndex = index;
      updateGallery();
    });
    const image = document.createElement("img");
    image.src = imagePath;
    image.alt = "";
    image.loading = "lazy";
    image.onerror = () => { image.src = PLACEHOLDER_IMAGE; };
    button.append(image);
    galleryThumbs.append(button);
  });

  const message = `Olá, visitei o site da Dutra Veículos e tenho interesse no ${activeVehicle.marca} ${activeVehicle.modelo} ${activeVehicle.versao}, ano ${activeVehicle.ano}, anunciado por ${formatPrice(activeVehicle.preco)}. O veículo ainda está disponível?`;
  modalInterest.href = buildWhatsAppUrl(message);
  modalInterest.target = "_blank";
  modalInterest.rel = "noopener noreferrer";

  updateGallery();
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  document.querySelector(".modal-close").focus();
}

function closeVehicleModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  activeVehicle = null;
  if (lastFocusedElement) lastFocusedElement.focus();
}

function stepGallery(direction) {
  if (!activeVehicle) return;
  const images = safeImages(activeVehicle);
  if (images.length < 2) return;
  activeImageIndex = (activeImageIndex + direction + images.length) % images.length;
  updateGallery();
}

galleryPrev.addEventListener("click", () => stepGallery(-1));
galleryNext.addEventListener("click", () => stepGallery(1));
document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeVehicleModal));
modalMainImage.addEventListener("touchstart", (event) => { touchStartX = event.changedTouches[0].screenX; }, { passive: true });
modalMainImage.addEventListener("touchend", (event) => {
  const difference = event.changedTouches[0].screenX - touchStartX;
  if (Math.abs(difference) > 50) stepGallery(difference > 0 ? -1 : 1);
}, { passive: true });

document.addEventListener("keydown", (event) => {
  if (!modal.classList.contains("open")) return;
  if (event.key === "Escape") closeVehicleModal();
  if (event.key === "ArrowLeft") stepGallery(-1);
  if (event.key === "ArrowRight") stepGallery(1);
});

// Formulário
const contactForm = document.querySelector("#contact-form");
const submitButton = document.querySelector("#submit-button");
const formStatus = document.querySelector("#form-status");

function setFieldError(fieldId, message) {
  const field = document.querySelector(`#${fieldId}`);
  const error = document.querySelector(`#${fieldId}-error`);
  if (error) error.textContent = message;
  if (field) field.setAttribute("aria-invalid", message ? "true" : "false");
}

function validateForm() {
  const name = document.querySelector("#name").value.trim();
  const phone = document.querySelector("#phone").value.trim();
  const email = document.querySelector("#email").value.trim();
  const message = document.querySelector("#message").value.trim();
  const consent = document.querySelector("#consent").checked;
  const phoneDigits = phone.replace(/\D/g, "");
  let valid = true;

  setFieldError("name", name.length >= 2 ? "" : "Informe seu nome completo.");
  setFieldError("phone", phoneDigits.length >= 8 ? "" : "Informe um telefone válido, incluindo o código do país ou DDD.");
  setFieldError("email", !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Informe um e-mail válido.");
  setFieldError("message", message.length >= 10 ? "" : "Escreva uma mensagem com pelo menos 10 caracteres.");
  setFieldError("consent", consent ? "" : "Você precisa autorizar o contato para enviar a mensagem.");

  ["name", "phone", "email", "message", "consent"].forEach((id) => {
    const error = document.querySelector(`#${id}-error`);
    if (error && error.textContent) valid = false;
  });
  return valid;
}

// Máscara leve, sem forçar o padrão brasileiro.
document.querySelector("#phone").addEventListener("input", (event) => {
  const raw = event.target.value.replace(/[^\d+()\-\s]/g, "").slice(0, 24);
  event.target.value = raw;
});

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formStatus.textContent = "";
  formStatus.className = "form-status field-full";

  if (!validateForm()) {
    formStatus.textContent = "Revise os campos destacados antes de enviar.";
    formStatus.classList.add("error");
    const firstInvalid = contactForm.querySelector('[aria-invalid="true"]');
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  const endpoint = contactForm.getAttribute("action");
  if (!endpoint || endpoint.includes("COLE_AQUI")) {
    formStatus.textContent = "O formulário ainda não está conectado ao Formspree. Use o WhatsApp ou configure o endpoint no index.html.";
    formStatus.classList.add("error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Enviando...";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: new FormData(contactForm),
      headers: { Accept: "application/json" }
    });

    if (!response.ok) throw new Error("Falha no envio");
    contactForm.reset();
    formStatus.textContent = "Mensagem enviada. Entraremos em contato assim que possível.";
    formStatus.classList.add("success");
  } catch (error) {
    formStatus.textContent = "Não foi possível enviar agora. Tente novamente ou fale conosco pelo WhatsApp.";
    formStatus.classList.add("error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Enviar mensagem";
  }
});

// Inicialização
async function init() {
  vehicles = loadVehiclesFromData();
  populateFiltersAndForm();
  renderVehicles();
  observeReveals();
  document.querySelector("#current-year").textContent = new Date().getFullYear();
}

init();
