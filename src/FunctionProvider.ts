// FunctionProvider.ts
import * as vscode from 'vscode';

import { DetailItem } from './DetailItem';
import { FileItem } from './FileItem';
import { ProviderRegistry } from './providers/ProviderRegistry';
import { DisplayOptions } from './DisplayOptions';
import { SymbolItem } from './SymbolItem';
import {
    FileStats,
    WorkspaceStats
}
from './Stats';
export class FunctionProvider
implements vscode.TreeDataProvider<SymbolItem | DetailItem | FileItem>
{
    private registry: ProviderRegistry;

    private refreshEmitter =
        new vscode.EventEmitter<void>();

	private displayOptions: DisplayOptions =
	{
		showDetails: true,
		showParameters: true,
		showPaths: true
	};

    constructor(
        registry: ProviderRegistry
    )
    {
        this.registry = registry;
    }

	private scanWorkspace = false;
	private statsCache = new Map<string, FileStats>();

	private view?:vscode.TreeView<any>;

	readonly onDidChangeTreeData = this.refreshEmitter.event;

	private symbolCache =
    	new Map<string,vscode.DocumentSymbol[]>();

	private collectStats(
		symbols: vscode.DocumentSymbol[]
	): FileStats
	{
		let functions = 0;
		let lines = 0;

		const walk =
		(
			items: vscode.DocumentSymbol[]
		) =>
		{
			for(const symbol of items)
			{
				if(this.isFunction(symbol))
				{
					functions++;

					lines +=
						symbol.range.end.line -
						symbol.range.start.line +
						1;
				}

				walk(
					symbol.children ?? []
				);
			}
		};

		walk(symbols);

		return {
			functions,
			lines
		};
	}

	private flattenSymbols(
		symbols: vscode.DocumentSymbol[]
	)
	{
		const results:
			vscode.DocumentSymbol[] = [];

		const walk =
		(
			items: vscode.DocumentSymbol[]
		) =>
		{
			for(const symbol of items)
			{
				results.push(symbol);

				walk(
					symbol.children ?? []
				);
			}
		};

		walk(symbols);

		return results;
	}

	private async updateWorkspaceStats(
		files: vscode.Uri[]
	): Promise<void>
	{
		let totalFunctions = 0;
		let totalLines = 0;

		const stats =
			await Promise.all(
				files.map(
					file =>
						this.getStats(file)
				)
			);

		for(const fileStats of stats)
		{
			totalFunctions +=
				fileStats.functions;

			totalLines +=
				fileStats.lines;
		}

		if(this.view)
		{
			this.view.message =
				`${files.length} files • ` +
				`${totalFunctions} functions • ` +
				`${totalLines} function lines`;
		}
	}

	private makeSymbol(
		symbol: vscode.DocumentSymbol,
		uri: vscode.Uri
	)
	{
		return new SymbolItem(
			symbol,
			uri,
			this.displayOptions
		);
	}

	private isFunction(
		symbol: vscode.DocumentSymbol
	): boolean
	{
		return (
			symbol.kind === vscode.SymbolKind.Function ||
			symbol.kind === vscode.SymbolKind.Method ||
			symbol.kind === vscode.SymbolKind.Constructor
		);
	}

	private isContainer(
		symbol: vscode.DocumentSymbol
	): boolean
	{
		return (
			symbol.kind === vscode.SymbolKind.Class ||
			symbol.kind === vscode.SymbolKind.Struct ||
			symbol.kind === vscode.SymbolKind.Namespace
		);
	}

	private isDisplayableSymbol(
		symbol: vscode.DocumentSymbol
	): boolean
	{
		return (
			this.isFunction(symbol) ||
			this.isContainer(symbol)
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

    toggleDetails(): boolean
	{
		this.displayOptions.showDetails =
			!this.displayOptions.showDetails;

		this.refresh();

		return this.displayOptions.showDetails;
	}
    
    toggleParameters(): boolean
	{
		this.displayOptions.showParameters =
			!this.displayOptions.showParameters;

		this.refresh();

		return this.displayOptions.showParameters;
	}

	togglePaths(): boolean
	{
		this.displayOptions.showPaths =
			!this.displayOptions.showPaths;

		this.refresh();

		return this.displayOptions.showPaths;
	}

	private sortSymbols(
		symbols: vscode.DocumentSymbol[]
	): vscode.DocumentSymbol[]
	{
		return [...symbols].sort(
			(a, b) =>
				a.range.start.line -
				b.range.start.line
		);
	}

    getTreeItem(
	    item: SymbolItem | DetailItem | FileItem
	): vscode.TreeItem
	{
		return item;
	}

	async compare(
		a:SymbolItem,
		b:SymbolItem
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
			| SymbolItem
			| DetailItem
			| FileItem
	)
	{
		// Detail rows never have children
		if(element instanceof DetailItem)
		{
			return [];
		}

		// File → top-level symbols
		if(element instanceof FileItem)
		{
			const symbols =
				await this.getSymbols(
					element.uri
				);

			return this.sortSymbols(symbols)
				.filter(
					symbol =>
						this.isDisplayableSymbol(symbol)
				)
				.map(
					symbol =>
						this.makeSymbol(
							symbol,
							element.uri
						)
				);
		}

		// Symbol → child symbols + optional details
		if(element instanceof SymbolItem)
		{
			const children:
				(SymbolItem | DetailItem)[] =
				[];

			if(
				this.displayOptions.showDetails &&
				this.isFunction(element.symbol)
			)
			{
				const start =
					element.symbol.range.start.line + 1;

				const end =
					element.symbol.range.end.line + 1;

				children.push(
					new DetailItem(
						`Lines: ${end - start + 1}`
					)
				);

				children.push(
					new DetailItem(
						`Range: ${start}-${end}`
					)
				);
			}

			for(
				const child of element.symbol.children
			)
			{
				if(
					!this.isDisplayableSymbol(child)
				)
				{
					continue;
				}

				children.push(
					this.makeSymbol(
						child,
						element.uri
					)
				);
			}

			return children;
		}

		// ROOT
		if(this.scanWorkspace)
		{
			const files =
				await vscode.workspace.findFiles(
					this.getWorkspacePattern()
				);

			files.sort(
				(a, b) =>
					vscode.workspace
						.asRelativePath(a)
						.localeCompare(
							vscode.workspace.asRelativePath(b)
						)
			);

			void this.updateWorkspaceStats(
				files
			);

			return files.map(
				file =>
					new FileItem(
						file,
						this.displayOptions.showPaths
					)
			);
		}

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

		return this.sortSymbols(symbols)
			.filter(
				symbol =>
					this.isDisplayableSymbol(symbol)
			)
			.map(
				symbol =>
					this.makeSymbol(
						symbol,
						editor.document.uri
					)
			);
	}
}