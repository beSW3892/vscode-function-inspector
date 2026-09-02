// DocumentSymbolAnalyzer.ts
import * as vscode from 'vscode';
import { FunctionAnalyzer } from './FunctionAnalyzer';


export class DocumentSymbolAnalyzer
implements FunctionAnalyzer
{
    readonly id = "document-symbol";

    readonly extensions = [
        ".c",
        ".cpp",
        ".h",
        ".hpp",
        ".cc",
        ".cs",
        ".py",
        ".js",
        ".ts",
        ".tsx",
        ".jsx",
        ".rs",
        ".adb",
        ".ads"
    ];

    canHandle(document: vscode.TextDocument): boolean
    {
        const fileName = document.fileName;

        return this.extensions.some(
            extension => fileName.endsWith(extension)
        );
    }

    async getSymbols(
        document: vscode.TextDocument
    )
    {
        const symbols =
            await vscode.commands.executeCommand<
                vscode.DocumentSymbol[]
            >(
                "vscode.executeDocumentSymbolProvider",
                document.uri
            );

        return symbols ?? [];
    }
}