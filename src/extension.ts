import * as vscode from 'vscode';

const output =
    vscode.window.createOutputChannel(
        "FuncInfo"
    );

class FunctionItem extends vscode.TreeItem {

    constructor(
        public readonly symbol:
            vscode.DocumentSymbol
    ) {

        const start =
            symbol.range.start.line + 1;

        const end =
            symbol.range.end.line + 1;

        const count =
            end - start + 1;

        super(
            symbol.name,
            vscode.TreeItemCollapsibleState.None
        );

        this.contextValue =
            "functionItem";

        this.description =
            `L${start}-${end} (${count} lines)`;

        this.command = {
            command:'funcInfo.jumpTo',
            title:'Jump',
            arguments:[this]
        };
    }
}

class FunctionProvider
implements vscode.TreeDataProvider<FunctionItem>
{
    private _onDidChangeTreeData =
        new vscode.EventEmitter<void>();

    readonly onDidChangeTreeData =
        this._onDidChangeTreeData.event;

    refresh() {

        this._onDidChangeTreeData.fire();

    }

    getTreeItem(
        item: FunctionItem
    ) {

        return item;

    }

    async getChildren() {

        output.appendLine(
            "GET CHILDREN CALLED"
        );

        const editor =
    vscode.window.visibleTextEditors.find(
        e =>
            e.document.uri.scheme === 'file'
    );

        if (!editor) {

            output.appendLine(
                "NO ACTIVE EDITOR"
            );

            return [];
        }

        output.appendLine(
            `FILE: ${editor.document.fileName}`
        );

        const symbols =
            await vscode.commands.executeCommand<
                vscode.DocumentSymbol[]
            >(
                'vscode.executeDocumentSymbolProvider',
                editor.document.uri
            );

        output.appendLine(
            "RAW SYMBOLS:"
        );

        output.appendLine(
            JSON.stringify(
                symbols,
                null,
                2
            )
        );

        output.show();

        if (!symbols) {

            return [];

        }

        function flatten(
            items:
                vscode.DocumentSymbol[]
        )
        :
        vscode.DocumentSymbol[]
        {

            let result:
                vscode.DocumentSymbol[] = [];

            for(const s of items)
            {
                result.push(s);

                if(
                    s.children.length > 0
                )
                {
                    result.push(
                        ...flatten(
                            s.children
                        )
                    );
                }
            }

            return result;
        }

        const flat =
            flatten(symbols);

        return flat
            .filter(
                s =>

                s.kind ===
                    vscode.SymbolKind.Function ||

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
    output.appendLine(
        "FUNCINFO ACTIVATED"
    );

    const provider =
        new FunctionProvider();

    vscode.window
        .registerTreeDataProvider(
            'functionExplorer',
            provider
        );

    vscode.window
        .onDidChangeActiveTextEditor(
            () => provider.refresh()
        );

    vscode.workspace
        .onDidSaveTextDocument(
            () => provider.refresh()
        );

    context.subscriptions.push(
		vscode.commands.registerCommand(
			'funcInfo.copyFunction',
			async (
				item: FunctionItem
			) =>
			{
				const editor =
					vscode.window.activeTextEditor;

				if(!editor)
					return;

				const text =
					editor.document.getText(
						item.symbol.range
					);

				await vscode.env.clipboard.writeText(
					text
				);

				vscode.window
					.showInformationMessage(
						`${item.symbol.name} copied`
					);
			}
		),
		vscode.commands.registerCommand(
			'funcInfo.selectFunction',
			(
				item: FunctionItem
			) =>
			{
				const editor =
					vscode.window.activeTextEditor;

				if(!editor)
					return;

				editor.selection =
					new vscode.Selection(
						item.symbol.range.start,
						item.symbol.range.end
					);

				editor.revealRange(
					item.symbol.range
				);
			}
		),

        vscode.commands.registerCommand(
            'funcInfo.showFunctions',
            () => {

                provider.refresh();

                vscode.commands.executeCommand(
                    'workbench.view.extension.funcInfo'
                );

                output.show();
            }
        ),

        vscode.commands.registerCommand(
            'funcInfo.jumpTo',
            (
                item: FunctionItem
            ) =>
            {
                const editor =
                    vscode.window
                        .activeTextEditor;

                if(!editor)
                {
                    return;
                }

                editor.selection =
                    new vscode.Selection(
                        item.symbol.selectionRange.start,
                        item.symbol.selectionRange.start
                    );

                editor.revealRange(
                    item.symbol.range
                );
            }
        )
    );
}