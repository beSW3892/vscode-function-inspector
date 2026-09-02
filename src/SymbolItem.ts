import * as vscode from 'vscode';
import { DisplayOptions } from './DisplayOptions';

export class SymbolItem extends vscode.TreeItem
{
    constructor(
        readonly symbol: vscode.DocumentSymbol,
        readonly uri: vscode.Uri,
        readonly options: DisplayOptions
    )
    {
        const isFunction =
            symbol.kind === vscode.SymbolKind.Function ||
            symbol.kind === vscode.SymbolKind.Method ||
            symbol.kind === vscode.SymbolKind.Constructor;

        const hasDetails =
            isFunction &&
            options.showDetails;

        const hasChildren =
            symbol.children.length > 0;

        super(
            symbol.name,
            hasDetails || hasChildren
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None
        );

        this.contextValue =
            isFunction
                ? "functionItem"
                : "containerItem";

        this.iconPath =
            new vscode.ThemeIcon(
                this.getIcon(symbol.kind)
            );

        this.description = undefined;

        if(
            options.showParameters &&
            symbol.detail
        )
        {
            this.description =
                symbol.detail;
        }

        this.command =
        {
            command: "functionInspector.jump",
            title: "Jump",
            arguments: [this]
        };
    }
    
    private getIcon(
        kind: vscode.SymbolKind
    ): string
    {
        switch(kind)
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

            case vscode.SymbolKind.Interface:
                return "symbol-interface";

            default:
                return "symbol-misc";
        }
    }
}