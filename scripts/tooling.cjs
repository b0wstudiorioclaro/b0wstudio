module.exports = name => {
  try { return require(name); }
  catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
    return require(require('node:path').join(__dirname, '../.tools/node_modules', name));
  }
};
