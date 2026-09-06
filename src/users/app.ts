import serverlessExpress from "@codegenie/serverless-express";
import { createApp } from "./server";

export const lambdaHandler = serverlessExpress({ app: createApp() });
