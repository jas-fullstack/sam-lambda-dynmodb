const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const region = process.env.AWS_REGION || "ap-south-1";
const endpoint = process.env.DYNAMODB_ENDPOINT;

const config = { region };

// Only DynamoDB Local needs an explicit endpoint + dummy keys.
// In AWS Lambda, omit both so the SDK uses the real DynamoDB API and IAM role.
if (endpoint) {
  config.endpoint = endpoint;
  config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local",
  };
}

const client = new DynamoDBClient(config);
const docClient = DynamoDBDocumentClient.from(client);

module.exports = {
  client,
  docClient,
  tableName: process.env.USERS_TABLE || "Users",
};
