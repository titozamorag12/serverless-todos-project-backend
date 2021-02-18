import * as uuid from "uuid";

import { TodoItem } from "../models/TodoItem";
import { TodoItemAccess } from "../dataLayer/todosAccess";
import { CreateTodoRequest } from "../requests/CreateTodoRequest";
import { parseUserId } from "../auth/utils";

const todosAccess = new TodoItemAccess();

export async function getAllTodoItems(): Promise<TodoItem[]> {
  return todosAccess.getAllTodoItems();
}

export async function deleteTodoItem(todoId: String) {
  return todosAccess.deleteTodoItem(todoId);
}

export async function createTodoItem(
  CreateTodoRequest: CreateTodoRequest,
  jwtToken: string
): Promise<TodoItem> {
  const itemId = uuid.v4();
  const userId = parseUserId(jwtToken);

  return await todosAccess.createTodoItem({
    todoId: itemId,
    userId: userId,
    name: CreateTodoRequest.name,
    dueDate: CreateTodoRequest.dueDate,
    createdAt: new Date().toISOString(),
    done: false,
    attachmentUrl: "",
  });
}
