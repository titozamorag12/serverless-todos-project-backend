import "source-map-support/register";
import { getAllTodoItems } from "../../businessLogic/todos";

import * as express from "express";
import * as awsServerlessExpress from "aws-serverless-express";

const app = express();

app.get("/todos", async (_req, res) => {
  const authorization = _req.headers.authorization;
  const split = authorization.split(" ");
  const jwtToken = split[1];
  const todos = await getAllTodoItems(jwtToken);
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Rquested-With, Content-Type, Accept"
  );
  res.json({
    items: todos,
  });
  res.status(200).send();
});

const server = awsServerlessExpress.createServer(app);
exports.handler = (event, context) => {
  awsServerlessExpress.proxy(server, event, context);
};
