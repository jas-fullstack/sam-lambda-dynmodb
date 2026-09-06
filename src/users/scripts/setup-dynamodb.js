process.env.AWS_REGION = process.env.AWS_REGION || "ap-south-1";
process.env.DYNAMODB_ENDPOINT =
  process.env.DYNAMODB_ENDPOINT || "http://127.0.0.1:8000";
process.env.USERS_TABLE = process.env.USERS_TABLE || "Users";
process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "local";
process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "local";

const {
  CreateTableCommand,
  DescribeTableCommand,
  ListTablesCommand,
} = require("@aws-sdk/client-dynamodb");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { client, docClient, tableName } = require("../db/dynamo");

const seedUsers = [
  { id: "1", name: "Alice", email: "alice@example.com" },
  { id: "2", name: "Bob", email: "bob@example.com" },
  { id: "3", name: "Charlie", email: "charlie@example.com" },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForDynamo = async () => {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      await client.send(new ListTablesCommand({}));
      return;
    } catch (error) {
      if (attempt === 20) {
        throw new Error(
          `DynamoDB Local is not ready at ${process.env.DYNAMODB_ENDPOINT}: ${error.message}`
        );
      }
      await sleep(500);
    }
  }
};

const tableExists = async () => {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    if (error.name === "ResourceNotFoundException") {
      return false;
    }
    throw error;
  }
};

const createTable = async () => {
  await client.send(
    new CreateTableCommand({
      TableName: tableName,
      AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
      KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      BillingMode: "PAY_PER_REQUEST",
    })
  );

  let ready = false;
  while (!ready) {
    const described = await client.send(
      new DescribeTableCommand({ TableName: tableName })
    );
    ready = described.Table.TableStatus === "ACTIVE";
    if (!ready) {
      await sleep(300);
    }
  }
};

const seed = async () => {
  for (const user of seedUsers) {
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: user,
      })
    );
  }
};

const main = async () => {
  await waitForDynamo();

  if (await tableExists()) {
    console.log(`Table "${tableName}" already exists`);
  } else {
    await createTable();
    console.log(`Created table "${tableName}"`);
  }

  await seed();
  console.log("Seeded users 1, 2, 3");
  console.log(`DynamoDB Local is ready at ${process.env.DYNAMODB_ENDPOINT}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
