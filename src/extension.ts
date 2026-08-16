import * as vscode from 'vscode';
import { ProviderRegistry } from './providers/ProviderRegistry';
import { DocumentSymbolAnalyzer } from './providers/DocumentSymbolAnalyzer';
import { FunctionProvider } from './FunctionProvider';
import { FunctionItem } from './FunctionItem';
import { FileItem } from './FileItem';
import { SymbolItem } from './SymbolItem';

export function activate(
    context:
        vscode.ExtensionContext
)
{

    const registry =
    new ProviderRegistry();

	registry.register(
		new DocumentSymbolAnalyzer()
	);

	const provider =
		new FunctionProvider(
			registry
		);

    const tree =
    vscode.window.createTreeView(
        'functionInspectorSidebar',
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
			}
		),

		vscode.workspace.onDidSaveTextDocument( 
			doc =>
			{
				provider.clearCache(
					doc.uri
				);
				provider.refresh();
			}
		),

		vscode.commands.registerCommand( //openFile
			'functionInspector.openFile',
			async (item:FileItem) =>
		{
			await vscode.window.showTextDocument(
				item.uri
			);
		}),

		vscode.commands.registerCommand( // compareFunctions
			'functionInspector.compareFunctions',
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

			await provider.compare(
				selected[0],
				selected[1]
			);

			vscode.window.showInformationMessage(
					`Comparing Functions`
			);
		}),

		vscode.commands.registerCommand( // selectFunction
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

				vscode.window.showInformationMessage(
					`Selected Function: ${item.symbol.name}`
				);
			}
		),

		vscode.commands.registerCommand( // copyFunctions
			'functionInspector.copyFunctions',
			async () =>
			{
				const selected =
					tree.selection.filter(
						item =>
							item instanceof SymbolItem &&
							isFunctionSymbol(item.symbol)
					);

				if(selected.length === 0)
				{
					vscode.window.showWarningMessage(
						'Select at least one function.'
					);

					return;
				}

				const parts:string[] = [];

				for(const item of selected)
				{
					const document =
						await vscode.workspace.openTextDocument(
							item.uri
						);

					parts.push(
						document.getText(
							item.symbol.range
						)
					);
				}

				await vscode.env.clipboard.writeText(
					parts.join('\n\n')
				);

				const noun =
					selected.length === 1
						? 'function'
						: 'functions';

				vscode.window.showInformationMessage(
					`Copied ${selected.length} ${noun}.`
				);
			}
		),

		vscode.commands.registerCommand( // showFile
			'functionInspector.showFile',
			() =>
			{
				provider.setFileMode();
			}
		),

		vscode.commands.registerCommand( // showFolder
			'functionInspector.showFolder',
			() =>
			{
				provider.setFolderMode();
			}
		),

		vscode.commands.registerCommand( // refresh
			'functionInspector.refresh',
			() =>
			{
				provider.refresh(true);
			}
		),

        vscode.commands.registerCommand( // showFunctions
            'functionInspector.showFunctions',
            async () =>
            {
                provider.refresh();

                await vscode.commands.executeCommand(
                    'workbench.view.extension.functionInspectorContainer'
                );
            }
        ),

        vscode.commands.registerCommand( // jump
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
        ),

		vscode.commands.registerCommand( // toggleDetails
			'functionInspector.toggleDetails',
			() =>
			{
				provider.toggleDetails();
			}
		),

		vscode.commands.registerCommand( // toggleParameters
			'functionInspector.toggleParameters',
			() =>
			{
				provider.toggleParameters();
			}
		),

		vscode.commands.registerCommand(
			'functionInspector.togglePaths',
			() =>
			{
				provider.togglePaths();
			}
		),
    );
}