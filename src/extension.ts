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
		
		this.command = {
			command:'functionInspector.openFile',
			title:'Open File',
			arguments:[this]
		};
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
            command:'functionInspector.jump',
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
	private statsCache = new Map<string, {count:number, lines:number}>();

	private view?:vscode.TreeView<any>;

	private collectStats(
		symbols:vscode.DocumentSymbol[]
	)
	{
		let count = 0;
		let lines = 0;

		const walk = (
			items:vscode.DocumentSymbol[]
		) =>
		{
			for(const s of items)
			{
				if(this.isFunction(s))
				{
					count++;

					lines +=
						s.range.end.line -
						s.range.start.line + 1;
				}

				walk(
					s.children ?? []
				);
			}
		};

		walk(symbols);

		return {count, lines};
	}

	private flattenFunctions(
		symbols:vscode.DocumentSymbol[]
	)
	{
		let results:
			vscode.DocumentSymbol[] = [];

		const walk = (
			items:vscode.DocumentSymbol[]
		) =>
		{
			for(const s of items)
			{
				if(this.isFunction(s))
				{
					results.push(s);
				}

				walk(
					s.children ?? []
				);
			}
		};

		walk(symbols);

		return results;
	}

	private async updateWorkspaceStats(
		files:vscode.Uri[]
	)
	{
		let totalFuncs = 0;
		let totalLines = 0;

		const allStats =
			await Promise.all(
				files.map(
					file =>
						this.getStats(file)
				)
			);

		for(const stats of allStats)
		{
			totalFuncs += stats.count;
			totalLines += stats.lines;
		}

		if(this.view)
		{
			this.view.message =
				`Workspace: ${totalFuncs} funcs • ${totalLines} lines`;
		}
	}

	private makeFunction(
		symbol:vscode.DocumentSymbol,
		uri:vscode.Uri
	)
	{
		return new FunctionItem(
			symbol,
			uri,
			this.showDetails
		);
	}

	private isFunction(
    	s:vscode.DocumentSymbol
	)
	{
		return (
			s.kind === vscode.SymbolKind.Function ||
			s.kind === vscode.SymbolKind.Method
		);
	}

	private symbolCache =
    	new Map<string,vscode.DocumentSymbol[]>();

	private async getSymbols(
		uri:vscode.Uri
	)
	{
		const key = uri.toString();

		if(this.symbolCache.has(key))
		{
			return this.symbolCache.get(key)!;
		}

		const symbols =
			await vscode.commands.executeCommand<
				vscode.DocumentSymbol[]
			>(
				'vscode.executeDocumentSymbolProvider',
				uri
			) || [];

		this.symbolCache.set(
			key,
			symbols
		);

		return symbols;
	}

	private async getStats(
		uri:vscode.Uri
	)
	{
		const key = uri.toString();

		if(this.statsCache.has(key))
		{
			return this.statsCache.get(key)!;
		}

		const symbols =
			await this.getSymbols(uri);

		const stats =
			this.collectStats(symbols);

		this.statsCache.set(
			key,
			stats
		);

		return stats;
	}

	clearCache(
    uri:vscode.Uri
	)
	{
		const key =
			uri.toString();

		this.symbolCache.delete(key);
		this.statsCache.delete(key);
	}

    readonly onDidChangeTreeData =
        this.refreshEmitter.event;

	setView(
		view:
			vscode.TreeView<any>
	)
	{
		this.view = view;
	}

	setFileMode()
	{
		this.scanWorkspace = false;
		this.refresh();
	}

	setFolderMode()
	{
		this.scanWorkspace = true;
		this.refresh();
	}

    refresh(clearCache = false)
	{
		if(clearCache)
		{
			this.symbolCache.clear();
			this.statsCache.clear();
		}

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

	async compare(
		a:FunctionItem,
		b:FunctionItem
	)
	{
		const docA =
			await vscode.workspace.openTextDocument(
				a.uri
			);

		const docB =
			await vscode.workspace.openTextDocument(
				b.uri
			);

		const textA =
			docA.getText(
				a.symbol.range
			);

		const textB =
			docB.getText(
				b.symbol.range
			);

		const left =
			await vscode.workspace.openTextDocument({
				content:textA
			});

		const right =
			await vscode.workspace.openTextDocument({
				content:textB
			});

		await vscode.commands.executeCommand(
			'vscode.diff',
			left.uri,
			right.uri,
			`${a.symbol.name} ↔ ${b.symbol.name}`
		);
	}

	async getChildren(
		element?:
			FunctionItem |
			DetailItem	 |
			ClassItem	 |
			FileItem	 
	)
	{
		if(element instanceof FileItem)
		{
			const symbols =
				await this.getSymbols(
					element.uri
				);

			if(!symbols)
				return [];

			return this.flattenFunctions(
				symbols
			)
			.map(
				s =>
					this.makeFunction(
						s,
						element.uri
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

			];
		}

		if(
			element instanceof ClassItem
		)
		{
			return element.symbol.children

				.filter(
					s => this.isFunction(s)
				)

				.map(
					s => this.makeFunction(s, element.uri!)
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
					'**/*.{c,cpp,h,hpp,cc,cs,py,js,ts,tsx,jsx}'
				);

			if(this.view)
			{
				this.view.message =
					'Calculating workspace stats...';
			}
			
			void this.updateWorkspaceStats(
				files
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
			await this.getSymbols(
				editor.document.uri
			);

		if(!symbols)
		{
			return [];
		}

		const stats =
			await this.getStats(
				editor.document.uri
			);

		this.view!.message =
			`${stats.count} funcs • ${stats.lines} lines`;

		let results:
		(
			FunctionItem |
			ClassItem
		)[] = [];

		for(const s of this.flattenFunctions(symbols))
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
				this.isFunction(s)
			)
			{
				results.push( this.makeFunction(s, editor.document.uri));
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
            treeDataProvider:provider,
			canSelectMany:true,
			showCollapseAll: true
        }
    );

	provider.setView(tree);

    context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(
			() =>
			{
				provider.refresh();
			}
		),

		vscode.workspace.onDidChangeTextDocument(
			e =>
			{
				provider.clearCache(
					e.document.uri
				);

				provider.refresh();
			}
		),

		vscode.workspace.onDidSaveTextDocument(
			doc =>
			{
				provider.clearCache(
					doc.uri
				);
			}
		),
		vscode.commands.registerCommand(
			'functionInspector.openFile',
			async (item:FileItem) =>
		{
			await vscode.window.showTextDocument(
				item.uri
			);
		}),

		vscode.commands.registerCommand(
			'functionInspector.compareFunction',
			async () =>
		{
			const selected =
				tree.selection.filter(
					i =>
						i instanceof FunctionItem
				);

			if(selected.length !== 2)
			{
				vscode.window.showWarningMessage(
					'Select exactly 2 functions.'
				);

				return;
			}

			provider.compare(
				selected[0],
				selected[1]
			);
		}),

		vscode.commands.registerCommand(
			'functionInspector.selectFunction',
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
			'functionInspector.copyFunction',
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
			'functionInspector.showFile',
			() =>
			{
				provider.setFileMode();
			}
		),

		vscode.commands.registerCommand(
			'functionInspector.showFolder',
			() =>
			{
				provider.setFolderMode();
			}
		),

		vscode.commands.registerCommand(
			'functionInspector.refresh',
			() =>
			{
				provider.refresh(true);
			}
		),

        vscode.commands.registerCommand(
            'functionInspector.showFunctions',
            async () =>
            {
                provider.refresh();

                await vscode.commands.executeCommand(
                    'workbench.view.extension.functionInspectorSidebar'
                );
            }
        ),

        vscode.commands.registerCommand(
            'functionInspector.jump',
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