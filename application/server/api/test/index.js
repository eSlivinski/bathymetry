
exports.attachHandlers = function(router) {
  router.all('/api/test/*', (req, res, next) => {
    res.send('FOO!');
  });
};
