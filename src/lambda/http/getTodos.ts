import "source-map-support/register";
import { getAllTodoItems } from "../../businessLogic/todos";

import * as express from "express";
import * as awsServerlessExpress from "aws-serverless-express";

const app = express();

app.get("/todos", async (_req, res) => {
  const todos = await getAllTodoItems();
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Rquested-With, Content-Type, Accept"
  );
  res.json({
    items: todos,
  });
});

const server = awsServerlessExpress.createServer(app);
exports.handler = (event, context) => {
  awsServerlessExpress.proxy(server, event, context);
};
