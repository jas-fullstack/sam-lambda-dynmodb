const { createApp } = require("./server");

const port = Number(process.env.PORT) || 3000;

createApp().listen(port, () => {
  console.log(`Local Express API: http://127.0.0.1:${port}/users`);
});
