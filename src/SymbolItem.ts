import * as vscode from 'vscode';

export class SymbolItem extends vscode.TreeItem
{
    constructor(
        readonly symbol: vscode.DocumentSymbol,
        readonly uri: vscode.Uri,
        collapsibleState: vscode.TreeItemCollapsibleState
    )
    {
        super(
            symbol.name,
            collapsibleState
        );

        this.contextValue = "symbolItem";
        this.iconPath = new vscode.ThemeIcon(
            this.getIcon(symbol.kind)
        );

        this.command = {
            command: "functionInspector.jump",
            title: "Jump",
            arguments: [this]
        };
    }

    private getIcon(kind: vscode.SymbolKind): string
    {
        switch (kind)
        {
            case vscode.SymbolKind.Class:
                return "symbol-class";

            case vscode.SymbolKind.Method:
                return "symbol-method";

            case vscode.SymbolKind.Function:
                return "symbol-function";

            case vscode.SymbolKind.Struct:
                return "symbol-struct";

            case vscode.SymbolKind.Enum:
                return "symbol-enum";

            case vscode.SymbolKind.Namespace:
                return "symbol-namespace";

            default:
                return "symbol-misc";
        }
    }
}