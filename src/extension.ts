import * as vscode from 'vscode';

class ClassItem
extends vscode.TreeItem
{
    constructor(
        readonly symbol:
            vscode.DocumentSymbol,

		readonly uri:
			vscode.Uri
    )
    {
        super(
            symbol.name,
            vscode.TreeItemCollapsibleState.Collapsed
        );

        this.contextValue =
            "classItem";
    }
}

class FileItem
extends vscode.TreeItem
{
    constructor(
        readonly uri:vscode.Uri
    )
    {
        super(
            vscode.workspace.asRelativePath(uri),
            vscode.TreeItemCollapsibleState.Collapsed
        );

        this.contextValue =
            "fileItem";
    }
}

class FunctionItem
extends vscode.TreeItem
{
    constructor(
		readonly symbol:
			vscode.DocumentSymbol,
		readonly uri:
			vscode.Uri,
		readonly expanded:
			boolean
	)
    {
        super(
            symbol.name,
            expanded
                ? vscode.TreeItemCollapsibleState.Expanded
                : vscode.TreeItemCollapsibleState.Collapsed
        );

        this.contextValue =
            "functionItem";

        this.command = {
            command:'funcInfo.jump',
            title:'Jump',
            arguments:[this]
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
implements vscode.TreeDataProvider<FunctionItem | DetailItem | ClassItem | FileItem>
{
    private refreshEmitter =
        new vscode.EventEmitter<void>();

	private showDetails = true;

	private scanWorkspace = false;

	private view?:vscode.TreeView<any>;

    readonly onDidChangeTreeData =
        this.refreshEmitter.event;

	setView(
		view:
			vscode.TreeView<any>
	)
	{
		this.view = view;
	}

	toggleDetails()
	{
		this.showDetails =
			!this.showDetails;

		this.refresh();
	}

	setFileMode()
	{
		this.scanWorkspace = false;
		if(this.view)
		{
			this.view.description =
				'Active File Functions';
		}
		this.refresh();
	}

	setFolderMode()
	{
		this.scanWorkspace = true;
		if(this.view)
		{
			this.view.description =
				'Workspace Functions';
		}
		this.refresh();
	}

    refresh()
    {
        this.refreshEmitter.fire();
    }

    getTreeItem(
		item:
			FunctionItem |
			DetailItem   |
			ClassItem	 |
			FileItem
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
		if(element instanceof FileItem)
		{
			const symbols =
				await vscode.commands.executeCommand<
					vscode.DocumentSymbol[]
				>(
					'vscode.executeDocumentSymbolProvider',
					element.uri
				);

			if(!symbols)
				return [];

			return symbols
				.filter(
					s =>
						s.kind === vscode.SymbolKind.Function ||
						s.kind === vscode.SymbolKind.Method
				)
				.map(
					s =>
						new FunctionItem(
							s,
							element.uri,
							this.showDetails
						)
				);
		}
		if(
			element instanceof FunctionItem
		)
		{
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

		if(
			element instanceof ClassItem
		)
		{
			return element.symbol.children

				.filter(
					s =>

					s.kind ===
						vscode.SymbolKind.Method ||

					s.kind ===
						vscode.SymbolKind.Function
				)

				.map(
					s =>

					new FunctionItem(
						s,
						element.uri!,
						this.showDetails
					)
				);
		}

		if(this.scanWorkspace)
		{
			if(
				!vscode.workspace.workspaceFolders
			)
			{
				vscode.window.showWarningMessage(
					'No workspace folder open.'
				);

				return [];
			}

			const files =
				await vscode.workspace.findFiles(
					'**/*.{cpp,h,c,py,ts,js}'
				);

			return files.map(
				file =>
					new FileItem(file)
			);
		}

		const editor =
			vscode.window.activeTextEditor;

		if(!editor)
		{
			vscode.window.showInformationMessage( 'No Active File Open.');
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

		let results:
		(
			FunctionItem |
			ClassItem
		)[] = [];

		for(const s of symbols)
		{
			if(
				s.kind ===
				vscode.SymbolKind.Class
			)
			{
				results.push(
					new ClassItem(
						s,
						editor.document.uri
					)
				);
			}

			else if(
				s.kind ===
					vscode.SymbolKind.Function ||

				s.kind ===
					vscode.SymbolKind.Method
			)
			{
				results.push(
					new FunctionItem(
						s,
						editor.document.uri,
						this.showDetails
					)
				);
			}
		}

		return results;
	}
}

export function activate(
    context:
        vscode.ExtensionContext
)
{
    const provider =
        new FunctionProvider();

    const tree =
    vscode.window.createTreeView(
        'functionExplorer',
        {
            treeDataProvider:
                provider
        }
    );

	provider.setView(tree);

    context.subscriptions.push(
		vscode.commands.registerCommand(
			'funcInfo.selectFunction',
			async (
				item: FunctionItem
			) =>
			{
				const editor =
					await vscode.window.showTextDocument(
						item.uri
					);

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
			'funcInfo.copyFunction',
			async (
				item: FunctionItem
			) =>
			{
				const doc =
					await vscode.workspace.openTextDocument(
						item.uri
					);

				const text =
					doc.getText(
						item.symbol.range
					);

				await vscode.env.clipboard
					.writeText(text);
			}
		),

		vscode.commands.registerCommand(
			'funcInfo.showFile',
			() =>
			{
				provider.setFileMode();
			}
		),

		vscode.commands.registerCommand(
			'funcInfo.showFolder',
			() =>
			{
				provider.setFolderMode();
			}
		),

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
            async (
                item: FunctionItem
            ) =>
            {
                const editor =
					await vscode.window.showTextDocument(
						item.uri
					);

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