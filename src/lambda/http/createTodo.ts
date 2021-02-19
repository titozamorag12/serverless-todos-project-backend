import "source-map-support/register";

import { CreateTodoRequest } from "../../requests/CreateTodoRequest";
import { createTodoItem } from "../../businessLogic/todos";

import * as bodyParser from "body-parser";
import * as express from "express";
import * as awsServerlessExpress from "aws-serverless-express";

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/todos", async (_req, res) => {
  const authorization = _req.headers.authorization;
  const split = authorization.split(" ");
  const jwtToken = split[1];

  const newTodoItem: CreateTodoRequest = _req.body;
  const item = await createTodoItem(newTodoItem, jwtToken);

  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Rquested-With, Content-Type, Accept"
  );
  res.json({
    item: item,
  });
  res.status(201).send();
});

const server = awsServerlessExpress.createServer(app);
exports.handler = (event, context) => {
  awsServerlessExpress.proxy(server, event, context);
};
