const Despesa = require('../models/despesaModel');

exports.getAll = async (req, res) => {
  const data = await Despesa.getAll();
  res.json(data);
};

exports.getById = async (req, res) => {
  const data = await Despesa.getById(req.params.id);
  res.json(data);
};

exports.create = async (req, res) => {
  const nova = await Despesa.create(req.body);
  res.status(201).json(nova);
};

exports.update = async (req, res) => {
  await Despesa.update(req.params.id, req.body);
  res.sendStatus(204);
};

exports.remove = async (req, res) => {
  await Despesa.remove(req.params.id);
  res.sendStatus(204);
};
