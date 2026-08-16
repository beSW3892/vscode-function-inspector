import * as vscode from 'vscode';

import { FunctionItem } from './FunctionItem';
import { DetailItem } from './DetailItem';
import { ClassItem } from './ClassItem';
import { FileItem } from './FileItem';
import { ProviderRegistry } from './providers/ProviderRegistry';

export class FunctionProvider
implements vscode.TreeDataProvider<FunctionItem | DetailItem | ClassItem | FileItem>
{
    private registry: ProviderRegistry;

    private refreshEmitter =
        new vscode.EventEmitter<void>();

	private showDetails = true;
    private showParameters = true;
    private showPaths = true;

    constructor(
        registry: ProviderRegistry
    )
    {
        this.registry = registry;
    }

	private scanWorkspace = false;
	private statsCache = new Map<string, {count:number, lines:number}>();

	private view?:vscode.TreeView<any>;

	readonly onDidChangeTreeData = this.refreshEmitter.event;

	private symbolCache =
    	new Map<string,vscode.DocumentSymbol[]>();

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
    			`${files.length} files • ${totalFuncs} funcs • ${totalLines} lines`;
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

	private async getSymbols(uri: vscode.Uri)
    {
        const key = uri.toString();

        if (this.symbolCache.has(key)) {
            return this.symbolCache.get(key)!;
        }

        try {
            const document =
                await vscode.workspace.openTextDocument(uri);

            const symbols =
                await this.registry.getSymbols(document);

            this.symbolCache.set(key, symbols);

            return symbols;
        }
        catch (err) {
            console.error(err);
            return [];
        }
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

    private getWorkspacePattern()
    {
        const extensions =
            this.registry.getExtensions();

        const patterns =
            extensions.map(
                extension =>
                    `**/*${extension}`
            );

        return `{${patterns.join(",")}}`;
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

    toggleDetails()
    {
        this.showDetails =
            !this.showDetails;

        this.refresh();
    }
    
    toggleParameters()
    {
        this.showParameters =
            !this.showParameters;

        this.refresh();
    }

    togglePaths()
    {
        this.showPaths =
            !this.showPaths;

        this.refresh();
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
			`${a.symbol.name} ↔ ${b.symbol.name}`,
			{
				preview:true
			}
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
		if(element instanceof DetailItem)
		{
			return [];
		}

		if(element instanceof FileItem)
		{
			const symbols =
				await this.getSymbols(
					element.uri
				);

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

		if(element instanceof FunctionItem)
		{
			if (!this.showDetails)
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
                new DetailItem(`Lines: ${lineCount}`),
                new DetailItem(`Range: ${start}-${end}`)
            ];
		}

		if(element instanceof ClassItem)
		{
			return element.symbol.children

				.filter(
					s => this.isFunction(s)
				)

				.map(
					s => this.makeFunction(s, element.uri!)
				);
		}

		if(this.scanWorkspace) // Workspace Mode
		{
			if(!vscode.workspace.workspaceFolders)
			{
				vscode.window.showWarningMessage(
					'No workspace folder open.'
				);

				return [];
			}
            const files =
                await vscode.workspace.findFiles(
                    this.getWorkspacePattern()
                );

			if(this.view)
			{
				this.view.message =
					'Calculating workspace stats...';
			}
			
			//await this.updateWorkspaceStats(files);

			return files.map(
				file =>
					new FileItem(file)
			);
		}
		else // Active File Mode
		{
			
			const editor =
				vscode.window.activeTextEditor;

			if(!editor)
			{
				return [];
			}

			const symbols =
				await this.getSymbols(
					editor.document.uri
				);

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
}