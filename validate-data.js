"use strict";

const fs = require("fs");
const path = require("path");

global.window = {};
require("./vehicles-data.js");

const vehicles = window.VEHICLES_DATA;
const requiredFields = ["id", "marca", "modelo", "versao", "ano", "cambio", "combustivel", "cor", "descricao"];
const errors = [];

if (!Array.isArray(vehicles)) {
  errors.push("vehicles-data.js precisa definir window.VEHICLES_DATA como array.");
} else {
  const ids = new Set();

  vehicles.forEach((vehicle, index) => {
    const label = vehicle && vehicle.id ? vehicle.id : `veiculo #${index + 1}`;

    requiredFields.forEach((field) => {
      if (!vehicle || typeof vehicle[field] !== "string" || !vehicle[field].trim()) {
        errors.push(`${label}: campo obrigatorio ausente ou vazio: ${field}`);
      }
    });

    if (ids.has(vehicle.id)) {
      errors.push(`${label}: id duplicado.`);
    }
    ids.add(vehicle.id);

    if (!Array.isArray(vehicle.imagens)) {
      errors.push(`${label}: imagens precisa ser um array.`);
      return;
    }

    vehicle.imagens.forEach((imagePath) => {
      if (typeof imagePath !== "string" || !imagePath.trim()) {
        errors.push(`${label}: caminho de imagem vazio ou invalido.`);
        return;
      }

      if (/^https?:\/\//i.test(imagePath)) return;

      const absolutePath = path.join(__dirname, imagePath);
      if (!fs.existsSync(absolutePath)) {
        errors.push(`${label}: imagem nao encontrada: ${imagePath}`);
      }
    });
  });
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`OK: ${vehicles.length} veiculos validados.`);
