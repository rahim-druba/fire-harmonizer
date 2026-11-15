'use strict';
const app = require('./server');
const {handler} = require('./lib/announcements');
app.get('/api/announcements', handler);
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Fire Harmonizer running on http://localhost:${port}`));
}
module.exports = app;
