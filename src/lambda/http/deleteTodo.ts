import "source-map-support/register";
import { deleteTodoItem } from "../../businessLogic/todos";
import { todoExists } from "../../businessLogic/todos";

import * as express from "express";
import * as awsServerlessExpress from "aws-serverless-express";

const app = express();

app.delete("/todos/:todoId", async (_req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Rquested-With, Content-Type, Accept"
  );

  const todoId = _req.params.todoId;
  const validTodoId = await todoExists(todoId);

  if (!validTodoId) {
    res.json({
      body: JSON.stringify({
        error: "Todo does not exist",
      }),
    });
    res.status(404).send();
  }

  await deleteTodoItem(todoId);
  res.status(200).send();
});

const server = awsServerlessExpress.createServer(app);
exports.handler = (event, context) => {
  awsServerlessExpress.proxy(server, event, context);
};
