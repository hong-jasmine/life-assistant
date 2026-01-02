// ========== 命令管理器 ==========
// 使用命令模式實現撤銷/重做功能

class Command {
    execute() {
        throw new Error('execute() must be implemented');
    }

    undo() {
        throw new Error('undo() must be implemented');
    }

    getDescription() {
        return 'Unknown command';
    }
}

// 新增交易命令
class AddTransactionCommand extends Command {
    constructor(transaction) {
        super();
        this.transaction = { ...transaction };
    }

    execute() {
        transactions.push(this.transaction);
        saveAndRender();
    }

    undo() {
        const index = transactions.findIndex(t => t.id === this.transaction.id);
        if (index !== -1) {
            transactions.splice(index, 1);
            saveAndRender();
        }
    }

    getDescription() {
        return `新增交易: ${this.transaction.name}`;
    }
}

// 刪除交易命令
class DeleteTransactionCommand extends Command {
    constructor(transactionId) {
        super();
        this.transactionId = transactionId;
        this.deletedTransaction = null;
        this.deletedIndex = -1;
    }

    execute() {
        this.deletedIndex = transactions.findIndex(t => t.id === this.transactionId);
        if (this.deletedIndex !== -1) {
            this.deletedTransaction = { ...transactions[this.deletedIndex] };
            transactions.splice(this.deletedIndex, 1);
            saveAndRender();
        }
    }

    undo() {
        if (this.deletedTransaction && this.deletedIndex !== -1) {
            transactions.splice(this.deletedIndex, 0, this.deletedTransaction);
            saveAndRender();
        }
    }

    getDescription() {
        return `刪除交易: ${this.deletedTransaction?.description || ''}`;
    }
}

// 新增待辦事項命令
class AddTodoCommand extends Command {
    constructor(todo) {
        super();
        this.todo = { ...todo };
    }

    execute() {
        todos.push(this.todo);
        saveAndRender();
    }

    undo() {
        const index = todos.findIndex(t => t.id === this.todo.id);
        if (index !== -1) {
            todos.splice(index, 1);
            saveAndRender();
        }
    }

    getDescription() {
        return `新增待辦: ${this.todo.text}`;
    }
}

// 刪除待辦事項命令
class DeleteTodoCommand extends Command {
    constructor(todoId) {
        super();
        this.todoId = todoId;
        this.deletedTodo = null;
        this.deletedIndex = -1;
    }

    execute() {
        this.deletedIndex = todos.findIndex(t => t.id === this.todoId);
        if (this.deletedIndex !== -1) {
            this.deletedTodo = { ...todos[this.deletedIndex] };
            todos.splice(this.deletedIndex, 1);
            saveAndRender();
        }
    }

    undo() {
        if (this.deletedTodo && this.deletedIndex !== -1) {
            todos.splice(this.deletedIndex, 0, this.deletedTodo);
            saveAndRender();
        }
    }

    getDescription() {
        return `刪除待辦: ${this.deletedTodo?.text || ''}`;
    }
}

// 切換待辦完成狀態命令
class ToggleTodoCommand extends Command {
    constructor(todoId) {
        super();
        this.todoId = todoId;
        this.previousState = null;
    }

    execute() {
        const todo = todos.find(t => t.id === this.todoId);
        if (todo) {
            this.previousState = todo.done;
            todo.done = !todo.done;
            saveAndRender();
        }
    }

    undo() {
        const todo = todos.find(t => t.id === this.todoId);
        if (todo && this.previousState !== null) {
            todo.done = this.previousState;
            saveAndRender();
        }
    }

    getDescription() {
        return `切換待辦狀態`;
    }
}

// 新增帳戶命令
class AddAccountCommand extends Command {
    constructor(account) {
        super();
        this.account = { ...account };
    }

    execute() {
        accounts.push(this.account);
        saveData();
        renderSidebarAccounts();
    }

    undo() {
        const index = accounts.findIndex(a => a.id === this.account.id);
        if (index !== -1) {
            accounts.splice(index, 1);
            saveData();
            renderSidebarAccounts();
        }
    }

    getDescription() {
        return `新增帳戶: ${this.account.name}`;
    }
}

// 刪除帳戶命令
class DeleteAccountCommand extends Command {
    constructor(accountId) {
        super();
        this.accountId = accountId;
        this.deletedAccount = null;
        this.deletedIndex = -1;
    }

    execute() {
        this.deletedIndex = accounts.findIndex(a => a.id === this.accountId);
        if (this.deletedIndex !== -1) {
            this.deletedAccount = { ...accounts[this.deletedIndex] };
            accounts.splice(this.deletedIndex, 1);
            saveData();
            renderSidebarAccounts();
        }
    }

    undo() {
        if (this.deletedAccount && this.deletedIndex !== -1) {
            accounts.splice(this.deletedIndex, 0, this.deletedAccount);
            saveData();
            renderSidebarAccounts();
        }
    }

    getDescription() {
        return `刪除帳戶: ${this.deletedAccount?.name || ''}`;
    }
}

// 命令管理器
class CommandManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxStackSize = 50; // 限制堆疊大小
    }

    executeCommand(command) {
        command.execute();
        this.undoStack.push(command);

        // 限制堆疊大小
        if (this.undoStack.length > this.maxStackSize) {
            this.undoStack.shift();
        }

        // 執行新命令後清空重做堆疊
        this.redoStack = [];

        this.updateUI();
    }

    undo() {
        if (this.undoStack.length === 0) return;

        const command = this.undoStack.pop();
        command.undo();
        this.redoStack.push(command);

        this.updateUI();
    }

    redo() {
        if (this.redoStack.length === 0) return;

        const command = this.redoStack.pop();
        command.execute();
        this.undoStack.push(command);

        this.updateUI();
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    getUndoDescription() {
        if (this.undoStack.length === 0) return '';
        return this.undoStack[this.undoStack.length - 1].getDescription();
    }

    getRedoDescription() {
        if (this.redoStack.length === 0) return '';
        return this.redoStack[this.redoStack.length - 1].getDescription();
    }

    updateUI() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');

        if (undoBtn) {
            undoBtn.disabled = !this.canUndo();
            undoBtn.title = this.canUndo() ? `撤銷: ${this.getUndoDescription()}` : '無法撤銷';
        }

        if (redoBtn) {
            redoBtn.disabled = !this.canRedo();
            redoBtn.title = this.canRedo() ? `重做: ${this.getRedoDescription()}` : '無法重做';
        }
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.updateUI();
    }
}

// 全局命令管理器實例
const commandManager = new CommandManager();
