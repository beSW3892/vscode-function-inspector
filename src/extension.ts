import * as vscode from 'vscode';

class FunctionItem
extends vscode.TreeItem
{
    constructor(
        readonly symbol:
            vscode.DocumentSymbol,
			readonly expanded:
            boolean
    )
    {
        super(
            symbol.name,
            expanded
                ? vscode.TreeItemCollapsibleState.Expanded
                : vscode.TreeItemCollapsibleState.None
        );

        this.contextValue =
            "functionItem";

        this.command = {
            command:'funcInfo.jump',
            title:'Jump',
            arguments:[symbol]
        };
    }
}

class DetailItem
extends vscode.TreeItem
{
    constructor(
        label:string
    )
    {
        super(
            label,
            vscode.TreeItemCollapsibleState.None
        );
    }
}

class FunctionProvider
implements vscode.TreeDataProvider<FunctionItem | DetailItem>
{
    private refreshEmitter =
        new vscode.EventEmitter<void>();

	private showDetails = true;

    readonly onDidChangeTreeData =
        this.refreshEmitter.event;

	toggleDetails()
	{
		this.showDetails =
			!this.showDetails;

		this.refresh();
	}

    refresh()
    {
        this.refreshEmitter.fire();
    }

    getTreeItem(
		item:
			FunctionItem |
			DetailItem
	)
	{
		return item;
	}

	async getChildren(
		element?:
			FunctionItem |
			DetailItem
	)
	{
		//
		// CHILDREN OF FUNCTION NODE
		//
		if(
			element instanceof FunctionItem
		)
		{
			if(!this.showDetails)
			{
				return [];
			}

			const start =
				element.symbol.range.start.line + 1;

			const end =
				element.symbol.range.end.line + 1;

			const lineCount =
				end - start + 1;

			return [

				new DetailItem(
					`Lines: ${lineCount}`
				),

				new DetailItem(
					`Range: ${start}-${end}`
				),

				new DetailItem(
					`Comments: TODO`
				)

			];
		}

		//
		// ROOT LEVEL
		//

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
					vscode.SymbolKind.Function ||

				s.kind ===
					vscode.SymbolKind.Method
			)
			.map(
				s =>
					new FunctionItem(
						s,
						this.showDetails
					)
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
			'funcInfo.refresh',
			() =>
			{
				provider.refresh();
			}
		),

		vscode.commands.registerCommand(
			'funcInfo.toggleDetails',
			() =>
			{
				provider.toggleDetails();
			}
		),

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