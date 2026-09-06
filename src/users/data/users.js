const { GetCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient, tableName } = require("../db/dynamo");

const listAllUsers = async () => {
  const result = await docClient.send(
    new ScanCommand({ TableName: tableName })
  );
  return result.Items || [];
};

const findUserById = async (id) => {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { id },
    })
  );
  return result.Item;
};

module.exports = { listAllUsers, findUserById };
