const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve all static files (HTML, CSS, images, etc.)
app.use(express.static(path.join(__dirname)));

// Default route → index-v2.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index-v2.html'));
});

app.listen(PORT, () => {
  console.log(`CLAE Agency running on port ${PORT}`);
});
