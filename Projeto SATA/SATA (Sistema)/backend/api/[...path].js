const { app, init } = require('../app');

module.exports = async (req, res) => {
  await init(true);
  return app(req, res);
};

