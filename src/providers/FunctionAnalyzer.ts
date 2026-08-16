import * as vscode from 'vscode';

export interface FunctionAnalyzer
{
    readonly id: string;

    readonly extensions: readonly string[];

    canHandle(
        document: vscode.TextDocument
    ): boolean;

    getSymbols(
        document: vscode.TextDocument
    ): Promise<vscode.DocumentSymbol[]>;
}