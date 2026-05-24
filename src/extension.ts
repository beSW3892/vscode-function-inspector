import * as vscode from 'vscode';

class FunctionItem
extends vscode.TreeItem
{
    constructor(
        readonly symbol:
            vscode.DocumentSymbol
    )
    {
        super(
            symbol.name,
            vscode.TreeItemCollapsibleState.None
        );

        const start =
            symbol.range.start.line + 1;

        const end =
            symbol.range.end.line + 1;

        this.description =
            `L${start}-${end}`;

        this.command = {
            command:'funcInfo.jump',
            title:'Jump',
            arguments:[symbol]
        };
    }
}

class FunctionProvider
implements vscode.TreeDataProvider<FunctionItem>
{
    private refreshEmitter =
        new vscode.EventEmitter<void>();

    readonly onDidChangeTreeData =
        this.refreshEmitter.event;

    refresh()
    {
        this.refreshEmitter.fire();
    }

    getTreeItem(
        item: FunctionItem
    )
    {
        return item;
    }

    async getChildren()
    {
        const editor =
            vscode.window.activeTextEditor;

        if(!editor)
        {
            return [];
        }

        const symbols =
            await vscode.commands.executeCommand<
                vscode.DocumentSymbol[]
            >(
                'vscode.executeDocumentSymbolProvider',
                editor.document.uri
            );

        if(!symbols)
        {
            return [];
        }

        return symbols
            .filter(
                s =>
                    s.kind ===
                        vscode.SymbolKind.Function
                    ||
                    s.kind ===
                        vscode.SymbolKind.Method
            )
            .map(
                s =>
                    new FunctionItem(s)
            );
    }
}

export function activate(
    context:
        vscode.ExtensionContext
)
{
    const provider =
        new FunctionProvider();

    vscode.window
        .registerTreeDataProvider(
            'functionExplorer',
            provider
        );

    context.subscriptions.push(

        vscode.commands.registerCommand(
            'funcInfo.showFunctions',
            async () =>
            {
                provider.refresh();

                await vscode.commands.executeCommand(
                    'workbench.view.extension.funcInfoSidebar'
                );
            }
        ),

        vscode.commands.registerCommand(
            'funcInfo.jump',
            (
                symbol:
                    vscode.DocumentSymbol
            ) =>
            {
                const editor =
                    vscode.window.activeTextEditor;

                if(!editor)
                {
                    return;
                }

                editor.selection =
                    new vscode.Selection(
                        symbol.selectionRange.start,
                        symbol.selectionRange.start
                    );

                editor.revealRange(
                    symbol.range
                );
            }
        )
    );
}