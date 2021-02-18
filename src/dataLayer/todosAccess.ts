import * as AWS from "aws-sdk";
import * as AWSXRay from "aws-xray-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const XAWS = AWSXRay.captureAWS(AWS);

import { TodoItem } from "../models/TodoItem";

export class TodoItemAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly TodoItemsTable = process.env.TODOS_TABLE
  ) {}

  async getAllTodoItems(): Promise<TodoItem[]> {
    console.log("Getting all TodoItems");

    const result = await this.docClient
      .scan({
        TableName: this.TodoItemsTable,
      })
      .promise();

    const items = result.Items;
    return items as TodoItem[];
  }

  async createTodoItem(TodoItem: TodoItem): Promise<TodoItem> {
    await this.docClient
      .put({
        TableName: this.TodoItemsTable,
        Item: TodoItem,
      })
      .promise();

    return TodoItem;
  }

  async deleteTodoItem(todoId: String) {
    await this.docClient
      .delete({
        TableName: this.TodoItemsTable,
        Key: {
          todoId: todoId,
        },
      })
      .promise();
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log("Creating a local DynamoDB instance");
    return new XAWS.DynamoDB.DocumentClient({
      region: "localhost",
      endpoint: "http://localhost:8000",
    });
  }

  return new XAWS.DynamoDB.DocumentClient();
}
