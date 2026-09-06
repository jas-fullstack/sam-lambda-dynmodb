process.env.AWS_REGION = process.env.AWS_REGION || "ap-south-1";
process.env.DYNAMODB_ENDPOINT =
  process.env.DYNAMODB_ENDPOINT || "http://127.0.0.1:8000";
process.env.USERS_TABLE = process.env.USERS_TABLE || "Users";
process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "local";
process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "local";

const { createApp } = require("./server");

const port = Number(process.env.PORT) || 3000;

createApp().listen(port, () => {
  console.log(`Local Express API: http://127.0.0.1:${port}/users`);
  console.log(`DynamoDB: ${process.env.DYNAMODB_ENDPOINT} table=${process.env.USERS_TABLE}`);
});
