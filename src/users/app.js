const serverlessExpress = require("@codegenie/serverless-express");
const { createApp } = require("./server");

exports.lambdaHandler = serverlessExpress({ app: createApp() });
