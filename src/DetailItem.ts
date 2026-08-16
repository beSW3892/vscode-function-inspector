import * as vscode from 'vscode';

export class DetailItem
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