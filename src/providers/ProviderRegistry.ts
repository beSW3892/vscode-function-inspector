// ProviderRegistry.ts
import * as vscode from 'vscode';

import {
    FunctionAnalyzer
} from './FunctionAnalyzer';

export class ProviderRegistry
{
    private analyzers: FunctionAnalyzer[] = [];

    register(analyzer: FunctionAnalyzer)
    {
        this.analyzers.push(analyzer);
    }

    getExtensions(): string[]
    {
        return [
            ...new Set(
                this.analyzers.flatMap(
                    analyzer => analyzer.extensions
                )
            )
        ];
    }

    async getSymbols(
        document: vscode.TextDocument
    )
    {
        const analyzer =
            this.analyzers.find(
                a => a.canHandle(document)
            );

        if (!analyzer)
        {
            return [];
        }

        return analyzer.getSymbols(document);
    }
}