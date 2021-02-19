import "source-map-support/register";

import { UpdateTodoRequest } from "../../requests/UpdateTodoRequest";
import { updateTodoItem } from "../../businessLogic/todos";

import * as bodyParser from "body-parser";
import * as express from "express";
import * as awsServerlessExpress from "aws-serverless-express";

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.patch("/todos/:todoId", async (_req, res) => {
  const authorization = _req.headers.authorization;
  const split = authorization.split(" ");
  const jwtToken = split[1];
  const todoId = _req.params.todoId;

  const updatedItem: UpdateTodoRequest = _req.body;
  await updateTodoItem(todoId, updatedItem, jwtToken);

  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Rquested-With, Content-Type, Accept"
  );
  res.status(200).send();
});

const server = awsServerlessExpress.createServer(app);
exports.handler = (event, context) => {
  awsServerlessExpress.proxy(server, event, context);
};
